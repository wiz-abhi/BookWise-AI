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

export interface Character {
    id: string;
    bookId: string;
    name: string;
    aliases: string[];
    description: string;
    traits: {
        personality: string[];
        motivations: string[];
        fears: string[];
    };
    relationships: Array<{ name: string; type: string; description: string }>;
    firstAppearance: { page?: number; chapter?: string };
}

export type ExperienceMode = 'companion' | 'character_voice' | 'multi_pov' | 'motive_decoder' | 'what_if';

interface ChatStore {
    // Messages
    messages: Message[];
    addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
    updateLastMessage: (content: string) => void;
    setLastMessageCitations: (citations: Citation[]) => void;
    clearMessages: () => void;

    // Current conversation
    conversationId: string | null;
    setConversationId: (id: string | null) => void;

    // Selected book
    selectedBook: Book | null;
    setSelectedBook: (book: Book | null) => void;

    // Experience mode (replaces persona)
    activeMode: ExperienceMode | null;
    setActiveMode: (mode: ExperienceMode | null) => void;

    // Selected character (for character-based modes)
    selectedCharacter: Character | null;
    setSelectedCharacter: (character: Character | null) => void;

    // Reading progress
    readingProgress: { currentPage: number; totalPages: number | null } | null;
    setReadingProgress: (progress: { currentPage: number; totalPages: number | null } | null) => void;

    // Loading state
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;

    // User ID (temporary - replace with auth later)
    userId: string;
    setUserId: (id: string) => void;

    // Legacy persona support (kept for backward compatibility with old chat)
    persona: 'scholar' | 'friend' | 'quizzer';
    setPersona: (persona: 'scholar' | 'friend' | 'quizzer') => void;
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
    updateLastMessage: (content) =>
        set((state) => {
            if (state.messages.length === 0) return state;
            const newMessages = [...state.messages];
            newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                content: newMessages[newMessages.length - 1].content + content,
            };
            return { messages: newMessages };
        }),
    setLastMessageCitations: (citations) =>
        set((state) => {
            if (state.messages.length === 0) return state;
            const newMessages = [...state.messages];
            newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                citations,
            };
            return { messages: newMessages };
        }),
    clearMessages: () => set({ messages: [] }),

    // Conversation
    conversationId: null,
    setConversationId: (id) => set({ conversationId: id }),

    // Selected book
    selectedBook: null,
    setSelectedBook: (book) => set({ selectedBook: book }),

    // Experience mode
    activeMode: null,
    setActiveMode: (mode) => set({ activeMode: mode }),

    // Selected character
    selectedCharacter: null,
    setSelectedCharacter: (character) => set({ selectedCharacter: character }),

    // Reading progress
    readingProgress: null,
    setReadingProgress: (progress) => set({ readingProgress: progress }),

    // Loading
    isLoading: false,
    setIsLoading: (loading) => set({ isLoading: loading }),

    // User
    userId: 'demo-user',
    setUserId: (id) => set({ userId: id }),

    // Legacy persona
    persona: 'friend',
    setPersona: (persona) => set({ persona }),
}));
