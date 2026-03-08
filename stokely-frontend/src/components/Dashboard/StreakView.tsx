import { useState } from 'react';
import styled from 'styled-components';
import { HabitType, StreakDetail } from '../../types/habit';
import { api } from '../../api/api';
import FieryGreen from '../../assets/fiery-cube-green.png';
import FieryRed from '../../assets/fiery-cube-red.png';
import CubeGreen from '../../assets/cube-logo-green.png';
import CubeRed from '../../assets/cube-logo-red.png';

const Grid = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
`;

const FreezeBar = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.6rem 1rem;
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 10px;
    font-size: 0.9rem;
    color: #aaa;
`;

const FreezeCount = styled.span`
    color: #7ec8e3;
    font-weight: 700;
    font-size: 1rem;
`;

const Card = styled.div`
    background: #1e1e1e;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    overflow: hidden;
`;

const CardHeader = styled.button`
    width: 100%;
    background: none;
    border: none;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 1rem;
    cursor: pointer;
    text-align: left;
    color: white;
    &:hover { background: rgba(255,255,255,0.03); }
`;

const CubeImg = styled.img`
    width: 2.5rem;
    height: 2.5rem;
    object-fit: contain;
    flex-shrink: 0;
`;

const CardName = styled.span`
    flex: 1;
    font-size: 1rem;
    font-weight: 500;
`;

const StreakBadge = styled.span<{ $active: boolean }>`
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
    background: ${p => p.$active ? 'rgba(255, 140, 0, 0.15)' : '#2a2a2a'};
    color: ${p => p.$active ? '#ffab44' : '#666'};
`;

const ExpandedDetail = styled.div`
    padding: 0.75rem 1rem 1rem;
    border-top: 1px solid #2a2a2a;
`;

const StatRow = styled.div`
    display: flex;
    gap: 1.5rem;
    margin-bottom: 0.75rem;
`;

const Stat = styled.div`
    font-size: 0.82rem;
    color: #888;
    span { color: white; font-weight: 600; font-size: 1rem; }
`;

const HistoryGrid = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    margin-top: 0.5rem;
`;

const DayDot = styled.div<{ $state: 'completed' | 'frozen' | 'missed' | 'future' | 'unscheduled' }>`
    width: 14px;
    height: 14px;
    border-radius: 3px;
    background: ${p => {
        switch (p.$state) {
            case 'completed': return '#2dca8e';
            case 'frozen': return '#7ec8e3';
            case 'missed': return '#7a1c1c';
            case 'future': return '#2a2a2a';
            case 'unscheduled': return '#1e1e1e';
        }
    }};
    border: 1px solid ${p => p.$state === 'unscheduled' ? '#222' : 'transparent'};
`;

const DayDotButton = styled.button`
    border: none;
    background: transparent;
    padding: 0;
    margin: 0;
    cursor: pointer;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
`;

const DayDotTooltip = styled.div`
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(20, 20, 20, 0.88);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 700;
    white-space: nowrap;
    border-radius: 9px;
    padding: 0.32rem 0.48rem;
    border: 1px solid rgba(255, 255, 255, 0.16);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s ease;
    z-index: 15;

    ${DayDotButton}:hover &,
    ${DayDotButton}:focus-visible & {
        opacity: 1;
    }
`;

const LegendRow = styled.div`
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
`;

const LegendItem = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.72rem;
    color: #666;
`;

const Chevron = styled.span<{ $open: boolean }>`
    font-size: 0.75rem;
    color: #555;
    transform: rotate(${p => p.$open ? '90deg' : '0deg'});
    transition: transform 0.2s;
    display: inline-block;
`;

const EmptyStreak = styled.div`
    text-align: center;
    padding: 3rem 1rem;
    color: #555;
    font-size: 0.95rem;
`;

type CardState = { detail: StreakDetail | null; loading: boolean };

type StreakViewProps = {
    habits: HabitType[];
    onDaySelect: (dateValue: string, habitName: string) => void;
};

export default function StreakView({ habits, onDaySelect }: StreakViewProps) {
    const [expanded, setExpanded] = useState<number | null>(null);
    const [cardData, setCardData] = useState<Record<number, CardState>>({});

    // Get freeze count from the first habit that has it (all habits share the same user freeze pool)
    const freezeCount = habits.length > 0 && cardData[habits[0]?.id]?.detail
        ? cardData[habits[0].id].detail!.freezeCount
        : null;

    const today = new Date().toISOString().split('T')[0];

    const toggle = async (id: number) => {
        if (expanded === id) {
            setExpanded(null);
            return;
        }
        setExpanded(id);
        if (!cardData[id]?.detail) {
            setCardData(prev => ({ ...prev, [id]: { detail: null, loading: true } }));
            try {
                const detail = await api.habits.getStreak(id);
                setCardData(prev => ({ ...prev, [id]: { detail, loading: false } }));
            } catch {
                setCardData(prev => ({ ...prev, [id]: { detail: null, loading: false } }));
            }
        }
    };

    if (habits.length === 0) {
        return <EmptyStreak>No habits to show streaks for.</EmptyStreak>;
    }

    return (
        <Grid>
            <FreezeBar>
                ❄️ Streak Freezes:&nbsp;
                <FreezeCount>
                    {freezeCount !== null ? freezeCount : habits.some(h => h.hasFreeze) ? '1+' : '0'}
                </FreezeCount>
                <span style={{ color: '#555', fontSize: '0.8rem' }}>
                    &nbsp;— Earn 1 freeze every 7-day streak milestone. Used automatically on missed days.
                </span>
            </FreezeBar>

            {habits.map(habit => {
                const isOpen = expanded === habit.id;
                const state = cardData[habit.id];
                const cubeImg = habit.streak >= 2
                    ? (habit.positiveType ? FieryGreen : FieryRed)
                    : (habit.positiveType ? CubeGreen : CubeRed);

                return (
                    <Card key={habit.id}>
                        <CardHeader onClick={() => toggle(habit.id)}>
                            <CubeImg src={cubeImg} alt="" />
                            <CardName>{habit.name}</CardName>
                            <StreakBadge $active={habit.streak >= 2}>
                                {habit.streak >= 2 ? '🔥' : '📅'} {habit.streak} day{habit.streak !== 1 ? 's' : ''}
                            </StreakBadge>
                            <Chevron $open={isOpen}>›</Chevron>
                        </CardHeader>

                        {isOpen && (
                            <ExpandedDetail>
                                {state?.loading && <p style={{ color: '#666', fontSize: '0.85rem' }}>Loading…</p>}
                                {state?.detail && (() => {
                                    const d = state.detail;
                                    return (
                                        <>
                                            <StatRow>
                                                <Stat>Current streak<br /><span>{d.currentStreak} days</span></Stat>
                                                <Stat>Longest streak<br /><span>{d.longestStreak} days</span></Stat>
                                                <Stat>Freezes<br /><span>❄️ {d.freezeCount}</span></Stat>
                                            </StatRow>
                                            <HistoryGrid>
                                                {d.history.map(day => {
                                                    let dotState: 'completed' | 'frozen' | 'missed' | 'future' | 'unscheduled';
                                                    if (!day.scheduled) {
                                                        dotState = 'unscheduled';
                                                    } else if (day.completed) {
                                                        dotState = 'completed';
                                                    } else if (day.frozen) {
                                                        dotState = 'frozen';
                                                    } else if (day.date > today) {
                                                        dotState = 'future';
                                                    } else {
                                                        dotState = 'missed';
                                                    }
                                                    return (
                                                        <DayDotButton
                                                            key={day.date}
                                                            onClick={() => onDaySelect(day.date, habit.name)}
                                                            aria-label={`${day.date}: ${dotState}. Open in calendar view`}
                                                        >
                                                            <DayDot $state={dotState} />
                                                            <DayDotTooltip>
                                                                {day.date} • {dotState}
                                                            </DayDotTooltip>
                                                        </DayDotButton>
                                                    );
                                                })}
                                            </HistoryGrid>
                                            <LegendRow>
                                                <LegendItem><DayDot $state="completed" />Done</LegendItem>
                                                <LegendItem><DayDot $state="frozen" />Frozen</LegendItem>
                                                <LegendItem><DayDot $state="missed" />Missed</LegendItem>
                                                <LegendItem><DayDot $state="unscheduled" />Off day</LegendItem>
                                            </LegendRow>
                                        </>
                                    );
                                })()}
                            </ExpandedDetail>
                        )}
                    </Card>
                );
            })}
        </Grid>
    );
}
