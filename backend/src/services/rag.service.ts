import { searchAndRerank, SearchResult } from './vectordb.service';
import { generateStructuredResponse, Citation, RAGResponse, classifyQueryIntent, generateResponse } from './llm.service';

const SYSTEM_PROMPT = `You are BookBuddy — an intelligent and articulate AI reading companion.
Your goal is to provide **natural, synthesized, and well-structured** answers based on the provided book excerpts.

IMPORTANT INSTRUCTIONS:
1. **Format with Markdown**: Use **bold** for key terms, lists for multiple points, and headings (###) to organize long answers.
2. **Synthesize, Don't Just Quote**: Do not just copy-paste text. Read the excerpts and summarize the answer in your own natural voice.
3. **Be Concise and Engaging**: Avoid academic fluff. Be direct, clear, and helpful—like a knowledgeable friend explaining a concept.
4. **NO Inline Citations**: Do NOT use [1], [2] notation in your text. The system will handle citations separately. Just write a smooth, continuous answer.
5. **Honesty**: If the context doesn't answer the question, admit it gracefully and offer the closest relevant information found.

Your output should look clean, professional, and easy to read.`;

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

    // Step 1: Check Intent
    const intent = await classifyQueryIntent(query);
    console.log(`🧠 Query Intent: ${intent}`);

    // If CHAT, skip search and just chat
    if (intent === 'CHAT') {
        const chatSystemPrompt = `You are BookBuddy, a friendly AI reading companion. 
The user is engaging in casual conversation. Respond naturally, warmly, and briefly. 
Do NOT try to look up book facts. Just chat.
If the user asks something that requires book knowledge but you misclassified it, politely ask them to specify which book they are talking about.`;

        const fullPrompt = userMemory ? `${chatSystemPrompt}\n\nUser Context: ${userMemory}` : chatSystemPrompt;

        const answer = await generateResponse(query, "No book context needed.", fullPrompt);

        return {
            answerText: answer,
            citations: [],
            confidence: 1.0,
        };
    }

    // Step 2: Retrieve relevant chunks (SEARCH Intent)
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
