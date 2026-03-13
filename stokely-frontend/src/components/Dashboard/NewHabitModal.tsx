import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import './NewHabitModal.css';
import { HabitType } from "../../types/habit";
import { HABIT_ICONS } from "../../utils/habitIcons";
import { syncPushSubscriptionOnDevice } from "../../utils/pushNotifications";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import { useE2EE } from "../../context/E2EEContext";
import { encrypt, isEncrypted } from "../../utils/e2ee";
import SettingsModal from "../SettingsModal";

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
    onDelete: (id: number) => void;
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

function formatLocalTime(value: string): string {
    if (!value) return '';
    const [h24, m] = value.split(':').map(Number);
    const ampm = h24 < 12 ? 'AM' : 'PM';
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getDefaultReminderLocalTime(offsetMinutes = 15): string {
    const now = new Date();
    const d = new Date(now.getTime() + offsetMinutes * 60_000);
    const rounded = Math.ceil(d.getMinutes() / 5) * 5;
    if (rounded >= 60) {
        d.setHours(d.getHours() + 1);
        d.setMinutes(0, 0, 0);
    } else {
        d.setMinutes(rounded, 0, 0);
    }
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const COMMON_REMINDER_TIMES: Array<{ label: string; value: string }> = [
    { label: 'Morning', value: '08:00' },
    { label: 'Lunch', value: '12:00' },
    { label: 'Evening', value: '18:00' },
    { label: 'Night', value: '21:00' },
];

// ── Icon Picker ────────────────────────────────────────────────────────────────

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
                        <Icon size={24} strokeWidth={2.25} />
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Modal ──────────────────────────────────────────────────────────────────────

const HabitModal = ({ showModal, onClose, onCreate, onUpdate, onDelete, habitToEdit }: HabitModalProps) => {
    const isEdit = habitToEdit !== null;
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const { key: e2eeKey, isUnlocked } = useE2EE();

    // Animation state
    const [mounted, setMounted] = useState(false);
    const [closing, setClosing] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [positiveType, setPositiveType] = useState(true);
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

    const [showE2EESettings, setShowE2EESettings] = useState(false);

    // Danger zone confirm state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteAck, setDeleteAck] = useState(false);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [archiveAck, setArchiveAck] = useState(false);

    useEffect(() => {
        if (showModal) {
            setMounted(true);
            setClosing(false);
        }
    }, [showModal]);

    const handleClose = useCallback(() => {
        setClosing(true);
        setTimeout(() => {
            setMounted(false);
            onClose();
        }, 180);
    }, [onClose]);

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
            setPositiveType(true);
            setPreset('Daily');
            setCustomDays(Object.fromEntries(ALL_DAYS.map(d => [d, false])));
            setIcon('');
            setShowIconPicker(false);
            setNotes('');
            setReminderTime('');
            setUseEndDate(false);
            setRecurrenceEnd('');
        }
        setShowDeleteConfirm(false);
        setDeleteAck(false);
        setShowArchiveConfirm(false);
        setArchiveAck(false);
    }, [habitToEdit, showModal]);

    useEffect(() => {
        if (!mounted) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (showDeleteConfirm) {
                setShowDeleteConfirm(false);
                setDeleteAck(false);
                return;
            }
            if (showArchiveConfirm) {
                setShowArchiveConfirm(false);
                setArchiveAck(false);
                return;
            }
            handleClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [mounted, showDeleteConfirm, showArchiveConfirm, handleClose]);

    if (!mounted) return null;

    const buildRecurrence = (): string => {
        if (preset !== 'Custom') return PRESET_RECURRENCES[preset];
        return ALL_DAYS.filter(d => customDays[d]).join('-') || 'Su';
    };

    const d = new Date();
    const todayISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const recurrence = buildRecurrence();
        const utcReminder = localTimeToUTC(reminderTime);
        const endDate = useEndDate && recurrenceEnd ? recurrenceEnd : null;

        if (reminderTime) {
            try {
                const synced = await syncPushSubscriptionOnDevice({ requestPermission: true });
                if (!synced) {
                    toast.error('Enable browser notifications to use reminders');
                }
            } catch {
                toast.error('Could not set up push notifications');
            }
        }

        let submitName = name;
        let submitNotes = notes;

        if (userInfo?.e2eeEnabled && (!isUnlocked || !e2eeKey)) {
            toast.error('Unlock vault before saving while E2EE is enabled');
            return;
        }

        if (userInfo?.e2eeEnabled && e2eeKey) {
            submitName = isEncrypted(name) ? name : await encrypt(e2eeKey, name);
            submitNotes = notes ? (isEncrypted(notes) ? notes : await encrypt(e2eeKey, notes)) : notes;
        }

        if (isEdit && habitToEdit) {
            onUpdate(habitToEdit.id, {
                name: submitName, recurrence, positiveType,
                icon, notes: submitNotes,
                reminderTime: utcReminder,
                recurrenceEnd: endDate,
            });
        } else {
            onCreate({
                name: submitName, recurrence, positiveType,
                icon, notes: submitNotes,
                reminderTime: utcReminder,
                recurrenceEnd: endDate,
            });
        }
        handleClose();
    };

    const handleDelete = () => {
        if (habitToEdit) onDelete(habitToEdit.id);
    };

    const handleArchiveEnd = () => {
        if (!habitToEdit) return;
        onUpdate(habitToEdit.id, { recurrenceEnd: `${todayISO}T00:00:00Z` });
        handleClose();
    };

    const SelectedIcon = icon ? HABIT_ICONS[icon] : null;

    return (
        <>
        <div className={`modal-overlay${closing ? ' modal-overlay--out' : ''}`} onClick={handleClose}>
            <div className={`modal-box${closing ? ' modal-box--out' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEdit ? 'Edit Habit' : 'New Habit'}</h2>
                    <button className="modal-close" onClick={handleClose} aria-label="Close">✕</button>
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
                            ? <><SelectedIcon size={20} strokeWidth={2.25} /> {icon}</>
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
                    {!reminderTime ? (
                        <button
                            type="button"
                            className="btn-set-reminder"
                            onClick={() => setReminderTime(getDefaultReminderLocalTime())}
                        >
                            + Set a reminder
                        </button>
                    ) : (
                        <>
                            <div className="reminder-row">
                                <input
                                    type="time"
                                    className="modal-input modal-input--time"
                                    value={reminderTime}
                                    onChange={e => setReminderTime(e.target.value)}
                                    step={300}
                                />
                                <div className="quick-time-row">
                                    {COMMON_REMINDER_TIMES.map(t => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            className="btn-quick-time"
                                            onClick={() => setReminderTime(t.value)}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                                <button type="button" className="btn-clear-time" onClick={() => setReminderTime('')}>
                                    Clear
                                </button>
                            </div>
                            <p className="modal-hint">
                                Reminder set for {formatLocalTime(reminderTime)} — you'll get a push notification if this habit isn't done by then.
                            </p>
                        </>
                    )}

                    <button
                        className="modal-submit"
                        type="submit"
                    >
                        {isEdit ? 'Save Changes' : 'Add Habit'}
                    </button>

                    {/* End Habit (edit mode only) */}
                    {isEdit && (
                        <div className="danger-zone">
                            <div className="danger-divider" />
                            <h3 className="danger-zone-title">Danger Zone</h3>
                            <p className="danger-zone-desc">
                                Irreversible actions for this habit.
                            </p>

                            {!showArchiveConfirm ? (
                                <div className="end-habit-row">
                                    <button
                                        type="button"
                                        className="btn-end-habit"
                                        onClick={() => setShowArchiveConfirm(true)}
                                    >
                                        End Habit
                                    </button>
                                    <span className="end-habit-hint">
                                        End this habit today. It will be moved to Archived and won't appear in future dates.
                                    </span>
                                </div>
                            ) : (
                                <div className="end-confirm">
                                    <p className="end-confirm-warning">
                                        ⚠️ End this habit now? This keeps history but archives it going forward.
                                    </p>
                                    <label className="end-confirm-ack">
                                        <input
                                            type="checkbox"
                                            checked={archiveAck}
                                            onChange={e => setArchiveAck(e.target.checked)}
                                        />
                                        I understand — end this habit and move it to Archived
                                    </label>
                                    <div className="end-confirm-actions">
                                        <button
                                            type="button"
                                            className="btn-end-cancel"
                                            onClick={() => { setShowArchiveConfirm(false); setArchiveAck(false); }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-end-confirm"
                                            disabled={!archiveAck}
                                            onClick={handleArchiveEnd}
                                        >
                                            End Habit
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!showDeleteConfirm ? (
                                <div className="end-habit-row delete-habit-row">
                                    <button
                                        type="button"
                                        className="btn-delete-habit"
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        Delete Habit
                                    </button>
                                    <span className="end-habit-hint">
                                        Permanently deletes this habit and all of its history.
                                    </span>
                                </div>
                            ) : (
                                <div className="end-confirm delete-confirm">
                                    <p className="end-confirm-warning">
                                        ⚠️ This will permanently remove this habit and all logs.
                                    </p>
                                    <label className="end-confirm-ack">
                                        <input
                                            type="checkbox"
                                            checked={deleteAck}
                                            onChange={e => setDeleteAck(e.target.checked)}
                                        />
                                        I understand — permanently delete this habit
                                    </label>
                                    <div className="end-confirm-actions">
                                        <button
                                            type="button"
                                            className="btn-end-cancel"
                                            onClick={() => { setShowDeleteConfirm(false); setDeleteAck(false); }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-delete-confirm"
                                            disabled={!deleteAck}
                                            onClick={handleDelete}
                                        >
                                            Delete Habit
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* E2EE section — always shown at the bottom */}
                    <div className="e2e-placeholder">
                        <div className="e2e-divider" />
                        {!userInfo?.e2eeEnabled ? (
                            <>
                                <p className="e2e-label" style={{ color: '#888', margin: 0 }}>
                                    🔐 End-to-End Encryption
                                </p>
                                <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.25rem 0 0.5rem' }}>
                                    Enable account-wide encryption in Settings.
                                </p>
                                <button
                                    type="button"
                                    className="e2e-setup-btn"
                                    onClick={() => setShowE2EESettings(true)}
                                >
                                    Set up in Settings →
                                </button>
                            </>
                        ) : isUnlocked ? (
                            <p className="e2e-label" style={{ color: '#2dca8e', margin: 0 }}>
                                🔐 E2EE is enabled. This habit will be encrypted on save.
                            </p>
                        ) : (
                            <p className="e2e-label" style={{ color: '#f0a66a', margin: 0 }}>
                                🔒 Vault locked — unlock vault in the header to enable encryption
                            </p>
                        )}
                    </div>

                </form>
            </div>
        </div>

        {showE2EESettings && <SettingsModal onClose={() => setShowE2EESettings(false)} initialSection="e2ee" />}
        </>
    );
};

export default HabitModal;
