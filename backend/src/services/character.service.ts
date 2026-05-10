import { query } from '../db';
import { generateResponse } from './llm.service';

export interface Character {
    id: string;
    bookId: string;
    name: string;
    aliases: string[];
    description: string;
    traits: {
        personality: string[];
        motivations: string[];
        fears: string[];
    };
    relationships: Array<{ name: string; type: string; description: string }>;
    firstAppearance: { page?: number; chapter?: string };
}

/**
 * Extract characters from a book after ingestion completes.
 * Uses the first batch of chunks to identify characters via LLM.
 */
export async function extractCharacters(bookId: string): Promise<void> {
    console.log(`🎭 Extracting characters for book ${bookId}...`);

    try {
        // Fetch representative chunks from the book (spread across pages for coverage)
        const chunksResult = await query(
            `SELECT text, page, chapter FROM chunks 
             WHERE book_id = $1 
             ORDER BY chunk_index ASC 
             LIMIT 40`,
            [bookId]
        );

        if (chunksResult.rows.length === 0) {
            console.warn(`⚠️ No chunks found for book ${bookId}, skipping character extraction`);
            return;
        }

        // Build context from chunks
        const context = chunksResult.rows
            .map((r: any) => r.text)
            .join('\n\n---\n\n');

        // Get book title for the prompt
        const bookResult = await query('SELECT title, author FROM books WHERE id = $1', [bookId]);
        const bookTitle = bookResult.rows[0]?.title || 'Unknown';

        const prompt = `Analyze the following excerpts from the book "${bookTitle}" and identify ALL named characters that appear. For each character, provide:

1. name: Their primary name
2. aliases: Any other names, nicknames, or titles they go by
3. description: A brief 1-2 sentence description of who they are in the story
4. personality: Key personality traits (3-5 traits)
5. motivations: What drives them (2-3 motivations)
6. fears: Their fears or vulnerabilities (1-3 items)
7. relationships: Their relationships with other characters [{name, type, description}]
8. first_appearance: Approximate page/chapter of first appearance if detectable

Return ONLY a valid JSON array. Example format:
[
  {
    "name": "Jay Gatsby",
    "aliases": ["James Gatz", "old sport"],
    "description": "A mysterious millionaire who throws lavish parties",
    "personality": ["enigmatic", "obsessive", "romantic", "ambitious"],
    "motivations": ["Reunite with Daisy", "Achieve the American Dream"],
    "fears": ["Losing Daisy", "His past being revealed"],
    "relationships": [{"name": "Daisy Buchanan", "type": "love interest", "description": "His former lover whom he's trying to win back"}],
    "first_appearance": {"chapter": "Chapter 1"}
  }
]

If fewer than 2 characters can be identified, return at least the narrator or protagonist.`;

        const response = await generateResponse(prompt, context);

        // Parse the JSON response
        let characters: any[] = [];
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                characters = JSON.parse(jsonMatch[0]);
            }
        } catch (parseError) {
            console.error('Failed to parse character extraction response:', parseError);
            return;
        }

        if (characters.length === 0) {
            console.warn(`⚠️ No characters extracted for book ${bookId}`);
            return;
        }

        // Store each character in the database
        for (const char of characters) {
            try {
                await query(
                    `INSERT INTO characters (book_id, name, aliases, description, traits, relationships, first_appearance)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (book_id, name) DO UPDATE SET
                       aliases = $3, description = $4, traits = $5, relationships = $6, first_appearance = $7, extracted_at = NOW()`,
                    [
                        bookId,
                        char.name,
                        char.aliases || [],
                        char.description || '',
                        JSON.stringify({
                            personality: char.personality || [],
                            motivations: char.motivations || [],
                            fears: char.fears || [],
                        }),
                        JSON.stringify(
                            (char.relationships || []).map((r: any) => ({
                                name: r.name,
                                type: r.type,
                                description: r.description || '',
                            }))
                        ),
                        JSON.stringify(char.first_appearance || {}),
                    ]
                );
            } catch (err: any) {
                console.warn(`⚠️ Failed to store character "${char.name}":`, err.message);
            }
        }

        console.log(`🎭 Extracted ${characters.length} characters for book ${bookId}`);
    } catch (error: any) {
        // Don't fail the ingestion if character extraction fails
        console.error(`❌ Character extraction failed for book ${bookId}:`, error.message);
    }
}

/**
 * Get all characters for a book
 */
export async function getBookCharacters(bookId: string): Promise<Character[]> {
    const result = await query(
        `SELECT id, book_id, name, aliases, description, traits, relationships, first_appearance
         FROM characters WHERE book_id = $1 ORDER BY name ASC`,
        [bookId]
    );

    return result.rows.map((row: any) => ({
        id: row.id,
        bookId: row.book_id,
        name: row.name,
        aliases: row.aliases || [],
        description: row.description,
        traits: row.traits || { personality: [], motivations: [], fears: [] },
        relationships: row.relationships || [],
        firstAppearance: row.first_appearance || {},
    }));
}

/**
 * Get a single character by ID
 */
export async function getCharacterById(characterId: string): Promise<Character | null> {
    const result = await query(
        `SELECT id, book_id, name, aliases, description, traits, relationships, first_appearance
         FROM characters WHERE id = $1`,
        [characterId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
        id: row.id,
        bookId: row.book_id,
        name: row.name,
        aliases: row.aliases || [],
        description: row.description,
        traits: row.traits || { personality: [], motivations: [], fears: [] },
        relationships: row.relationships || [],
        firstAppearance: row.first_appearance || {},
    };
}
