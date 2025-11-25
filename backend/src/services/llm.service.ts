import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface Citation {
    bookId: string;
    bookTitle: string;
    page: number | null;
    chapter: string | null;
    excerpt: string;
}

export interface RAGResponse {
    answerText: string;
    citations: Citation[];
    confidence: number;
}

/**
 * Call Gemini LLM with context
 */
export async function generateResponse(
    query: string,
    context: string,
    systemPrompt?: string,
    modelName: string = 'gemini-2.5-flash-preview-09-2025'
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = systemPrompt
            ? `${systemPrompt}\n\nContext:\n${context}\n\nUser Question: ${query}`
            : `Context:\n${context}\n\nUser Question: ${query}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
    } catch (error: any) {
        console.error('LLM generation error:', error);

        // Fallback to other models if primary fails
        if (modelName === 'gemini-2.5-flash-preview-09-2025') {
            console.log('Falling back to Gemini 1.5 Flash...');
            return generateResponse(query, context, systemPrompt, 'gemini-1.5-flash');
        } else if (modelName === 'gemini-1.5-flash') {
            console.log('Falling back to Gemini 1.5 Pro...');
            return generateResponse(query, context, systemPrompt, 'gemini-1.5-pro');
        }

        throw new Error('Failed to generate response from LLM');
    }
}

/**
 * Generate structured RAG response with citations
 */
export async function generateStructuredResponse(
    query: string,
    context: string,
    citations: Citation[],
    systemPrompt?: string,
    modelName: string = 'gemini-2.5-flash-preview-09-2025'
): Promise<RAGResponse> {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const citationsText = citations
            .map((c, i) => `[${i + 1}] ${c.bookTitle}, Page ${c.page || 'N/A'}: "${c.excerpt.substring(0, 100)}..."`)
            .join('\n');

        const prompt = `${systemPrompt || 'You are a helpful AI assistant that answers questions based on provided context.'}

Context from books:
${context}

Available Citations:
${citationsText}

User Question: ${query}

Please provide a response in the following JSON format:
{
  "answer": "Your detailed answer here, referencing citations as [1], [2], etc.",
  "confidence": 0.85,
  "usedCitations": [1, 2]
}

Confidence should be between 0 and 1, where 1 is completely confident.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Try to parse JSON response
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                // Map used citations
                const usedCitations = (parsed.usedCitations || []).map((idx: number) => citations[idx - 1]).filter(Boolean);

                return {
                    answerText: parsed.answer || responseText,
                    citations: usedCitations,
                    confidence: parsed.confidence || 0.7,
                };
            }
        } catch (parseError) {
            console.warn('Failed to parse structured response, using plain text');
        }

        // Fallback: return plain text response with all citations
        return {
            answerText: responseText,
            citations,
            confidence: 0.7,
        };
    } catch (error: any) {
        console.error('Structured response generation error:', error);

        // Check if it's a rate limit error (429)
        if (error.status === 429) {
            console.warn('⚠️ Rate limit exceeded, trying fallback models...');

            // Try fallback models in order
            if (modelName === 'gemini-2.5-flash-preview-09-2025') {
                console.log('Falling back to Gemini 1.5 Flash...');
                return generateStructuredResponse(query, context, citations, systemPrompt, 'gemini-1.5-flash');
            } else if (modelName === 'gemini-1.5-flash') {
                console.log('Falling back to Gemini 1.5 Pro...');
                return generateStructuredResponse(query, context, citations, systemPrompt, 'gemini-1.5-pro');
            }
        }

        // If all models fail or it's a different error, return a fallback response
        console.warn('All models failed, returning fallback response');
        return {
            answerText: 'I apologize, but I\'m currently experiencing high demand. Please try again in a few moments. If you have uploaded a book, I can still search through it, but response generation is temporarily limited.',
            citations,
            confidence: 0.0,
        };
    }
}
