import { Router, Request, Response } from 'express';
import { optionalAuth, authenticateToken } from '../middleware/auth';
import { updateProgress, getProgress, getAllProgress } from '../services/progress.service';

const router = Router();

// Helper function to validate UUID format
function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * POST /api/progress
 * Update reading progress
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { bookId, page, totalPages } = req.body;

        if (!bookId || page === undefined) {
            return res.status(400).json({ error: 'bookId and page are required' });
        }

        if (!isValidUUID(bookId)) {
            return res.status(400).json({ error: 'Invalid bookId format' });
        }

        await updateProgress(userId, bookId, page, totalPages);

        res.json({ message: 'Progress updated', page });
    } catch (error: any) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Failed to update progress', message: error.message });
    }
});

/**
 * GET /api/progress/:bookId
 * Get reading progress for a specific book
 */
router.get('/:bookId', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { bookId } = req.params;

        if (!isValidUUID(bookId)) {
            return res.status(400).json({ error: 'Invalid bookId format' });
        }

        const progress = await getProgress(userId, bookId);

        res.json({ progress: progress || { currentPage: 1, totalPages: null, lastReadAt: null } });
    } catch (error: any) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: 'Failed to get progress', message: error.message });
    }
});

/**
 * GET /api/progress
 * Get all reading progress for the authenticated user
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const progress = await getAllProgress(userId);
        res.json({ progress });
    } catch (error: any) {
        console.error('Get all progress error:', error);
        res.status(500).json({ error: 'Failed to get progress', message: error.message });
    }
});

export default router;
