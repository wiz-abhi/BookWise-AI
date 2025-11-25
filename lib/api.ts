import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface QueryRequest {
    query: string;
    userId?: string;
    bookId?: string;
    k?: number;
    persona?: 'scholar' | 'friend' | 'quizzer';
}

export interface QueryResponse {
    answer: string;
    citations: Array<{
        bookId: string;
        bookTitle: string;
        page: number | null;
        chapter: string | null;
        excerpt: string;
    }>;
    confidence: number;
}

export interface ChatMessageRequest {
    message: string;
    userId?: string;
    bookId?: string;
    persona?: 'scholar' | 'friend' | 'quizzer';
}

export interface UploadResponse {
    message: string;
    book: {
        id: string;
        title: string;
        author: string | null;
        createdAt: string;
    };
    ingestionJobId: string;
}

export interface IngestionStatus {
    jobId: string;
    bookId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    totalChunks: number;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string;
}

// Query API
export const queryAPI = {
    async query(request: QueryRequest): Promise<QueryResponse> {
        const response = await api.post('/query', request);
        return response.data;
    },

    async sendMessage(convId: string, request: ChatMessageRequest) {
        const response = await api.post(`/chat/${convId}/message`, request);
        return response.data;
    },

    async getConversation(convId: string) {
        const response = await api.get(`/chat/${convId}`);
        return response.data;
    },
};

// Upload API
export const uploadAPI = {
    async uploadBook(file: File, metadata: { userId: string; title?: string; author?: string }): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', metadata.userId);
        if (metadata.title) formData.append('title', metadata.title);
        if (metadata.author) formData.append('author', metadata.author);

        const response = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async getIngestionStatus(jobId: string): Promise<IngestionStatus> {
        const response = await api.get(`/ingest/status/${jobId}`);
        return response.data;
    },
};

// User API
export const userAPI = {
    async saveMemory(data: {
        userId: string;
        bookId?: string;
        quoteText?: string;
        page?: number;
        memoryType: 'quote' | 'preference' | 'goal' | 'note';
        metadata?: Record<string, any>;
    }) {
        const response = await api.post('/user/memory', data);
        return response.data;
    },

    async getBookQuotes(bookId: string, userId?: string) {
        const response = await api.get(`/book/${bookId}/quotes`, {
            params: { userId },
        });
        return response.data;
    },

    async getUserLibrary(userId: string) {
        const response = await api.get(`/user/${userId}/library`);
        return response.data;
    },
};

export default api;
