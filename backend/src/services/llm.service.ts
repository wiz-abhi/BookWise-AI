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
    modelName: string = 'gemini-2.5-flash'
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
        if (modelName === 'gemini-2.5-flash') {
            console.log('Falling back to Gemini 2.5 Flash Lite...');
            return generateResponse(query, context, systemPrompt, 'gemini-2.5-flash-lite');
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
    modelName: string = 'gemini-2.5-flash'
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

        // Check if it's a rate limit error (429) or just general error
        if (modelName === 'gemini-2.5-flash') {
            console.warn('⚠️ Primary model failed, trying fallback...');
            console.log('Falling back to Gemini 2.5 Flash Lite...');
            return generateStructuredResponse(query, context, citations, systemPrompt, 'gemini-2.5-flash-lite');
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

/**
 * FAST Intent Classification
 * Determines if a query requires RAG (SEARCH) or just LLM (CHAT)
 */
export async function classifyQueryIntent(
    query: string,
    modelName: string = 'gemini-2.5-flash' // Use fastest model
): Promise<'SEARCH' | 'CHAT'> {
    try {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: 0.1, // Deterministic
                maxOutputTokens: 10,
            }
        });

        const prompt = `You are a router. Classify the user's query into one of two categories:
1. SEARCH: The user is asking for specific information, facts, summaries, or details that would be found in a book or document.
2. CHAT: The user is greeting, thanking, asking about you, or making small talk that doesn't require looking up external information.

Return ONLY the word "SEARCH" or "CHAT".

Query: "Hello there"
Intent: CHAT

Query: "Who is the main character?"
Intent: SEARCH

Query: "Summarize chapter 1"
Intent: SEARCH

Query: "Thanks for the help"
Intent: CHAT

Query: "What is the theme of this book?"
Intent: SEARCH

Query: "${query}"
Intent:`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().toUpperCase();

        if (text.includes('SEARCH')) return 'SEARCH';
        return 'CHAT';

    } catch (error) {
        console.error('Intent classification failed, defaulting to SEARCH:', error);
        return 'SEARCH'; // Fail safe to searching
    }
}
