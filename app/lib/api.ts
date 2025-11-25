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
            // Optional: Redirect to login if not already there
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
    }

    return response;
}

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
