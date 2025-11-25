import { Router, Request, Response } from 'express';
import { ragQuery, ragQueryWithContext } from '../services/rag.service';
import { query } from '../db';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Helper function to validate UUID format
function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * POST /api/query
 * Perform a RAG query
 */
router.post('/', optionalAuth, async (req: Request, res: Response) => {
    try {
        // Get user ID from JWT token if available, otherwise use body
        const userId = req.user?.userId || req.body.userId;
        const { query: userQuery, bookId, k, persona } = req.body;

        if (!userQuery) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Get user memory/preferences if userId provided (only if valid UUID)
        let userMemory: string | undefined;
        if (userId && isValidUUID(userId)) {
            try {
                const memoryResult = await query(
                    `SELECT quote_text, memory_type, metadata 
             FROM user_memory 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 5`,
                    [userId]
                );

                if (memoryResult.rows.length > 0) {
                    userMemory = memoryResult.rows
                        .map((m) => `${m.memory_type}: ${m.quote_text || JSON.stringify(m.metadata)}`)
                        .join('; ');
                }
            } catch (error) {
                console.warn('Failed to fetch user memory:', error);
            }
        }

        // Perform RAG query
        const response = await ragQuery(userQuery, {
            bookId,
            userId,
            k: k || 5,
            persona: persona || 'friend',
            userMemory,
        });

        res.json({
            answer: response.answerText,
            citations: response.citations,
            confidence: response.confidence,
        });
    } catch (error: any) {
        console.error('Query error:', error);
        res.status(500).json({
            error: 'Failed to process query',
            message: error.message,
        });
    }
});

/**
 * POST /api/chat/:convId/message
 * Send a message in a conversation
 */
router.post('/:convId/message', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { convId } = req.params;
        // Get user ID from JWT token if available, otherwise use body
        const userId = req.user?.userId || req.body.userId;
        const { message, bookId, persona } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get conversation history
        const convResult = await query(
            `SELECT messages FROM conversations WHERE id = $1`,
            [convId]
        );

        let messages: Array<{ role: string; content: string }> = [];

        if (convResult.rows.length > 0) {
            messages = convResult.rows[0].messages || [];
        }

        // Add user message to history
        messages.push({ role: 'user', content: message });

        // Get user memory (only if valid UUID)
        let userMemory: string | undefined;
        if (userId && isValidUUID(userId)) {
            try {
                const memoryResult = await query(
                    `SELECT quote_text, memory_type FROM user_memory WHERE user_id = $1 LIMIT 5`,
                    [userId]
                );

                if (memoryResult.rows.length > 0) {
                    userMemory = memoryResult.rows
                        .map((m) => `${m.memory_type}: ${m.quote_text}`)
                        .join('; ');
                }
            } catch (error) {
                console.warn('Failed to fetch user memory:', error);
            }
        }

        // Perform RAG query with conversation context
        const response = await ragQueryWithContext(message, messages, {
            bookId,
            userId,
            persona: persona || 'friend',
            userMemory,
        });

        // Add assistant response to history
        messages.push({ role: 'assistant', content: response.answerText });

        // Update conversation in database
        if (convResult.rows.length > 0) {
            await query(
                `UPDATE conversations SET messages = $1, updated_at = NOW() WHERE id = $2`,
                [JSON.stringify(messages), convId]
            );
        } else {
            // Create new conversation (only set user_id if it's a valid UUID)
            const validUserId = userId && isValidUUID(userId) ? userId : null;
            await query(
                `INSERT INTO conversations (id, user_id, messages, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
                [convId, validUserId, JSON.stringify(messages)]
            );
        }

        res.json({
            conversationId: convId,
            message: {
                role: 'assistant',
                content: response.answerText,
                citations: response.citations,
                confidence: response.confidence,
            },
        });
    } catch (error: any) {
        console.error('Chat error:', error);
        res.status(500).json({
            error: 'Failed to process message',
            message: error.message,
        });
    }
});

/**
 * GET /api/chat/:convId
 * Get conversation history
 */
router.get('/:convId', async (req: Request, res: Response) => {
    try {
        const { convId } = req.params;

        const result = await query(
            `SELECT id, user_id, title, messages, created_at, updated_at
       FROM conversations
       WHERE id = $1`,
            [convId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const conversation = result.rows[0];

        res.json({
            id: conversation.id,
            userId: conversation.user_id,
            title: conversation.title,
            messages: conversation.messages || [],
            createdAt: conversation.created_at,
            updatedAt: conversation.updated_at,
        });
    } catch (error: any) {
        console.error('Get conversation error:', error);
        res.status(500).json({
            error: 'Failed to get conversation',
            message: error.message,
        });
    }
});

export default router;
