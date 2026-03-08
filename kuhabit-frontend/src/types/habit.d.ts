export interface HabitType {
    id: number;
    name: string;
    complete: boolean;
    recurrence: string;
    positiveType: boolean;
}

export interface UserInfo {
    id: number;
    username: string;
    email?: string;
}
