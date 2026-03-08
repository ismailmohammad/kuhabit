import type { HabitType, UserInfo, DashboardView, StreakDetail, AchievementType } from '../types/habit';

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
        changePassword: (currentPassword: string, newPassword: string) =>
            req<void>('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
        markWelcomeSeen: () => req<void>('/auth/welcome-seen', { method: 'POST' }),
        setDailySparkEnabled: (enabled: boolean) =>
            req<{ dailySparkEnabled: boolean }>('/auth/daily-spark', { method: 'PUT', body: JSON.stringify({ enabled }) }),
    },
    habits: {
        list: (view: DashboardView = 'daily', date?: string) =>
            req<HabitType[]>(`/habits?view=${view}${date ? `&date=${date}` : ''}`),
        create: (data: {
            name: string; recurrence: string; positiveType: boolean;
            icon?: string; recurrenceEnd?: string | null; notes?: string; reminderTime?: string;
        }) =>
            req<HabitType>('/habits', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, changes: Record<string, unknown>) =>
            req<HabitType>(`/habits/${id}`, { method: 'PUT', body: JSON.stringify(changes) }),
        remove: (id: number) => req<void>(`/habits/${id}`, { method: 'DELETE' }),
        logComplete: (id: number, date?: string) =>
            req<void>(`/habits/${id}/log`, { method: 'POST', body: JSON.stringify({ date: date ?? '' }) }),
        logUncomplete: (id: number, date?: string) =>
            req<void>(`/habits/${id}/log`, { method: 'DELETE', body: JSON.stringify({ date: date ?? '' }) }),
        getStreak: (id: number) =>
            req<StreakDetail>(`/habits/${id}/streak`),
        getAchievements: () =>
            req<AchievementType[]>('/habits/achievements'),
    },
    push: {
        getVapidKey: () => req<{ publicKey: string }>('/push/vapid-public'),
        subscribe: (sub: { endpoint: string; p256dh: string; auth: string }) =>
            req<void>('/push/subscribe', { method: 'POST', body: JSON.stringify(sub) }),
        unsubscribe: (endpoint: string) =>
            req<void>('/push/unsubscribe', { method: 'DELETE', body: JSON.stringify({ endpoint }) }),
    },
    user: {
        exportData: () => req<unknown>('/user/export'),
        deleteAccount: (password: string) =>
            req<void>('/user/account', { method: 'DELETE', body: JSON.stringify({ password }) }),
    },
};
