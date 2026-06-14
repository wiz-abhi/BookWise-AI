const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Helper to make authenticated API requests
 */
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Handle 401 Unauthorized (token expired/invalid)
    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
    }

    return response;
}

// Legacy query API (kept for backward compatibility)
export const queryAPI = {
    sendMessage: async (convId: string, data: any) => {
        const response = await apiRequest(`/chat/${convId}/message`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to send message');
        return response.json();
    },

    query: async (data: any) => {
        const response = await apiRequest('/query', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to query');
        return response.json();
    },
};

// Upload API
export const uploadAPI = {
    uploadBook: async (file: File, metadata: { userId?: string; title?: string; author?: string }) => {
        const formData = new FormData();
        formData.append('file', file);
        if (metadata.userId) formData.append('userId', metadata.userId);
        if (metadata.title) formData.append('title', metadata.title);
        if (metadata.author) formData.append('author', metadata.author);

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload book');
        }
        return response.json();
    },

    getIngestionStatus: async (jobId: string) => {
        const response = await apiRequest(`/upload/status/${jobId}`);
        if (!response.ok) throw new Error('Failed to get status');
        return response.json();
    }
};

// Library API
export const libraryAPI = {
    deleteBook: async (bookId: string) => {
        const response = await apiRequest(`/user/book/${bookId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete book');
        }
        return response.json();
    }
};

// ============================================================
// NEW: Mode API — Character exploration experience modes
// ============================================================

async function handleModeStream(
    endpoint: string,
    data: any,
    onChunk: (text: string) => void,
    onMetadata: (metadata: any) => void
) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('token');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        throw new Error(`Failed to query ${endpoint}`);
    }

    if (!response.body) throw new Error('ReadableStream not yet supported in this browser.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Split by double newline which SSE uses to separate events
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || ''; // Keep the last incomplete part in the buffer

        for (const part of parts) {
            if (part.startsWith('data: ')) {
                try {
                    const jsonStr = part.substring(6); // remove 'data: '
                    const parsed = JSON.parse(jsonStr);

                    if (parsed.type === 'metadata') {
                        onMetadata(parsed);
                    } else if (parsed.type === 'chunk') {
                        onChunk(parsed.text);
                    } else if (parsed.type === 'error') {
                        throw new Error(parsed.message);
                    } else if (parsed.type === 'done') {
                        // Stream is finished
                    }
                } catch (e) {
                    console.error('Failed to parse SSE JSON:', e);
                }
            }
        }
    }
}

export const modeAPI = {
    /** Companion mode — reading buddy aware of your current page */
    companion: async (
        data: { bookId: string; query: string; conversationId?: string },
        onChunk: (text: string) => void,
        onMetadata: (metadata: any) => void
    ) => {
        return handleModeStream('/mode/companion', data, onChunk, onMetadata);
    },

    /** Character Voice mode — talk to a character in-character */
    characterVoice: async (
        data: { bookId: string; characterId: string; query: string; conversationId?: string },
        onChunk: (text: string) => void,
        onMetadata: (metadata: any) => void
    ) => {
        return handleModeStream('/mode/character', data, onChunk, onMetadata);
    },

    /** Multi-POV Replay — scene from multiple character perspectives */
    multiPOV: async (
        data: { bookId: string; characterIds: string[]; sceneDescription: string },
        onChunk: (text: string) => void,
        onMetadata: (metadata: any) => void
    ) => {
        return handleModeStream('/mode/pov', data, onChunk, onMetadata);
    },

    /** Motive Decoder — deep character psychology analysis */
    motiveDecoder: async (
        data: { bookId: string; characterId: string; action?: string; query?: string },
        onChunk: (text: string) => void,
        onMetadata: (metadata: any) => void
    ) => {
        return handleModeStream('/mode/motive', data, onChunk, onMetadata);
    },

    /** What-If Explorer — alternate paths grounded in character */
    whatIf: async (
        data: { bookId: string; characterId: string; scenario: string },
        onChunk: (text: string) => void,
        onMetadata: (metadata: any) => void
    ) => {
        return handleModeStream('/mode/whatif', data, onChunk, onMetadata);
    },

    /** Get all extracted characters for a book */
    getCharacters: async (bookId: string) => {
        const response = await apiRequest(`/mode/characters/${bookId}`);
        if (!response.ok) throw new Error('Failed to get characters');
        return response.json();
    },
};

// ============================================================
// NEW: Progress API — Reading progress tracking
// ============================================================
export const progressAPI = {
    /** Update reading progress for a book */
    update: async (bookId: string, page: number, totalPages?: number) => {
        const response = await apiRequest('/progress', {
            method: 'POST',
            body: JSON.stringify({ bookId, page, totalPages }),
        });
        if (!response.ok) throw new Error('Failed to update progress');
        return response.json();
    },

    /** Get reading progress for a specific book */
    get: async (bookId: string) => {
        const response = await apiRequest(`/progress/${bookId}`);
        if (!response.ok) throw new Error('Failed to get progress');
        return response.json();
    },

    /** Get all reading progress for the authenticated user */
    getAll: async () => {
        const response = await apiRequest('/progress');
        if (!response.ok) throw new Error('Failed to get all progress');
        return response.json();
    },
};
