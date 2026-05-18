import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMS = 768; // Match our pgvector column: vector(768)

// Free tier: ~1500 RPM. Process sequentially in small batches with delays.
const BATCH_SIZE = 5;       // Only 5 concurrent requests at a time
const DELAY_MS = 500;       // 500ms pause between batches to stay under rate limit

/**
 * Generate embeddings for text using Gemini gemini-embedding-001
 * Rate-limit aware: processes in small sequential batches.
 * @param texts - Array of text strings to embed
 * @returns Array of embedding vectors (768 dimensions each)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
        const embeddings: number[][] = [];
        const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

        for (let i = 0; i < texts.length; i += BATCH_SIZE) {
            const batch = texts.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

            if (batchNumber % 20 === 1 || batchNumber === totalBatches) {
                console.log(
                    `Generating embeddings: batch ${batchNumber}/${totalBatches} (${embeddings.length + batch.length}/${texts.length} texts)`
                );
            }

            // Process this small batch concurrently
            const batchEmbeddings = await Promise.all(
                batch.map(async (text) => {
                    const result = await ai.models.embedContent({
                        model: EMBEDDING_MODEL,
                        contents: text,
                        config: {
                            taskType: 'RETRIEVAL_DOCUMENT',
                            outputDimensionality: EMBEDDING_DIMS,
                        },
                    });
                    return result.embeddings![0].values!;
                })
            );

            embeddings.push(...batchEmbeddings);

            // Delay between batches to stay under rate limit
            if (i + BATCH_SIZE < texts.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }
        }

        console.log(`✅ Generated ${embeddings.length} embeddings via ${EMBEDDING_MODEL} (${EMBEDDING_DIMS}d)`);
        return embeddings;
    } catch (error: any) {
        // If we hit 429, wait and retry once
        if (error?.status === 429) {
            console.warn('⚠️ Rate limited by Gemini API. Waiting 60s before retry...');
            await new Promise(resolve => setTimeout(resolve, 60000));
            return generateEmbeddings(texts); // Retry the full call
        }
        console.error('Embedding generation error:', error);
        throw new Error('Failed to generate embeddings');
    }
}

/**
 * Generate a single embedding for a query
 * Uses RETRIEVAL_QUERY task type for queries (different from document embeddings)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const result = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
        config: {
            taskType: 'RETRIEVAL_QUERY',
            outputDimensionality: EMBEDDING_DIMS,
        },
    });
    return result.embeddings![0].values!;
}
