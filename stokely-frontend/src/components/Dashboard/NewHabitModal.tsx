import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import './NewHabitModal.css';
import { HabitType } from "../../types/habit";
import { HABIT_ICONS } from "../../utils/habitIcons";
import { api } from "../../api/api";
import { registerServiceWorker, subscribeToPush } from "../../utils/pushNotifications";

import CurbCube from '../../assets/cube-logo-red.png';
import BuildCube from '../../assets/cube-logo-green.png';

interface HabitModalProps {
    showModal: boolean;
    onClose: () => void;
    onCreate: (data: {
        name: string; recurrence: string; positiveType: boolean;
        icon?: string; recurrenceEnd?: string | null; notes?: string; reminderTime?: string;
    }) => void;
    onUpdate: (id: number, changes: Record<string, unknown>) => void;
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

function localTimeToUTC(localTime: string): string {
    if (!localTime) return '';
    const [h, m] = localTime.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function utcTimeToLocal(utcTime: string): string {
    if (!utcTime) return '';
    const [h, m] = utcTime.split(':').map(Number);
    const d = new Date();
    d.setUTCHours(h, m, 0, 0);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function IconPicker({ selected, onSelect }: { selected: string; onSelect: (name: string) => void }) {
    const [search, setSearch] = useState('');
    const entries = Object.entries(HABIT_ICONS).filter(([name]) =>
        name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="icon-picker">
            <input
                className="modal-input"
                placeholder="Search icons…"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
            <div className="icon-grid">
                {entries.map(([name, Icon]) => (
                    <button
                        key={name}
                        type="button"
                        className={`icon-btn ${selected === name ? 'icon-btn--selected' : ''}`}
                        onClick={() => onSelect(selected === name ? '' : name)}
                        title={name}
                    >
                        <Icon size={18} />
                    </button>
                ))}
            </div>
        </div>
    );
}

const HabitModal = ({ showModal, onClose, onCreate, onUpdate, habitToEdit }: HabitModalProps) => {
    const isEdit = habitToEdit !== null;

    const [name, setName] = useState('');
    const [positiveType, setPositiveType] = useState(false);
    const [preset, setPreset] = useState<string>('Daily');
    const [customDays, setCustomDays] = useState<Record<string, boolean>>(
        Object.fromEntries(ALL_DAYS.map(d => [d, false]))
    );
    const [icon, setIcon] = useState('');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [recurrenceEnd, setRecurrenceEnd] = useState<string>('');
    const [useEndDate, setUseEndDate] = useState(false);
    const [notes, setNotes] = useState('');
    const [reminderTime, setReminderTime] = useState('');

    useEffect(() => {
        if (habitToEdit) {
            setName(habitToEdit.name);
            setPositiveType(habitToEdit.positiveType);
            const p = detectPreset(habitToEdit.recurrence);
            setPreset(p);
            if (p === 'Custom') setCustomDays(recurrenceToCustomDays(habitToEdit.recurrence));
            setIcon(habitToEdit.icon || '');
            setNotes(habitToEdit.notes || '');
            setReminderTime(utcTimeToLocal(habitToEdit.reminderTime || ''));
            if (habitToEdit.recurrenceEnd) {
                setUseEndDate(true);
                setRecurrenceEnd(habitToEdit.recurrenceEnd.split('T')[0]);
            } else {
                setUseEndDate(false);
                setRecurrenceEnd('');
            }
        } else {
            setName('');
            setPositiveType(false);
            setPreset('Daily');
            setCustomDays(Object.fromEntries(ALL_DAYS.map(d => [d, false])));
            setIcon('');
            setShowIconPicker(false);
            setNotes('');
            setReminderTime('');
            setUseEndDate(false);
            setRecurrenceEnd('');
        }
    }, [habitToEdit, showModal]);

    if (!showModal) return null;

    const buildRecurrence = (): string => {
        if (preset !== 'Custom') return PRESET_RECURRENCES[preset];
        return ALL_DAYS.filter(d => customDays[d]).join('-') || 'Su';
    };

    const todayISO = new Date().toISOString().split('T')[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const recurrence = buildRecurrence();
        const utcReminder = localTimeToUTC(reminderTime);
        const endDate = useEndDate && recurrenceEnd ? recurrenceEnd : null;

        // Register push subscription if reminder is set
        if (reminderTime) {
            try {
                const reg = await registerServiceWorker();
                if (reg) {
                    const { publicKey } = await api.push.getVapidKey();
                    if (publicKey) {
                        const sub = await subscribeToPush(reg, publicKey);
                        if (sub) {
                            const json = sub.toJSON();
                            await api.push.subscribe({
                                endpoint: sub.endpoint,
                                p256dh: (json.keys as Record<string, string>)?.p256dh ?? '',
                                auth: (json.keys as Record<string, string>)?.auth ?? '',
                            });
                        } else {
                            toast.error('Enable browser notifications to use reminders');
                        }
                    }
                }
            } catch {
                toast.error('Could not set up push notifications');
            }
        }

        if (isEdit && habitToEdit) {
            onUpdate(habitToEdit.id, {
                name, recurrence, positiveType,
                icon, notes,
                reminderTime: utcReminder,
                recurrenceEnd: endDate,
            });
        } else {
            onCreate({
                name, recurrence, positiveType,
                icon, notes,
                reminderTime: utcReminder,
                recurrenceEnd: endDate,
            });
        }
        onClose();
    };

    const SelectedIcon = icon ? HABIT_ICONS[icon] : null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEdit ? 'Edit Habit' : 'New Habit'}</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {/* Name */}
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

                    {/* Icon */}
                    <label className="modal-label">Icon (optional)</label>
                    <button
                        type="button"
                        className={`icon-toggle-btn ${showIconPicker ? 'icon-toggle-btn--open' : ''}`}
                        onClick={() => setShowIconPicker(p => !p)}
                    >
                        {SelectedIcon
                            ? <><SelectedIcon size={16} /> {icon}</>
                            : 'Choose icon…'}
                    </button>
                    {showIconPicker && (
                        <IconPicker selected={icon} onSelect={name => { setIcon(name); setShowIconPicker(false); }} />
                    )}

                    {/* Type */}
                    <label className="modal-label">Type</label>
                    <div className="type-toggle">
                        <img src={CurbCube} className="type-icon" alt="Curb" />
                        <span className={!positiveType ? 'type-label type-label--active' : 'type-label'}>Curb</span>
                        <label className="switch">
                            <input type="checkbox" checked={positiveType} onChange={() => setPositiveType(p => !p)} />
                            <span className="slider round"></span>
                        </label>
                        <span className={positiveType ? 'type-label type-label--active' : 'type-label'}>Build</span>
                        <img src={BuildCube} className="type-icon" alt="Build" />
                    </div>

                    {/* Recurrence */}
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

                    {/* Recurrence end date */}
                    <label className="modal-label">Ends</label>
                    <div className="recurrence-presets">
                        <button
                            type="button"
                            className={`preset-btn ${!useEndDate ? 'preset-btn--active' : ''}`}
                            onClick={() => setUseEndDate(false)}
                        >
                            Indefinitely
                        </button>
                        <button
                            type="button"
                            className={`preset-btn ${useEndDate ? 'preset-btn--active' : ''}`}
                            onClick={() => { setUseEndDate(true); if (!recurrenceEnd) setRecurrenceEnd(todayISO); }}
                        >
                            Until date
                        </button>
                    </div>
                    {useEndDate && (
                        <input
                            type="date"
                            className="modal-input modal-input--date"
                            value={recurrenceEnd}
                            min={todayISO}
                            onChange={e => setRecurrenceEnd(e.target.value)}
                        />
                    )}

                    {/* Notes */}
                    <label className="modal-label">Notes (optional)</label>
                    <textarea
                        className="modal-input modal-textarea"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Any details about this habit…"
                        rows={3}
                    />

                    {/* Reminder */}
                    <label className="modal-label">Reminder time (optional)</label>
                    <div className="reminder-row">
                        <input
                            type="time"
                            className="modal-input"
                            value={reminderTime}
                            onChange={e => setReminderTime(e.target.value)}
                        />
                        {reminderTime && (
                            <button type="button" className="btn-clear-time" onClick={() => setReminderTime('')}>
                                Clear
                            </button>
                        )}
                    </div>
                    {reminderTime && (
                        <p className="modal-hint">
                            You'll get a push notification if this habit isn't done by this time.
                        </p>
                    )}

                    <button className="modal-submit" type="submit">
                        {isEdit ? 'Save Changes' : 'Add Habit'}
                    </button>

                    {/* E2E Encryption placeholder */}
                    <div className="e2e-placeholder">
                        <div className="e2e-divider" />
                        <p className="e2e-label">End-to-End Encryption <span className="e2e-soon">Coming Soon</span></p>
                        <p className="e2e-desc">Your notes and habit names will be encrypted client-side before leaving your device.</p>
                        <button type="button" disabled className="modal-submit modal-submit--disabled">
                            Enable Encryption
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HabitModal;
