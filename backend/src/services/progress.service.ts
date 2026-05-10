import { query } from '../db';

/**
 * Update reading progress for a user on a specific book
 */
export async function updateProgress(
    userId: string,
    bookId: string,
    page: number,
    totalPages?: number
): Promise<void> {
    await query(
        `INSERT INTO reading_progress (user_id, book_id, current_page, total_pages, last_read_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, book_id) 
         DO UPDATE SET current_page = $3, total_pages = COALESCE($4, reading_progress.total_pages), last_read_at = NOW()`,
        [userId, bookId, page, totalPages || null]
    );
}

/**
 * Get reading progress for a user on a specific book
 */
export async function getProgress(
    userId: string,
    bookId: string
): Promise<{ currentPage: number; totalPages: number | null; lastReadAt: string } | null> {
    const result = await query(
        `SELECT current_page, total_pages, last_read_at FROM reading_progress WHERE user_id = $1 AND book_id = $2`,
        [userId, bookId]
    );

    if (result.rows.length === 0) return null;

    return {
        currentPage: result.rows[0].current_page,
        totalPages: result.rows[0].total_pages,
        lastReadAt: result.rows[0].last_read_at,
    };
}

/**
 * Get all reading progress for a user
 */
export async function getAllProgress(
    userId: string
): Promise<Array<{ bookId: string; currentPage: number; totalPages: number | null; lastReadAt: string }>> {
    const result = await query(
        `SELECT book_id, current_page, total_pages, last_read_at 
         FROM reading_progress WHERE user_id = $1 ORDER BY last_read_at DESC`,
        [userId]
    );

    return result.rows.map((row: any) => ({
        bookId: row.book_id,
        currentPage: row.current_page,
        totalPages: row.total_pages,
        lastReadAt: row.last_read_at,
    }));
}
