import { Router, Request, Response } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { getBookCharacters, getCharacterById } from '../services/character.service';
import { getProgress } from '../services/progress.service';
import { getModePrompt, ExperienceMode } from '../services/prompts.service';
import { searchAndRerank } from '../services/vectordb.service';
import { generateStructuredResponse, generateStructuredResponseStream, Citation } from '../services/llm.service';
import { query } from '../db';

const router = Router();

// Helper function to validate UUID format
function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * GET /api/mode/characters/:bookId
 * Get all extracted characters for a book
 */
router.get('/characters/:bookId', async (req: Request, res: Response) => {
    try {
        const { bookId } = req.params;
        if (!isValidUUID(bookId)) {
            return res.status(400).json({ error: 'Invalid bookId' });
        }

        const characters = await getBookCharacters(bookId);
        res.json({ characters });
    } catch (error: any) {
        console.error('Get characters error:', error);
        res.status(500).json({ error: 'Failed to get characters', message: error.message });
    }
});

/**
 * Core mode query handler — shared logic across all modes
 */
async function handleModeQuery(
    mode: ExperienceMode,
    bookId: string,
    userQuery: string,
    userId: string,
    res: Response,
    options: {
        characterId?: string;
        characterIds?: string[];
        sceneDescription?: string;
        action?: string;
        scenario?: string;
        conversationHistory?: Array<{ role: string; content: string }>;
    } = {}
) {
    // 1. Fetch book info
    const bookResult = await query('SELECT title, author, total_pages FROM books WHERE id = $1', [bookId]);
    if (bookResult.rows.length === 0) {
        throw new Error('Book not found');
    }
    const book = bookResult.rows[0];

    // 2. Fetch character(s) if needed
    let character = undefined;
    let characters = undefined;

    if (options.characterId) {
        character = await getCharacterById(options.characterId) || undefined;
    }

    if (options.characterIds && options.characterIds.length > 0) {
        const allChars = await getBookCharacters(bookId);
        characters = allChars.filter(c => options.characterIds!.includes(c.id));
    }

    // 3. Fetch reading progress (for companion mode)
    let currentPage: number | undefined;
    let totalPages: number | undefined;

    if (mode === 'companion') {
        const progress = await getProgress(userId, bookId);
        currentPage = progress?.currentPage;
        totalPages = progress?.totalPages || book.total_pages || undefined;
    }

    // 4. Build mode-specific system prompt
    const systemPrompt = getModePrompt(mode, {
        bookTitle: book.title,
        bookAuthor: book.author,
        currentPage,
        totalPages,
        character,
        characters,
        sceneDescription: options.sceneDescription,
        action: options.action,
        scenario: options.scenario,
    });

    // 5. RAG search — filter by book, and optionally by page range for companion mode
    const searchOptions: any = {
        bookId,
        limit: 8,
        minSimilarity: 0.25,
    };

    // For companion mode, only retrieve chunks up to the reader's current page
    if (mode === 'companion' && currentPage) {
        searchOptions.maxPage = currentPage;
    }

    const searchResults = await searchAndRerank(userQuery, searchOptions);

    // 6. Build context + citations
    const citations: Citation[] = [];
    const contextParts: string[] = [];

    searchResults.forEach((result, index) => {
        citations.push({
            bookId: result.bookId,
            bookTitle: result.bookTitle,
            page: result.page,
            chapter: result.chapter,
            excerpt: result.text.substring(0, 250),
        });

        const citationNum = index + 1;
        const pageInfo = result.page ? `Page ${result.page}` : 'Unknown Page';
        const chapterInfo = result.chapter ? `, Chapter: ${result.chapter}` : '';
        contextParts.push(
            `[${citationNum}] From "${result.bookTitle}" (${pageInfo}${chapterInfo}):\n${result.text}\n`
        );
    });

    const context = contextParts.join('\n---\n\n');

    // 7. Add character context if available
    let enrichedContext = context;
    if (character) {
        enrichedContext = `CHARACTER PROFILE:\nName: ${character.name}\nDescription: ${character.description}\nPersonality: ${character.traits.personality?.join(', ')}\nMotivations: ${character.traits.motivations?.join(', ')}\nRelationships: ${character.relationships?.map(r => `${r.name} (${r.type}): ${r.description}`).join('; ')}\n\n---\n\nBOOK EXCERPTS:\n${context}`;
    }

    // Send citations to the client immediately
    res.write(`data: ${JSON.stringify({ type: 'metadata', citations })}\n\n`);

    // 8. Add conversation history to prompt if available
    let fullPrompt = systemPrompt;
    if (options.conversationHistory && options.conversationHistory.length > 0) {
        const recentHistory = options.conversationHistory.slice(-6);
        const historyStr = recentHistory.map(m => `${m.role}: ${m.content}`).join('\n');
        fullPrompt += `\n\nRecent conversation:\n${historyStr}`;
    }

    // 9. Generate LLM response stream
    const response = await generateStructuredResponseStream(
        userQuery,
        enrichedContext,
        citations,
        (chunk) => {
            res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
        },
        fullPrompt
    );

    return response;
}

/**
 * POST /api/mode/companion
 * Companion mode — reading buddy who's read up to your current page
 */
router.post('/companion', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { bookId, query: userQuery, conversationId } = req.body;

        if (!bookId || !userQuery) {
            return res.status(400).json({ error: 'bookId and query are required' });
        }

        // Get conversation history if convId provided
        let conversationHistory: any[] = [];
        if (conversationId) {
            const convResult = await query(
                'SELECT messages FROM conversations WHERE id = $1',
                [conversationId]
            );
            if (convResult.rows.length > 0) {
                conversationHistory = convResult.rows[0].messages || [];
            }
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const response = await handleModeQuery('companion', bookId, userQuery, userId, res, {
            conversationHistory,
        });

        // Save to conversation if convId provided
        if (conversationId) {
            const messages = [
                ...conversationHistory,
                { role: 'user', content: userQuery },
                { role: 'assistant', content: response.answerText },
            ];

            const convExists = await query('SELECT id FROM conversations WHERE id = $1', [conversationId]);
            if (convExists.rows.length > 0) {
                await query(
                    'UPDATE conversations SET messages = $1, updated_at = NOW() WHERE id = $2',
                    [JSON.stringify(messages), conversationId]
                );
            } else {
                await query(
                    `INSERT INTO conversations (id, user_id, book_id, mode, messages, created_at, updated_at)
                     VALUES ($1, $2, $3, 'companion', $4, NOW(), NOW())`,
                    [conversationId, userId, bookId, JSON.stringify(messages)]
                );
            }
        }

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
    } catch (error: any) {
        console.error('Companion mode error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to process companion query', message: error.message });
        } else {
            res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
            res.end();
        }
    }
});

/**
 * POST /api/mode/character
 * Character Voice mode — talk to a character in-character
 */
router.post('/character', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { bookId, characterId, query: userQuery, conversationId } = req.body;

        if (!bookId || !characterId || !userQuery) {
            return res.status(400).json({ error: 'bookId, characterId, and query are required' });
        }

        let conversationHistory: any[] = [];
        if (conversationId) {
            const convResult = await query(
                'SELECT messages FROM conversations WHERE id = $1',
                [conversationId]
            );
            if (convResult.rows.length > 0) {
                conversationHistory = convResult.rows[0].messages || [];
            }
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const response = await handleModeQuery('character_voice', bookId, userQuery, userId, res, {
            characterId,
            conversationHistory,
        });

        if (conversationId) {
            const messages = [
                ...conversationHistory,
                { role: 'user', content: userQuery },
                { role: 'assistant', content: response.answerText },
            ];
            const convExists = await query('SELECT id FROM conversations WHERE id = $1', [conversationId]);
            if (convExists.rows.length > 0) {
                await query('UPDATE conversations SET messages = $1, updated_at = NOW() WHERE id = $2',
                    [JSON.stringify(messages), conversationId]);
            } else {
                await query(
                    `INSERT INTO conversations (id, user_id, book_id, character_id, mode, messages, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, 'character_voice', $5, NOW(), NOW())`,
                    [conversationId, userId, bookId, characterId, JSON.stringify(messages)]
                );
            }
        }

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
    } catch (error: any) {
        console.error('Character voice mode error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to process character query', message: error.message });
        } else {
            res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
            res.end();
        }
    }
});

/**
 * POST /api/mode/pov
 * Multi-POV Replay mode — scene from multiple perspectives
 */
router.post('/pov', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { bookId, characterIds, sceneDescription } = req.body;

        if (!bookId || !characterIds?.length || !sceneDescription) {
            return res.status(400).json({ error: 'bookId, characterIds, and sceneDescription are required' });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const response = await handleModeQuery('multi_pov', bookId, sceneDescription, userId, res, {
            characterIds,
            sceneDescription,
        });

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
    } catch (error: any) {
        console.error('Multi-POV mode error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to process POV query', message: error.message });
        } else {
            res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
            res.end();
        }
    }
});

/**
 * POST /api/mode/motive
 * Motive Decoder mode — deep character psychology analysis
 */
router.post('/motive', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { bookId, characterId, action, query: userQuery } = req.body;

        if (!bookId || !characterId) {
            return res.status(400).json({ error: 'bookId and characterId are required' });
        }

        const searchQuery = action || userQuery || `Why did this character do what they did?`;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const response = await handleModeQuery('motive_decoder', bookId, searchQuery, userId, res, {
            characterId,
            action,
        });

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
    } catch (error: any) {
        console.error('Motive decoder mode error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to process motive query', message: error.message });
        } else {
            res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
            res.end();
        }
    }
});

/**
 * POST /api/mode/whatif
 * What-If Explorer mode — alternate paths grounded in character
 */
router.post('/whatif', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { bookId, characterId, scenario } = req.body;

        if (!bookId || !characterId || !scenario) {
            return res.status(400).json({ error: 'bookId, characterId, and scenario are required' });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const response = await handleModeQuery('what_if', bookId, scenario, userId, res, {
            characterId,
            scenario,
        });

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
    } catch (error: any) {
        console.error('What-if mode error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to process what-if query', message: error.message });
        } else {
            res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
            res.end();
        }
    }
});

export default router;
