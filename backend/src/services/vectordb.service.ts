import { query } from '../db';
import { generateEmbedding } from './embedding.service';

export interface SearchResult {
    chunkId: string;
    bookId: string;
    bookTitle: string;
    author: string | null;
    page: number | null;
    chapter: string | null;
    text: string;
    similarity: number;
    metadata: Record<string, any>;
}

export interface SearchOptions {
    bookId?: string;
    limit?: number;
    minSimilarity?: number;
}

/**
 * Search for similar chunks using vector similarity
 */
export async function searchSimilarChunks(
    queryText: string,
    options: SearchOptions = {}
): Promise<SearchResult[]> {
    const { bookId, limit = 10, minSimilarity = 0.5 } = options;

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(queryText);

    // Build SQL query with optional book filter
    let sql = `
    SELECT 
      c.id as chunk_id,
      c.book_id,
      b.title as book_title,
      b.author,
      c.page,
      c.chapter,
      c.text,
      c.metadata,
      1 - (c.embedding <=> $1::vector) as similarity
    FROM chunks c
    JOIN books b ON c.book_id = b.id
    WHERE 1 - (c.embedding <=> $1::vector) >= $2
  `;

    const params: any[] = [JSON.stringify(queryEmbedding), minSimilarity];

    // Add book filter if specified
    if (bookId) {
        sql += ` AND c.book_id = $3`;
        params.push(bookId);
    }

    // Order by similarity and limit results
    sql += ` ORDER BY c.embedding <=> $1::vector LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);

    return result.rows.map((row) => ({
        chunkId: row.chunk_id,
        bookId: row.book_id,
        bookTitle: row.book_title,
        author: row.author,
        page: row.page,
        chapter: row.chapter,
        text: row.text,
        similarity: parseFloat(row.similarity),
        metadata: row.metadata || {},
    }));
}

/**
 * Hybrid search: combine metadata filtering with vector search
 */
export async function hybridSearch(
    queryText: string,
    options: SearchOptions & {
        author?: string;
        minPage?: number;
        maxPage?: number;
    } = {}
): Promise<SearchResult[]> {
    const { bookId, author, minPage, maxPage, limit = 10, minSimilarity = 0.5 } = options;

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(queryText);

    // Build SQL with metadata filters
    let sql = `
    SELECT 
      c.id as chunk_id,
      c.book_id,
      b.title as book_title,
      b.author,
      c.page,
      c.chapter,
      c.text,
      c.metadata,
      1 - (c.embedding <=> $1::vector) as similarity
    FROM chunks c
    JOIN books b ON c.book_id = b.id
    WHERE 1 - (c.embedding <=> $1::vector) >= $2
  `;

    const params: any[] = [JSON.stringify(queryEmbedding), minSimilarity];
    let paramIndex = 3;

    // Add metadata filters
    if (bookId) {
        sql += ` AND c.book_id = $${paramIndex++}`;
        params.push(bookId);
    }

    if (author) {
        sql += ` AND b.author ILIKE $${paramIndex++}`;
        params.push(`%${author}%`);
    }

    if (minPage !== undefined) {
        sql += ` AND c.page >= $${paramIndex++}`;
        params.push(minPage);
    }

    if (maxPage !== undefined) {
        sql += ` AND c.page <= $${paramIndex++}`;
        params.push(maxPage);
    }

    // Order by similarity
    sql += ` ORDER BY c.embedding <=> $1::vector LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await query(sql, params);

    return result.rows.map((row) => ({
        chunkId: row.chunk_id,
        bookId: row.book_id,
        bookTitle: row.book_title,
        author: row.author,
        page: row.page,
        chapter: row.chapter,
        text: row.text,
        similarity: parseFloat(row.similarity),
        metadata: row.metadata || {},
    }));
}

/**
 * Rerank search results using cosine similarity
 */
export function rerankResults(
    results: SearchResult[],
    queryText: string
): SearchResult[] {
    // Simple reranking based on text overlap
    // In production, use a proper reranking model

    const queryWords = new Set(
        queryText.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    );

    return results
        .map((result) => {
            const textWords = new Set(
                result.text.toLowerCase().split(/\s+/).filter(w => w.length > 3)
            );

            // Calculate Jaccard similarity
            const intersection = new Set(
                [...queryWords].filter(w => textWords.has(w))
            );
            const union = new Set([...queryWords, ...textWords]);
            const jaccardSimilarity = intersection.size / union.size;

            // Combine with vector similarity (weighted average)
            const combinedScore = result.similarity * 0.7 + jaccardSimilarity * 0.3;

            return {
                ...result,
                similarity: combinedScore,
            };
        })
        .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Search with reranking
 */
export async function searchAndRerank(
    queryText: string,
    options: SearchOptions = {}
): Promise<SearchResult[]> {
    // Get initial results
    const results = await searchSimilarChunks(queryText, {
        ...options,
        limit: (options.limit || 10) * 2, // Get more results for reranking
    });

    // Rerank results
    const reranked = rerankResults(results, queryText);

    // Return top N
    return reranked.slice(0, options.limit || 10);
}
