import { Router, Request, Response } from 'express';
import multer from 'multer';
import { uploadFile } from '../services/storage.service';
import { query } from '../db';
import { createIngestionJob } from '../services/ingestion.service';
import { optionalAuth, authenticateToken } from '../middleware/auth';

const router = Router();

// Helper function to validate UUID format
function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

// Configure multer for file upload (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/epub+zip', 'text/plain'];
        const allowedExtensions = ['.pdf', '.epub', '.txt'];

        const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

        if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, EPUB, and TXT files are allowed.'));
        }
    },
});

/**
 * POST /api/upload
 * Upload a book file
 */
router.post('/', optionalAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
        console.log('--- Upload Debug ---');
        console.log('Auth Header:', req.headers['authorization'] ? 'Present' : 'Missing');
        console.log('req.user:', req.user);
        console.log('req.body.userId:', req.body.userId);

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Determine effective User ID
        // 1. Authenticated user (req.user.userId) - TRUSTED
        // 2. Body userId (req.body.userId) - UNTRUSTED (validate UUID)
        let effectiveUserId = null;
        if (req.user?.userId) {
            effectiveUserId = req.user.userId;
        } else if (req.body.userId && isValidUUID(req.body.userId)) {
            effectiveUserId = req.body.userId;
        }

        // Note: We allow upload even if effectiveUserId is null (anonymous upload)

        const { originalname, buffer, size, mimetype } = req.file;

        // Determine file type
        const ext = originalname.toLowerCase().substring(originalname.lastIndexOf('.') + 1);
        const fileType = ext === 'epub' ? 'epub' : ext === 'txt' ? 'txt' : 'pdf';

        // Upload file to storage (use effectiveUserId or 'anonymous')
        const fileUri = await uploadFile(buffer, originalname, effectiveUserId || 'anonymous');

        // Extract metadata from request
        const title = req.body.title || originalname.replace(/\.[^/.]+$/, '');

        // Author logic: NULL if not explicitly provided (as requested by user)
        const author = req.body.author || null;

        const language = req.body.language || 'en';

        // Insert book record into database
        const bookResult = await query(
            `INSERT INTO books (title, author, language, file_uri, file_type, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, author, created_at`,
            [title, author, language, fileUri, fileType, size, effectiveUserId]
        );

        const book = bookResult.rows[0];

        // Create ingestion job
        const jobId = await createIngestionJob(book.id, fileUri, fileType);

        res.status(201).json({
            message: 'File uploaded successfully',
            book: {
                id: book.id,
                title: book.title,
                author: book.author,
                createdAt: book.created_at,
            },
            ingestionJobId: jobId,
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Failed to upload file',
            message: error.message,
        });
    }
});

/**
 * GET /api/ingest/status/:jobId
 * Get ingestion job status
 */
router.get('/status/:jobId', async (req: Request, res: Response) => {
    try {
        const { jobId } = req.params;

        const result = await query(
            `SELECT id, book_id, status, progress, total_chunks, error_message, created_at, updated_at
       FROM ingestion_jobs
       WHERE id = $1`,
            [jobId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ingestion job not found' });
        }

        const job = result.rows[0];

        res.json({
            jobId: job.id,
            bookId: job.book_id,
            status: job.status,
            progress: job.progress,
            totalChunks: job.total_chunks,
            errorMessage: job.error_message,
            createdAt: job.created_at,
            updatedAt: job.updated_at,
        });
    } catch (error: any) {
        console.error('Status check error:', error);
        res.status(500).json({
            error: 'Failed to check ingestion status',
            message: error.message,
        });
    }
});

export default router;
