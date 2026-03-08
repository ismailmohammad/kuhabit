import styled from "styled-components";
import Habit from "./Habit";
import StreakView from "./StreakView";
import { HabitType, DashboardView } from "../../types/habit";
import { useState, useEffect } from "react";
import HabitModal from "./NewHabitModal";
import toast from "react-hot-toast";
import { api } from "../../api/api";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setUserInfo } from "../../redux/userSlice";
import type { RootState } from "../../redux/store";

import CubeRed from '../../assets/cube-logo-red.png';
import CubeRedTop from '../../assets/cube-logo-red-top.png';
import CubeRedRight from '../../assets/cube-logo-red-right.png';
import CubeRedLeft from '../../assets/cube-logo-red-left.png';
import CubeGreen from '../../assets/cube-logo-green.png';
import CubeGreenTop from '../../assets/cube-logo-green-top.png';
import CubeGreenRight from '../../assets/cube-logo-green-right.png';
import CubeGreenLeft from '../../assets/cube-logo-green-left.png';
import FieryGreen from '../../assets/fiery-cube-green.png';
import FieryRed from '../../assets/fiery-cube-red.png';

const negativeLogos = [CubeRedTop, CubeRedRight, CubeRedLeft];
const positiveLogos = [CubeGreenLeft, CubeGreenRight, CubeGreenTop];

function getRandomCubeLogo(positive: boolean): string {
    const images = positive ? positiveLogos : negativeLogos;
    return images[Math.floor(Math.random() * images.length)];
}

function todayISO(): string {
    return new Date().toISOString().split('T')[0];
}

const Page = styled.div`
    max-width: 900px;
    margin: 0 auto;
    padding: 1.5rem 1rem;
    animation: page-fade-in 0.22s ease-out;
`;

const PageHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
`;

const PageTitle = styled.div``;

const DayLabel = styled.p`
    color: #888;
    margin: 0.25rem 0 0;
    font-size: 0.95rem;
`;

const AddButton = styled.button`
    background: #2dca8e;
    color: #111;
    font-weight: 700;
    border: none;
    border-radius: 10px;
    padding: 0.6rem 1.25rem;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background: #25b07b; }
`;

const ViewTabBar = styled.div`
    display: flex;
    gap: 0.25rem;
    margin-bottom: 1.25rem;
    border-bottom: 1px solid #2a2a2a;
    padding-bottom: 0;
`;

const ViewTab = styled.button<{ $active: boolean }>`
    background: none;
    border: none;
    color: ${p => p.$active ? '#2dca8e' : '#666'};
    font-size: 0.9rem;
    font-weight: ${p => p.$active ? '600' : '400'};
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-bottom: 2px solid ${p => p.$active ? '#2dca8e' : 'transparent'};
    margin-bottom: -1px;
    transition: color 0.15s, border-color 0.15s;
    &:hover { color: ${p => p.$active ? '#2dca8e' : '#aaa'}; }
`;

const CalendarInput = styled.input`
    background: #1e1e1e;
    color: white;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 0.4rem 0.75rem;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    color-scheme: dark;
    cursor: pointer;
`;

const HabitsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 4rem 1rem;
    color: #666;
    background: #1a1a1a;
    border: 1px dashed #333;
    border-radius: 12px;
`;

const LoadingState = styled.div`
    text-align: center;
    padding: 4rem 1rem;
    color: #888;
`;

const SectionLabel = styled.h2`
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #666;
    margin: 1.5rem 0 0.5rem;
`;

type HabitSectionProps = {
    label: string;
    habits: HabitType[];
    getLogo: (h: HabitType) => string;
    onToggleComplete: (h: HabitType) => void;
    onDelete: (id: number) => void;
    onEdit: (h: HabitType) => void;
};

function HabitSection({ label, habits, getLogo, onToggleComplete, onDelete, onEdit }: HabitSectionProps) {
    if (habits.length === 0) return null;
    return (
        <>
            <SectionLabel>{label}</SectionLabel>
            <HabitsContainer>
                {habits.map(habit => (
                    <Habit
                        key={habit.id}
                        habitData={habit}
                        imgSrc={getLogo(habit)}
                        onToggleComplete={onToggleComplete}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                ))}
            </HabitsContainer>
        </>
    );
}

export default function Dashboard() {
    const [habits, setHabits] = useState<HabitType[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [habitToEdit, setHabitToEdit] = useState<HabitType | null>(null);
    const [view, setView] = useState<DashboardView>('daily');
    const [calendarDate, setCalendarDate] = useState<string>(todayISO());

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const userInfo = useSelector((state: RootState) => state.user.userInfo);

    const [logoMap] = useState<Map<number, string>>(new Map());

    function getLogo(habit: HabitType): string {
        if (habit.streak >= 2) return habit.positiveType ? FieryGreen : FieryRed;
        if (habit.complete) return habit.positiveType ? CubeGreen : CubeRed;
        if (!logoMap.has(habit.id)) {
            logoMap.set(habit.id, getRandomCubeLogo(habit.positiveType));
        }
        return logoMap.get(habit.id)!;
    }

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                if (!userInfo) {
                    const me = await api.auth.me();
                    if (!cancelled) dispatch(setUserInfo(me));
                }
                const date = view === 'calendar' ? calendarDate : undefined;
                const data = await api.habits.list(view === 'streak' ? 'all' : view, date);
                if (!cancelled) setHabits(data);
            } catch {
                if (!cancelled) navigate("/login");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [view, calendarDate]);

    const effectiveDate = view === 'calendar' ? calendarDate : undefined;

    const handleToggleComplete = async (habit: HabitType) => {
        const next = !habit.complete;
        if (habit.complete) {
            const confirmed = window.confirm(`Revert "${habit.name}" as incomplete?`);
            if (!confirmed) return;
        }
        setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, complete: next } : h));
        try {
            if (next) {
                await api.habits.logComplete(habit.id, effectiveDate);
            } else {
                await api.habits.logUncomplete(habit.id, effectiveDate);
            }
            // Refresh to get updated streak/hasFreeze
            const date = view === 'calendar' ? calendarDate : undefined;
            const data = await api.habits.list(view === 'streak' ? 'all' : view, date);
            setHabits(data);
            toast.success(next ? `✓ "${habit.name}" complete` : `↩ "${habit.name}" reset`);
        } catch (err: unknown) {
            setHabits(prev => prev.map(h => h.id === habit.id ? habit : h));
            toast.error(err instanceof Error ? err.message : "Update failed");
        }
    };

    const handleDelete = async (id: number) => {
        const habit = habits.find(h => h.id === id);
        setHabits(prev => prev.filter(h => h.id !== id));
        try {
            await api.habits.remove(id);
            toast.success(`Removed "${habit?.name}"`);
        } catch (err: unknown) {
            if (habit) setHabits(prev => [...prev, habit].sort((a, b) => a.id - b.id));
            toast.error(err instanceof Error ? err.message : "Delete failed");
        }
    };

    const handleCreate = async (data: {
        name: string; recurrence: string; positiveType: boolean;
        icon?: string; recurrenceEnd?: string | null; notes?: string; reminderTime?: string;
    }) => {
        try {
            const newHabit = await api.habits.create(data);
            setHabits(prev => [...prev, newHabit]);
            toast.success(`"${newHabit.name}" added`);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to create habit");
        }
    };

    const handleUpdate = async (id: number, changes: Record<string, unknown>) => {
        try {
            const updated = await api.habits.update(id, changes);
            setHabits(prev => prev.map(h => h.id === id ? updated : h));
            toast.success("Habit updated");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Update failed");
        }
    };

    const openEdit = (habit: HabitType) => {
        setHabitToEdit(habit);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setHabitToEdit(null);
    };

    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const incomplete = habits.filter(h => !h.complete);
    const complete = habits.filter(h => h.complete);

    const views: { id: DashboardView; label: string }[] = [
        { id: 'daily', label: 'Daily' },
        { id: 'all', label: 'All' },
        { id: 'calendar', label: 'Calendar' },
        { id: 'streak', label: 'Streaks' },
    ];

    return (
        <>
            <Page>
                <PageHeader>
                    <PageTitle>
                        <h1 style={{ margin: 0, fontSize: "clamp(1.4rem, 4vw, 2rem)" }}>
                            {userInfo ? `Hey, ${userInfo.username}` : 'Dashboard'}
                        </h1>
                        <DayLabel>{date}</DayLabel>
                    </PageTitle>
                    <AddButton onClick={() => { setHabitToEdit(null); setModalOpen(true); }}>
                        + New Habit
                    </AddButton>
                </PageHeader>

                <ViewTabBar>
                    {views.map(v => (
                        <ViewTab key={v.id} $active={view === v.id} onClick={() => setView(v.id)}>
                            {v.label}
                        </ViewTab>
                    ))}
                </ViewTabBar>

                {view === 'calendar' && (
                    <CalendarInput
                        type="date"
                        value={calendarDate}
                        onChange={e => setCalendarDate(e.target.value)}
                    />
                )}

                {loading ? (
                    <LoadingState>Loading your habits…</LoadingState>
                ) : view === 'streak' ? (
                    <StreakView habits={habits} />
                ) : habits.length === 0 ? (
                    <EmptyState>
                        <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>No habits here.</p>
                        <p style={{ fontSize: "0.9rem" }}>Click <strong>+ New Habit</strong> to add one.</p>
                    </EmptyState>
                ) : (
                    <>
                        <HabitSection
                            label={`To Do — ${incomplete.length}`}
                            habits={incomplete}
                            getLogo={getLogo}
                            onToggleComplete={handleToggleComplete}
                            onDelete={handleDelete}
                            onEdit={openEdit}
                        />
                        <HabitSection
                            label={`Completed — ${complete.length}`}
                            habits={complete}
                            getLogo={getLogo}
                            onToggleComplete={handleToggleComplete}
                            onDelete={handleDelete}
                            onEdit={openEdit}
                        />
                    </>
                )}
            </Page>

            <HabitModal
                showModal={modalOpen}
                onClose={closeModal}
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                habitToEdit={habitToEdit}
            />
        </>
    );
}
