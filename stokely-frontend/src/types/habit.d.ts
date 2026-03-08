export interface HabitType {
    id: number;
    name: string;
    complete: boolean;
    recurrence: string;
    positiveType: boolean;
    icon: string;
    recurrenceEnd?: string;   // ISO date string e.g. "2026-06-01T00:00:00Z"
    notes: string;
    reminderTime: string;     // "HH:MM" UTC, "" = no reminder
    streak: number;
    hasFreeze: boolean;
    createdAt: string;
}

export interface UserInfo {
    id: number;
    username: string;
    email?: string;
}

export type DashboardView = 'daily' | 'all' | 'calendar' | 'streak' | 'achievements';

export interface DayStatus {
    date: string;
    scheduled: boolean;
    completed: boolean;
    frozen: boolean;
}

export interface StreakDetail {
    currentStreak: number;
    longestStreak: number;
    freezeCount: number;
    history: DayStatus[];
}

export interface AchievementType {
    key: string;
    title: string;
    description: string;
    unlocked: boolean;
}
