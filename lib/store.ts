import { create } from 'zustand';

export interface Citation {
    bookId: string;
    bookTitle: string;
    page: number | null;
    chapter: string | null;
    excerpt: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: Citation[];
    confidence?: number;
    timestamp: Date;
}

export interface Book {
    id: string;
    title: string;
    author: string | null;
    language: string;
    totalPages: number | null;
    createdAt: string;
}

interface ChatStore {
    // Messages
    messages: Message[];
    addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
    clearMessages: () => void;

    // Current conversation
    conversationId: string | null;
    setConversationId: (id: string | null) => void;

    // Selected book
    selectedBook: Book | null;
    setSelectedBook: (book: Book | null) => void;

    // Persona
    persona: 'scholar' | 'friend' | 'quizzer';
    setPersona: (persona: 'scholar' | 'friend' | 'quizzer') => void;

    // Loading state
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;

    // User ID (temporary - replace with auth later)
    userId: string;
    setUserId: (id: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    // Messages
    messages: [],
    addMessage: (message) =>
        set((state) => ({
            messages: [
                ...state.messages,
                {
                    ...message,
                    id: Math.random().toString(36).substring(7),
                    timestamp: new Date(),
                },
            ],
        })),
    clearMessages: () => set({ messages: [] }),

    // Conversation
    conversationId: null,
    setConversationId: (id) => set({ conversationId: id }),

    // Selected book
    selectedBook: null,
    setSelectedBook: (book) => set({ selectedBook: book }),

    // Persona
    persona: 'friend',
    setPersona: (persona) => set({ persona }),

    // Loading
    isLoading: false,
    setIsLoading: (loading) => set({ isLoading: loading }),

    // User
    userId: 'demo-user',
    setUserId: (id) => set({ userId: id }),
}));
