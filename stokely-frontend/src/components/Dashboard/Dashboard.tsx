import styled, { keyframes } from "styled-components";
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

// ── Animations ─────────────────────────────────────────────────────────────────

const overlayIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const overlayOut = keyframes`from { opacity: 1; } to { opacity: 0; }`;
const modalIn = keyframes`
    from { opacity: 0; transform: scale(0.93) translateY(8px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);   }
`;
const modalOut = keyframes`
    from { opacity: 1; transform: scale(1)    translateY(0);   }
    to   { opacity: 0; transform: scale(0.93) translateY(8px); }
`;
const contentFadeIn = keyframes`
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0);   }
`;

// ── Styled components ──────────────────────────────────────────────────────────

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

const LoadingDots = styled.div`
    text-align: center;
    padding: 4rem 1rem;
    color: #555;
    font-size: 0.9rem;

    &::after {
        content: '';
        display: inline-block;
        animation: dots 1.2s steps(3, end) infinite;
    }

    @keyframes dots {
        0%   { content: ''; }
        33%  { content: '.'; }
        66%  { content: '..'; }
        100% { content: '...'; }
    }
`;

const ContentArea = styled.div`
    animation: ${contentFadeIn} 0.22s ease-out;
`;

const SectionLabel = styled.h2`
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #666;
    margin: 1.5rem 0 0.5rem;
`;

// ── Confirm modal ──────────────────────────────────────────────────────────────

const ConfirmOverlay = styled.div<{ $closing: boolean }>`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 250;
    padding: 1rem;
    animation: ${p => p.$closing ? overlayOut : overlayIn} 0.18s ease forwards;
`;

const ConfirmBox = styled.div<{ $closing: boolean }>`
    background: #1e1e1e;
    border: 1px solid #333;
    border-radius: 16px;
    padding: 1.5rem 1.75rem;
    max-width: 360px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    animation: ${p => p.$closing ? modalOut : modalIn} 0.2s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
`;

const ConfirmTitle = styled.p`
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: white;
`;

const ConfirmDetail = styled.p`
    margin: 0;
    font-size: 0.875rem;
    color: #888;
    line-height: 1.5;
`;

const ConfirmActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.25rem;
`;

const ConfirmBtn = styled.button<{ $primary?: boolean; $danger?: boolean }>`
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1.1rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
    background: ${p => p.$danger ? '#7a1c1c' : p.$primary ? '#2dca8e' : '#2a2a2a'};
    color: ${p => p.$primary ? '#111' : 'white'};
    &:hover { opacity: 0.85; }
`;

// ── Types ──────────────────────────────────────────────────────────────────────

type ConfirmState = {
    title: string;
    detail?: string;
    confirmLabel: string;
    danger?: boolean;
    onConfirm: () => void;
} | null;

type HabitSectionProps = {
    label: string;
    habits: HabitType[];
    getLogo: (h: HabitType) => string;
    onToggleComplete: (h: HabitType) => void;
    onEdit: (h: HabitType) => void;
};

function HabitSection({ label, habits, getLogo, onToggleComplete, onEdit }: HabitSectionProps) {
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
                        onEdit={onEdit}
                    />
                ))}
            </HabitsContainer>
        </>
    );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const [habits, setHabits] = useState<HabitType[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [habitToEdit, setHabitToEdit] = useState<HabitType | null>(null);
    const [view, setView] = useState<DashboardView>('daily');
    const [calendarDate, setCalendarDate] = useState<string>(todayISO());
    const [contentKey, setContentKey] = useState(0);

    const [confirmState, setConfirmState] = useState<ConfirmState>(null);
    const [confirmClosing, setConfirmClosing] = useState(false);

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
                if (!cancelled) {
                    setHabits(data);
                    setContentKey(k => k + 1);
                }
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

    const dismissConfirm = () => {
        setConfirmClosing(true);
        setTimeout(() => { setConfirmState(null); setConfirmClosing(false); }, 180);
    };

    const showConfirm = (state: ConfirmState) => {
        setConfirmClosing(false);
        setConfirmState(state);
    };

    const doToggle = async (habit: HabitType, next: boolean) => {
        setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, complete: next } : h));
        try {
            if (next) {
                await api.habits.logComplete(habit.id, effectiveDate);
            } else {
                await api.habits.logUncomplete(habit.id, effectiveDate);
            }
            const date = view === 'calendar' ? calendarDate : undefined;
            const data = await api.habits.list(view === 'streak' ? 'all' : view, date);
            setHabits(data);
            toast.success(next ? `✓ "${habit.name}" complete` : `↩ "${habit.name}" reset`);
        } catch (err: unknown) {
            setHabits(prev => prev.map(h => h.id === habit.id ? habit : h));
            toast.error(err instanceof Error ? err.message : "Update failed");
        }
    };

    const handleToggleComplete = (habit: HabitType) => {
        const next = !habit.complete;

        // Revert → show confirm modal
        if (habit.complete) {
            showConfirm({
                title: `Revert "${habit.name}"?`,
                detail: 'This will mark it as incomplete for this date.',
                confirmLabel: 'Revert',
                onConfirm: () => { dismissConfirm(); doToggle(habit, false); },
            });
            return;
        }

        // Future date → show confirm modal
        if (view === 'calendar' && calendarDate > todayISO()) {
            showConfirm({
                title: `Log "${habit.name}" for a future date?`,
                detail: `You're marking this complete for ${calendarDate}.`,
                confirmLabel: 'Log Anyway',
                onConfirm: () => { dismissConfirm(); doToggle(habit, true); },
            });
            return;
        }

        doToggle(habit, next);
    };

    const handleDelete = async (id: number) => {
        const habit = habits.find(h => h.id === id);
        closeModal();
        setHabits(prev => prev.filter(h => h.id !== id));
        try {
            await api.habits.remove(id);
            toast.success(`"${habit?.name}" ended`);
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
                    <LoadingDots>Loading your habits</LoadingDots>
                ) : (
                    <ContentArea key={contentKey}>
                        {view === 'streak' ? (
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
                                    onEdit={openEdit}
                                />
                                <HabitSection
                                    label={`Completed — ${complete.length}`}
                                    habits={complete}
                                    getLogo={getLogo}
                                    onToggleComplete={handleToggleComplete}
                                    onEdit={openEdit}
                                />
                            </>
                        )}
                    </ContentArea>
                )}
            </Page>

            <HabitModal
                showModal={modalOpen}
                onClose={closeModal}
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                habitToEdit={habitToEdit}
            />

            {confirmState && (
                <ConfirmOverlay $closing={confirmClosing} onClick={dismissConfirm}>
                    <ConfirmBox $closing={confirmClosing} onClick={e => e.stopPropagation()}>
                        <ConfirmTitle>{confirmState.title}</ConfirmTitle>
                        {confirmState.detail && <ConfirmDetail>{confirmState.detail}</ConfirmDetail>}
                        <ConfirmActions>
                            <ConfirmBtn onClick={dismissConfirm}>Cancel</ConfirmBtn>
                            <ConfirmBtn
                                $danger={confirmState.danger}
                                $primary={!confirmState.danger}
                                onClick={confirmState.onConfirm}
                            >
                                {confirmState.confirmLabel}
                            </ConfirmBtn>
                        </ConfirmActions>
                    </ConfirmBox>
                </ConfirmOverlay>
            )}
        </>
    );
}
