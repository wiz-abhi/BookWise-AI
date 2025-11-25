import { Router, Request, Response } from 'express';
import { query } from '../db';
import { optionalAuth, authenticateToken } from '../middleware/auth';
import { deleteFile } from '../services/storage.service';

const router = Router();

// Helper function to validate UUID format
function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * POST /api/user/memory
 * Save user memory (quotes, preferences, goals)
 */
router.post('/memory', optionalAuth, async (req: Request, res: Response) => {
    try {
        // Get user ID from JWT token if available, otherwise use body
        const userId = req.user?.userId || req.body.userId;
        const { bookId, quoteText, page, memoryType, metadata } = req.body;

        if (!userId || !memoryType) {
            return res.status(400).json({ error: 'userId and memoryType are required' });
        }

        // Validate UUIDs before inserting
        const validUserId = userId && isValidUUID(userId) ? userId : null;
        const validBookId = bookId && isValidUUID(bookId) ? bookId : null;

        if (!validUserId) {
            return res.status(400).json({ error: 'Valid UUID required for userId' });
        }

        const result = await query(
            `INSERT INTO user_memory (user_id, book_id, quote_text, page, memory_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
            [validUserId, validBookId, quoteText || null, page || null, memoryType, JSON.stringify(metadata || {})]
        );

        res.status(201).json({
            message: 'Memory saved successfully',
            memoryId: result.rows[0].id,
            createdAt: result.rows[0].created_at,
        });
    } catch (error: any) {
        console.error('Save memory error:', error);
        res.status(500).json({
            error: 'Failed to save memory',
            message: error.message,
        });
    }
});

/**
 * GET /api/book/:id/quotes
 * Get saved quotes for a book
 */
router.get('/:id/quotes', async (req: Request, res: Response) => {
    try {
        const { id: bookId } = req.params;
        const { userId } = req.query;

        let sql = `
      SELECT um.id, um.quote_text, um.page, um.metadata, um.created_at,
             b.title as book_title, b.author
      FROM user_memory um
      JOIN books b ON um.book_id = b.id
      WHERE um.book_id = $1 AND um.memory_type = 'quote'
    `;

        const params: any[] = [bookId];

        // Only add userId filter if it's a valid UUID
        if (userId && isValidUUID(userId as string)) {
            sql += ` AND um.user_id = $2`;
            params.push(userId);
        }

        sql += ` ORDER BY um.created_at DESC`;

        const result = await query(sql, params);

        res.json({
            bookId,
            quotes: result.rows.map((row) => ({
                id: row.id,
                text: row.quote_text,
                page: row.page,
                metadata: row.metadata,
                bookTitle: row.book_title,
                author: row.author,
                createdAt: row.created_at,
            })),
        });
    } catch (error: any) {
        console.error('Get quotes error:', error);
        res.status(500).json({
            error: 'Failed to get quotes',
            message: error.message,
        });
    }
});

/**
 * GET /api/user/library
 * Get all books (public library) with ownership status
 */
router.get('/library', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;

        // Fetch ALL books, ordered by creation date
        const result = await query(
            `SELECT id, title, author, language, total_pages, file_type, uploaded_by, created_at
       FROM books
       ORDER BY created_at DESC`
        );

        res.json({
            books: result.rows.map((row) => ({
                id: row.id,
                title: row.title,
                author: row.author,
                language: row.language,
                fileType: row.file_type,
                totalPages: row.total_pages,
                createdAt: row.created_at,
                isOwner: row.uploaded_by === userId || row.uploaded_by === null, // Allow deletion if owner or orphan
                uploadedBy: row.uploaded_by
            })),
        });
    } catch (error: any) {
        console.error('Get library error:', error);
        res.status(500).json({
            error: 'Failed to get library',
            message: error.message,
        });
    }
});

/**
 * DELETE /api/user/book/:id
 * Delete a book (only if owner)
 */
router.delete('/book/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        // Check ownership
        const bookResult = await query(
            'SELECT uploaded_by, file_uri FROM books WHERE id = $1',
            [id]
        );

        if (bookResult.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        const book = bookResult.rows[0];

        // Allow deletion if:
        // 1. User is the owner
        // 2. Book has no owner (uploaded_by is NULL)
        if (book.uploaded_by !== userId && book.uploaded_by !== null) {
            return res.status(403).json({ error: 'You do not have permission to delete this book' });
        }

        // Delete file from storage
        try {
            await deleteFile(book.file_uri);
        } catch (err) {
            console.error('Failed to delete file from storage:', err);
        }

        // Delete from database (CASCADE will handle chunks, memory, jobs)
        await query('DELETE FROM books WHERE id = $1', [id]);

        res.json({ message: 'Book deleted successfully' });
    } catch (error: any) {
        console.error('Delete book error:', error);
        res.status(500).json({
            error: 'Failed to delete book',
            message: error.message,
        });
    }
});

/**
 * GET /api/user/:userId/library
 * Get user's book library
 */
router.get('/:userId/library', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // Validate userId is a UUID
        if (!isValidUUID(userId)) {
            return res.json({ books: [] }); // Return empty library for non-UUID users
        }

        const result = await query(
            `SELECT id, title, author, language, total_pages, file_type, created_at
       FROM books
       WHERE uploaded_by = $1
       ORDER BY created_at DESC`,
            [userId]
        );

        res.json({
            books: result.rows.map((row) => ({
                id: row.id,
                title: row.title,
                author: row.author,
                language: row.language,
                fileType: row.file_type,
                totalPages: row.total_pages,
                createdAt: row.created_at,
            })),
        });
    } catch (error: any) {
        console.error('Get library error:', error);
        res.status(500).json({
            error: 'Failed to get library',
            message: error.message,
        });
    }
});

export default router;
