import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generate embeddings for text using Gemini text-embedding-004
 * @param texts - Array of text strings to embed
 * @returns Array of embedding vectors (768 dimensions each)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

        const embeddings: number[][] = [];

        // Process in batches to avoid rate limits
        const batchSize = 100;

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);

            console.log(`Generating embeddings for batch ${i / batchSize + 1} (${batch.length} texts)`);

            // Generate embeddings for each text in the batch
            const batchEmbeddings = await Promise.all(
                batch.map(async (text) => {
                    const result = await model.embedContent(text);
                    return result.embedding.values;
                })
            );

            embeddings.push(...batchEmbeddings);

            // Small delay between batches to avoid rate limiting
            if (i + batchSize < texts.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log(`✅ Generated ${embeddings.length} embeddings`);
        return embeddings;
    } catch (error) {
        console.error('Embedding generation error:', error);
        throw new Error('Failed to generate embeddings');
    }
}

/**
 * Generate a single embedding
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await generateEmbeddings([text]);
    return embeddings[0];
}
