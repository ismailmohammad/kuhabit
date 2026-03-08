import { useState, useEffect, useRef } from 'react';
import { HabitType } from '../../types/habit';
import { HABIT_ICONS } from '../../utils/habitIcons';
import {
    ScreenGlow, EmberBurst, EmberParticle, FireSurgeWrap, FlameWrap,
    flameRise, flameFlicker,
} from './HabitAnimations';
import styled, { css } from 'styled-components';
import './Habit.css';

const FlamingImg = styled.img<{ $active: boolean }>`
    position: relative;
    z-index: 0;
    width: 3.5rem;
    height: 3.5rem;
    object-fit: contain;
    ${p => p.$active && css`
        animation:
            ${flameRise} 1.9s ease-in-out infinite,
            ${flameFlicker} 0.75s ease-in-out infinite;
    `}
`;

interface HabitProps {
    habitData: HabitType;
    imgSrc: string;
    onToggleComplete: (habit: HabitType) => void;
    onEdit: (habit: HabitType) => void;
}

const DAY_FULL: Record<string, string> = {
    Su: 'Sun', Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat',
};

function Habit({ habitData, imgSrc, onToggleComplete, onEdit }: HabitProps) {
    const [glowActive, setGlowActive] = useState(false);
    const [surge, setSurge] = useState(false);
    const [showEmbers, setShowEmbers] = useState(false);
    const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isStreaking = habitData.streak >= 2;
    const glowColor = habitData.positiveType ? 'green' : 'red';

    useEffect(() => {
        if (glowActive) {
            const t = setTimeout(() => setGlowActive(false), 750);
            return () => clearTimeout(t);
        }
    }, [glowActive]);

    useEffect(() => {
        if (surge) {
            const t = setTimeout(() => setSurge(false), 450);
            return () => clearTimeout(t);
        }
    }, [surge]);

    useEffect(() => {
        if (showEmbers) {
            const t = setTimeout(() => setShowEmbers(false), 850);
            return () => clearTimeout(t);
        }
    }, [showEmbers]);

    useEffect(() => {
        return () => {
            if (completeTimerRef.current) {
                clearTimeout(completeTimerRef.current);
                completeTimerRef.current = null;
            }
        };
    }, []);

    const handleClick = () => {
        // Play fire FX first, then toggle, so rerenders don't cut off the effect.
        if (!habitData.complete && habitData.streak >= 1) {
            setSurge(true);
            setShowEmbers(true);
            setGlowActive(true);
            if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
            completeTimerRef.current = setTimeout(() => {
                onToggleComplete(habitData);
                completeTimerRef.current = null;
            }, 320);
            return;
        }
        onToggleComplete(habitData);
    };

    const todayKey = (() => {
        const keys = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        return keys[new Date().getDay()];
    })();

    const days = habitData.recurrence.split('-');
    const HabitIcon = habitData.icon ? HABIT_ICONS[habitData.icon] : null;

    return (
        <>
            <ScreenGlow $color={glowColor} $active={glowActive} />
            <div className={`habit-card ${habitData.complete ? 'habit-card--complete' : ''}`}>
                <button
                    className={`habit-cube-btn ${habitData.complete || isStreaking ? '' : 'jiggle-on-hover'}`}
                    onClick={handleClick}
                    title={habitData.complete ? 'Mark incomplete' : 'Mark complete'}
                    aria-label={habitData.complete ? 'Mark incomplete' : 'Mark complete'}
                    style={{ position: 'relative' }}
                >
                    <FlameWrap>
                        <FireSurgeWrap $surge={surge}>
                            <FlamingImg
                                className={isStreaking ? '' : 'cube-logo'}
                                src={imgSrc}
                                alt=""
                                $active={isStreaking}
                            />
                        </FireSurgeWrap>
                        {showEmbers && (
                            <EmberBurst>
                                {([1, 2, 3, 4, 5] as const).map(v => (
                                    <EmberParticle key={v} $variant={v} $color={glowColor} />
                                ))}
                            </EmberBurst>
                        )}
                    </FlameWrap>
                    {isStreaking && (
                        <span className="streak-badge">🔥 {habitData.streak}</span>
                    )}
                    {habitData.hasFreeze && habitData.streak >= 1 && (
                        <span className="freeze-badge">❄️</span>
                    )}
                </button>

                <div className="habit-body">
                    <p className="habit-name">
                        {HabitIcon && <HabitIcon size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle', flexShrink: 0 }} />}
                        {habitData.name}
                    </p>
                    <div className="habit-days">
                        {days.map(day => (
                            <span
                                key={day}
                                className={`day-chip ${day === todayKey ? (habitData.complete ? 'day-chip--today-done' : 'day-chip--today') : ''}`}
                                title={DAY_FULL[day] ?? day}
                            >
                                {day}
                            </span>
                        ))}
                    </div>
                    {habitData.notes && (
                        <p className="habit-notes">{habitData.notes}</p>
                    )}
                </div>

                <div className="habit-actions">
                    <button className="btn-edit" onClick={() => onEdit(habitData)}>Edit</button>
                </div>
            </div>
        </>
    );
}

export default Habit;
