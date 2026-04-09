export interface ApiError extends Error {
    status?: number;
}

export class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            const message = errorData.error || errorData.message || response.statusText;
            const error = new Error(message) as ApiError;
            error.status = response.status;
            throw error;
        }

        // Handle 204 No Content
        if (response.status === 204) return undefined as unknown as T;

        const text = await response.text();
        if (!text) return undefined as unknown as T;

        try {
            return JSON.parse(text);
        } catch {
            return text as unknown as T;
        }
    }

    get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    post<T, B = unknown>(endpoint: string, body: B, options: RequestInit = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    put<T, B = unknown>(endpoint: string, body: B, options: RequestInit = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    patch<T, B = unknown>(endpoint: string, body: B, options: RequestInit = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }

    delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

const defaultBaseUrl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : 'http://localhost:4000/api';

export const api = new ApiClient(defaultBaseUrl);
