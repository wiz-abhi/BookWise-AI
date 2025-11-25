export interface TextChunk {
    text: string;
    chunkIndex: number;
    page?: number;
    chapter?: string;
    metadata?: Record<string, any>;
}

/**
 * Chunk text into overlapping windows
 * @param text - Text to chunk
 * @param windowSize - Number of tokens per chunk (default: 400)
 * @param overlapPercent - Overlap percentage (default: 20)
 */
export function chunkText(
    text: string,
    page?: number,
    chapter?: string,
    windowSize: number = 400,
    overlapPercent: number = 20
): TextChunk[] {
    // Simple tokenization (split by whitespace)
    // In production, use a proper tokenizer like tiktoken
    const words = text.split(/\s+/).filter(word => word.length > 0);

    if (words.length === 0) {
        return [];
    }

    const chunks: TextChunk[] = [];
    const overlapSize = Math.floor(windowSize * (overlapPercent / 100));
    const step = windowSize - overlapSize;

    let chunkIndex = 0;

    for (let i = 0; i < words.length; i += step) {
        const chunkWords = words.slice(i, i + windowSize);

        if (chunkWords.length > 0) {
            chunks.push({
                text: chunkWords.join(' '),
                chunkIndex: chunkIndex++,
                page,
                chapter,
            });
        }

        // Break if we've reached the end
        if (i + windowSize >= words.length) {
            break;
        }
    }

    return chunks;
}

/**
 * Chunk an entire document page by page
 */
export function chunkDocument(
    pages: Array<{ pageNumber: number; text: string; chapter?: string }>,
    windowSize: number = 400,
    overlapPercent: number = 20
): TextChunk[] {
    const allChunks: TextChunk[] = [];

    for (const page of pages) {
        const pageChunks = chunkText(
            page.text,
            page.pageNumber,
            page.chapter,
            windowSize,
            overlapPercent
        );

        allChunks.push(...pageChunks);
    }

    // Renumber chunk indices globally
    allChunks.forEach((chunk, index) => {
        chunk.chunkIndex = index;
    });

    return allChunks;
}
