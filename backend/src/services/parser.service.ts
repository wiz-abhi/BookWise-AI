import pdfParse from 'pdf-parse';
import EPub from 'epub2';
import { promisify } from 'util';

export interface ParsedDocument {
    text: string;
    pages: PageContent[];
    metadata: {
        title?: string;
        author?: string;
        totalPages: number;
        language?: string;
    };
}

export interface PageContent {
    pageNumber: number;
    text: string;
    chapter?: string;
}

/**
 * Parse PDF file
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
    try {
        const data = await pdfParse(buffer);

        // Extract pages (pdf-parse doesn't give per-page text by default)
        // We'll split by page breaks or use the full text
        const pages: PageContent[] = [];
        const totalPages = data.numpages;

        // Simple approach: split text evenly (in production, use a better PDF library)
        const textLength = data.text.length;
        const charsPerPage = Math.ceil(textLength / totalPages);

        for (let i = 0; i < totalPages; i++) {
            const start = i * charsPerPage;
            const end = Math.min((i + 1) * charsPerPage, textLength);
            pages.push({
                pageNumber: i + 1,
                text: data.text.substring(start, end).trim(),
            });
        }

        return {
            text: data.text,
            pages,
            metadata: {
                title: data.info?.Title,
                author: data.info?.Author,
                totalPages: data.numpages,
            },
        };
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error('Failed to parse PDF file');
    }
}

/**
 * Parse EPUB file
 */
export async function parseEPUB(buffer: Buffer): Promise<ParsedDocument> {
    return new Promise((resolve, reject) => {
        try {
            const epub = new EPub(buffer);

            epub.on('end', async () => {
                const pages: PageContent[] = [];
                let fullText = '';
                let pageNumber = 1;

                // Get all chapters
                const flow = epub.flow;

                for (const chapter of flow) {
                    const getChapterAsync = promisify(epub.getChapter.bind(epub));
                    const chapterText = await getChapterAsync(chapter.id);

                    // Remove HTML tags
                    const cleanText = chapterText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

                    pages.push({
                        pageNumber: pageNumber++,
                        text: cleanText,
                        chapter: chapter.title,
                    });

                    fullText += cleanText + '\n\n';
                }

                resolve({
                    text: fullText,
                    pages,
                    metadata: {
                        title: epub.metadata.title,
                        author: epub.metadata.creator,
                        totalPages: pages.length,
                        language: epub.metadata.language,
                    },
                });
            });

            epub.on('error', (error) => {
                console.error('EPUB parsing error:', error);
                reject(new Error('Failed to parse EPUB file'));
            });

            epub.parse();
        } catch (error) {
            console.error('EPUB parsing error:', error);
            reject(new Error('Failed to parse EPUB file'));
        }
    });
}

/**
 * Parse TXT file
 */
export async function parseTXT(buffer: Buffer): Promise<ParsedDocument> {
    try {
        const text = buffer.toString('utf-8');

        // Split into pages (approximate 500 words per page)
        const words = text.split(/\s+/);
        const wordsPerPage = 500;
        const pages: PageContent[] = [];

        for (let i = 0; i < words.length; i += wordsPerPage) {
            const pageWords = words.slice(i, i + wordsPerPage);
            pages.push({
                pageNumber: Math.floor(i / wordsPerPage) + 1,
                text: pageWords.join(' '),
            });
        }

        return {
            text,
            pages,
            metadata: {
                totalPages: pages.length,
            },
        };
    } catch (error) {
        console.error('TXT parsing error:', error);
        throw new Error('Failed to parse TXT file');
    }
}

/**
 * Parse document based on file type
 */
export async function parseDocument(
    buffer: Buffer,
    fileType: string
): Promise<ParsedDocument> {
    const type = fileType.toLowerCase();

    switch (type) {
        case 'pdf':
            return await parsePDF(buffer);
        case 'epub':
            return await parseEPUB(buffer);
        case 'txt':
            return await parseTXT(buffer);
        default:
            throw new Error(`Unsupported file type: ${fileType}`);
    }
}
