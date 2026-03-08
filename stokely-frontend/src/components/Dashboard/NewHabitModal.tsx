import React, { useState, useEffect } from "react";
import './NewHabitModal.css';
import { HabitType } from "../../types/habit";

import CurbCube from '../../assets/cube-logo-red.png';
import BuildCube from '../../assets/cube-logo-green.png';

interface HabitModalProps {
    showModal: boolean;
    onClose: () => void;
    onCreate: (name: string, recurrence: string, positiveType: boolean) => void;
    onUpdate: (id: number, changes: Partial<Omit<HabitType, 'id'>>) => void;
    habitToEdit: HabitType | null;
}

const PRESET_RECURRENCES: Record<string, string> = {
    Daily: 'Su-Mo-Tu-We-Th-Fr-Sa',
    Weekdays: 'Mo-Tu-We-Th-Fr',
    Weekends: 'Su-Sa',
};

const ALL_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const DAY_LABEL: Record<string, string> = {
    Su: 'Sun', Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat',
};

function recurrenceToCustomDays(rec: string): Record<string, boolean> {
    const set = new Set(rec.split('-'));
    return Object.fromEntries(ALL_DAYS.map(d => [d, set.has(d)]));
}

function detectPreset(rec: string): string {
    for (const [label, val] of Object.entries(PRESET_RECURRENCES)) {
        if (val === rec) return label;
    }
    return 'Custom';
}

const HabitModal = ({ showModal, onClose, onCreate, onUpdate, habitToEdit }: HabitModalProps) => {
    const isEdit = habitToEdit !== null;

    const [name, setName] = useState('');
    const [positiveType, setPositiveType] = useState(false);
    const [preset, setPreset] = useState<string>('Daily');
    const [customDays, setCustomDays] = useState<Record<string, boolean>>(
        Object.fromEntries(ALL_DAYS.map(d => [d, false]))
    );

    // Populate form when editing
    useEffect(() => {
        if (habitToEdit) {
            setName(habitToEdit.name);
            setPositiveType(habitToEdit.positiveType);
            const p = detectPreset(habitToEdit.recurrence);
            setPreset(p);
            if (p === 'Custom') setCustomDays(recurrenceToCustomDays(habitToEdit.recurrence));
        } else {
            setName('');
            setPositiveType(false);
            setPreset('Daily');
            setCustomDays(Object.fromEntries(ALL_DAYS.map(d => [d, false])));
        }
    }, [habitToEdit, showModal]);

    if (!showModal) return null;

    const buildRecurrence = (): string => {
        if (preset !== 'Custom') return PRESET_RECURRENCES[preset];
        return ALL_DAYS.filter(d => customDays[d]).join('-') || 'Su';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const recurrence = buildRecurrence();
        if (isEdit && habitToEdit) {
            onUpdate(habitToEdit.id, { name, recurrence, positiveType });
        } else {
            onCreate(name, recurrence, positiveType);
        }
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEdit ? 'Edit Habit' : 'New Habit'}</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <label className="modal-label">Habit name</label>
                    <input
                        className="modal-input"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Read 20 pages"
                        required
                        autoFocus
                    />

                    <label className="modal-label">Type</label>
                    <div className="type-toggle">
                        <img src={CurbCube} className="type-icon" alt="Curb" />
                        <span className={!positiveType ? 'type-label type-label--active' : 'type-label'}>Curb</span>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={positiveType}
                                onChange={() => setPositiveType(p => !p)}
                            />
                            <span className="slider round"></span>
                        </label>
                        <span className={positiveType ? 'type-label type-label--active' : 'type-label'}>Build</span>
                        <img src={BuildCube} className="type-icon" alt="Build" />
                    </div>

                    <label className="modal-label">Recurrence</label>
                    <div className="recurrence-presets">
                        {Object.keys(PRESET_RECURRENCES).concat('Custom').map(p => (
                            <button
                                key={p}
                                type="button"
                                className={`preset-btn ${preset === p ? 'preset-btn--active' : ''}`}
                                onClick={() => setPreset(p)}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {preset === 'Custom' && (
                        <div className="custom-days">
                            {ALL_DAYS.map(day => (
                                <label key={day} className={`day-toggle ${customDays[day] ? 'day-toggle--on' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={customDays[day]}
                                        onChange={e => setCustomDays(prev => ({ ...prev, [day]: e.target.checked }))}
                                    />
                                    {DAY_LABEL[day]}
                                </label>
                            ))}
                        </div>
                    )}

                    <button className="modal-submit" type="submit">
                        {isEdit ? 'Save Changes' : 'Add Habit'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default HabitModal;
