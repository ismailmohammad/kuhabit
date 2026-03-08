import type { HabitType, UserInfo } from '../types/habit';

const BASE = '/api';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
}

export const api = {
    auth: {
        login: (username: string, password: string) =>
            req<UserInfo>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
        register: (username: string, password: string, email?: string) =>
            req<UserInfo>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, email: email || undefined }) }),
        logout: () => req<void>('/auth/logout', { method: 'POST' }),
        me: () => req<UserInfo>('/auth/me'),
    },
    habits: {
        list: () => req<HabitType[]>('/habits'),
        create: (name: string, recurrence: string, positiveType: boolean) =>
            req<HabitType>('/habits', { method: 'POST', body: JSON.stringify({ name, recurrence, positiveType }) }),
        update: (id: number, changes: Partial<Omit<HabitType, 'id'>>) =>
            req<HabitType>(`/habits/${id}`, { method: 'PUT', body: JSON.stringify(changes) }),
        remove: (id: number) => req<void>(`/habits/${id}`, { method: 'DELETE' }),
    },
};
