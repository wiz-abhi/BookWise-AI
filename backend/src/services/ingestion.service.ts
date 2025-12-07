import Queue from 'bull';
import { downloadFile } from './storage.service';
import { parseDocument } from './parser.service';
import { chunkDocument } from './chunking.service';
import { generateEmbeddings } from './embedding.service';
import { query } from '../db';

// Create Bull queue for ingestion jobs
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Configure Redis options for Upstash/Production
const redisOptions = {
    maxRetriesPerRequest: null, // Required for Bull
    enableReadyCheck: false,
    tls: redisUrl.startsWith('rediss://') ? {
        rejectUnauthorized: false // Necessary for some hosted Redis if certs aren't perfect, or remove if strict security needed
    } : undefined
};

// Create Bull queue for ingestion jobs
const ingestionQueue = new Queue('book-ingestion', redisUrl, {
    redis: redisOptions
});

/**
 * Create an ingestion job
 */
export async function createIngestionJob(
    bookId: string,
    fileUri: string,
    fileType: string
): Promise<string> {
    // Create job record in database
    const result = await query(
        `INSERT INTO ingestion_jobs (book_id, status, progress)
     VALUES ($1, 'pending', 0)
     RETURNING id`,
        [bookId]
    );

    const jobId = result.rows[0].id;

    // Add job to queue
    await ingestionQueue.add({
        jobId,
        bookId,
        fileUri,
        fileType,
    });

    console.log(`📋 Created ingestion job ${jobId} for book ${bookId}`);

    return jobId;
}

/**
 * Process ingestion job
 */
ingestionQueue.process(async (job) => {
    const { jobId, bookId, fileUri, fileType } = job.data;

    console.log(`🔄 Processing ingestion job ${jobId} for book ${bookId}`);

    try {
        // Update job status to processing
        await query(
            `UPDATE ingestion_jobs SET status = 'processing', updated_at = NOW() WHERE id = $1`,
            [jobId]
        );

        // Step 1: Download file from storage
        console.log(`📥 Downloading file: ${fileUri}`);
        const fileBuffer = await downloadFile(fileUri);
        await updateJobProgress(jobId, 10);

        // Step 2: Parse document
        console.log(`📄 Parsing ${fileType} document`);
        const parsedDoc = await parseDocument(fileBuffer, fileType);
        await updateJobProgress(jobId, 30);

        // Update book metadata
        await query(
            `UPDATE books SET 
        title = COALESCE(NULLIF(title, ''), $1),
        author = COALESCE(author, $2),
        total_pages = $3,
        chapters = $4
       WHERE id = $5`,
            [
                parsedDoc.metadata.title || 'Untitled',
                parsedDoc.metadata.author,
                parsedDoc.metadata.totalPages,
                JSON.stringify(parsedDoc.pages.map(p => ({ page: p.pageNumber, chapter: p.chapter }))),
                bookId,
            ]
        );

        // Step 3: Chunk text
        console.log(`✂️ Chunking text into overlapping windows`);
        const chunks = chunkDocument(parsedDoc.pages, 400, 20);
        await updateJobProgress(jobId, 50);

        console.log(`📦 Created ${chunks.length} chunks`);

        // Update total chunks in job
        await query(
            `UPDATE ingestion_jobs SET total_chunks = $1 WHERE id = $2`,
            [chunks.length, jobId]
        );

        // Step 4: Generate embeddings
        console.log(`🧠 Generating embeddings for ${chunks.length} chunks`);
        const texts = chunks.map(c => c.text);
        const embeddings = await generateEmbeddings(texts);
        await updateJobProgress(jobId, 80);

        // Step 5: Store chunks and embeddings in database
        console.log(`💾 Storing chunks in database`);

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = embeddings[i];

            await query(
                `INSERT INTO chunks (book_id, chapter, page, chunk_index, text, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    bookId,
                    chunk.chapter || null,
                    chunk.page || null,
                    chunk.chunkIndex,
                    chunk.text,
                    JSON.stringify(embedding), // pgvector will handle the conversion
                    JSON.stringify(chunk.metadata || {}),
                ]
            );

            // Update progress periodically
            if (i % 10 === 0) {
                const progress = 80 + Math.floor((i / chunks.length) * 20);
                await updateJobProgress(jobId, progress);
            }
        }

        // Mark job as completed
        await query(
            `UPDATE ingestion_jobs SET status = 'completed', progress = 100, updated_at = NOW() WHERE id = $1`,
            [jobId]
        );

        console.log(`✅ Ingestion job ${jobId} completed successfully`);
    } catch (error: any) {
        console.error(`❌ Ingestion job ${jobId} failed:`, error);

        // Mark job as failed
        await query(
            `UPDATE ingestion_jobs SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2`,
            [error.message, jobId]
        );

        throw error;
    }
});

/**
 * Update job progress
 */
async function updateJobProgress(jobId: string, progress: number): Promise<void> {
    await query(
        `UPDATE ingestion_jobs SET progress = $1, updated_at = NOW() WHERE id = $2`,
        [progress, jobId]
    );
}

// Log queue events
ingestionQueue.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
});

ingestionQueue.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
});

export default ingestionQueue;
