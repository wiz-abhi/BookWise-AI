import { searchAndRerank, SearchResult } from './vectordb.service';
import { generateStructuredResponse, Citation, RAGResponse } from './llm.service';

const SYSTEM_PROMPT = `You are BookBuddy — a helpful, accurate assistant that answers questions based ONLY on the provided book excerpts.

IMPORTANT RULES:
1. Always cite your sources using [1], [2], etc. to reference the provided citations
2. Only answer based on the information in the provided context
3. If you cannot confidently answer using the passages, state your uncertainty and show the closest relevant passage
4. Include the book title and page number when citing
5. Keep quotes under 250 characters to respect copyright
6. Be conversational but accurate

Your goal is to help users understand and engage with their books through accurate, citation-backed answers.`;

export interface RAGQueryOptions {
    bookId?: string;
    userId?: string;
    k?: number; // Number of chunks to retrieve
    persona?: 'scholar' | 'friend' | 'quizzer';
    userMemory?: string; // User preferences or context
}

/**
 * Main RAG query function
 */
export async function ragQuery(
    query: string,
    options: RAGQueryOptions = {}
): Promise<RAGResponse> {
    const { bookId, k = 5, persona = 'friend', userMemory } = options;

    console.log(`🔍 RAG Query: "${query}" (k=${k}, persona=${persona})`);

    // Step 1: Retrieve relevant chunks
    const searchResults = await searchAndRerank(query, {
        bookId,
        limit: k,
        minSimilarity: 0.3,
    });

    if (searchResults.length === 0) {
        return {
            answerText: "I couldn't find any relevant information in the uploaded books to answer your question. Could you try rephrasing or asking about a different topic?",
            citations: [],
            confidence: 0,
        };
    }

    console.log(`📚 Retrieved ${searchResults.length} relevant chunks`);

    // Step 2: Prepare context and citations
    const { context, citations } = prepareContextAndCitations(searchResults);

    // Step 3: Adjust system prompt based on persona
    const systemPrompt = getPersonaPrompt(persona, SYSTEM_PROMPT);

    // Step 4: Add user memory if available
    const fullSystemPrompt = userMemory
        ? `${systemPrompt}\n\nUser Context: ${userMemory}`
        : systemPrompt;

    // Step 5: Generate response with LLM
    const response = await generateStructuredResponse(
        query,
        context,
        citations,
        fullSystemPrompt
    );

    console.log(`✅ Generated response (confidence: ${response.confidence})`);

    return response;
}

/**
 * Prepare context string and citations from search results
 */
function prepareContextAndCitations(results: SearchResult[]): {
    context: string;
    citations: Citation[];
} {
    const citations: Citation[] = [];
    const contextParts: string[] = [];

    results.forEach((result, index) => {
        // Add to citations
        citations.push({
            bookId: result.bookId,
            bookTitle: result.bookTitle,
            page: result.page,
            chapter: result.chapter,
            excerpt: result.text.substring(0, 250), // Limit excerpt length
        });

        // Add to context with citation marker
        const citationNum = index + 1;
        const pageInfo = result.page ? `Page ${result.page}` : 'Unknown Page';
        const chapterInfo = result.chapter ? `, Chapter: ${result.chapter}` : '';

        contextParts.push(
            `[${citationNum}] From "${result.bookTitle}" (${pageInfo}${chapterInfo}):\n${result.text}\n`
        );
    });

    return {
        context: contextParts.join('\n---\n\n'),
        citations,
    };
}

/**
 * Get persona-specific system prompt
 */
function getPersonaPrompt(persona: string, basePrompt: string): string {
    const personaAdditions = {
        scholar: '\n\nAdopt a scholarly, analytical tone. Provide detailed explanations with academic rigor. Reference literary techniques, themes, and historical context where relevant.',

        friend: '\n\nAdopt a friendly, conversational tone. Explain concepts in an accessible way, as if chatting with a friend about a book you both love. Use analogies and relatable examples.',

        quizzer: '\n\nAdopt an engaging, educational tone. After answering, pose a thought-provoking follow-up question to deepen understanding. Encourage critical thinking about the text.',
    };

    return basePrompt + (personaAdditions[persona as keyof typeof personaAdditions] || personaAdditions.friend);
}

/**
 * Query with conversation context
 */
export async function ragQueryWithContext(
    query: string,
    conversationHistory: Array<{ role: string; content: string }>,
    options: RAGQueryOptions = {}
): Promise<RAGResponse> {
    // Combine recent conversation history into context
    const recentHistory = conversationHistory.slice(-4); // Last 4 messages
    const conversationContext = recentHistory
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');

    // Add conversation context to user memory
    const enhancedOptions = {
        ...options,
        userMemory: options.userMemory
            ? `${options.userMemory}\n\nRecent conversation:\n${conversationContext}`
            : `Recent conversation:\n${conversationContext}`,
    };

    return ragQuery(query, enhancedOptions);
}
