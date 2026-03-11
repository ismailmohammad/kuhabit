import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api/api';
import { clearUserInfo, setUserInfo } from '../redux/userSlice';
import type { RootState } from '../redux/store';
import type { PushSubscriptionDevice } from '../types/habit';
import { syncPushSubscriptionOnDevice } from '../utils/pushNotifications';
import './SettingsModal.css';

type Props = { onClose: () => void };

export default function SettingsModal({ onClose }: Props) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const userInfo = useSelector((state: RootState) => state.user.userInfo);

    // Change password
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    // Delete account
    const [deleteStep, setDeleteStep] = useState(false);
    const [deleteAck, setDeleteAck] = useState(false);
    const [deletePw, setDeletePw] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [exportLoading, setExportLoading] = useState(false);
    const [dailySparkLoading, setDailySparkLoading] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [pushSyncLoading, setPushSyncLoading] = useState(false);
    const [subscriptions, setSubscriptions] = useState<PushSubscriptionDevice[]>([]);

    const loadSubscriptions = async () => {
        setPushLoading(true);
        try {
            const list = await api.push.listSubscriptions();
            setSubscriptions(list);
        } catch {
            toast.error('Failed to load notification devices');
        } finally {
            setPushLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
        setPwLoading(true);
        try {
            await api.auth.changePassword(currentPw, newPw);
            toast.success('Password updated');
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to update password');
        } finally {
            setPwLoading(false);
        }
    };

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const data = await api.user.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stokely-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Export downloaded');
        } catch {
            toast.error('Export failed');
        } finally {
            setExportLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        try {
            await api.user.deleteAccount(deletePw);
            dispatch(clearUserInfo());
            onClose();
            navigate('/');
            toast.success('Account deleted');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Deletion failed');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDailySparkToggle = async (enabled: boolean) => {
        if (!userInfo) return;
        setDailySparkLoading(true);
        try {
            const res = await api.auth.setDailySparkEnabled(enabled);
            dispatch(setUserInfo({ ...userInfo, dailySparkEnabled: res.dailySparkEnabled }));
            toast.success(res.dailySparkEnabled ? 'Daily Spark enabled' : 'Daily Spark disabled');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to update Daily Spark setting');
        } finally {
            setDailySparkLoading(false);
        }
    };

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    useEffect(() => {
        void loadSubscriptions();
    }, []);

    const handleEnableOnThisDevice = async () => {
        setPushSyncLoading(true);
        try {
            const ok = await syncPushSubscriptionOnDevice({ requestPermission: true, forceRefresh: true });
            if (!ok) {
                toast.error('Notifications are blocked on this device');
                return;
            }
            toast.success('This device is now subscribed');
            await loadSubscriptions();
        } catch {
            toast.error('Could not enable notifications on this device');
        } finally {
            setPushSyncLoading(false);
        }
    };

    const handleToggleSubscription = async (id: number, enabled: boolean) => {
        try {
            await api.push.updateSubscription(id, enabled);
            setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, enabled } : s));
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to update notification setting');
        }
    };

    const handleDeleteSubscription = async (id: number) => {
        try {
            await api.push.deleteSubscription(id);
            setSubscriptions(prev => prev.filter(s => s.id !== id));
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to remove device');
        }
    };

    const handleTestSubscription = async (id: number) => {
        try {
            const res = await api.push.testSubscription(id);
            toast.success(`Test push accepted (${res.statusCode})`);
            await loadSubscriptions();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Test notification failed');
            await loadSubscriptions();
        }
    };

    const renderSubscriptionName = (s: PushSubscriptionDevice): string => {
        if (s.deviceLabel) return s.deviceLabel;
        if (/iphone/i.test(s.userAgent)) return 'iPhone';
        if (/ipad/i.test(s.userAgent)) return 'iPad';
        if (/android/i.test(s.userAgent)) return 'Android Device';
        if (/windows/i.test(s.userAgent)) return 'Windows PC';
        if (/macintosh|mac os x/i.test(s.userAgent)) return 'Mac';
        return 'Unknown Device';
    };

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal-box" onClick={e => e.stopPropagation()}>
                <div className="settings-modal-header">
                    <h2>Settings</h2>
                    <button className="settings-close-btn" onClick={onClose}>✕</button>
                </div>

                {/* Change Password */}
                <section className="settings-section">
                    <h3 className="settings-section-title">Change Password</h3>
                    <input
                        type="password"
                        className="settings-input"
                        placeholder="Current password"
                        value={currentPw}
                        onChange={e => setCurrentPw(e.target.value)}
                        autoComplete="current-password"
                    />
                    <input
                        type="password"
                        className="settings-input"
                        placeholder="New password (min 8 characters)"
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        autoComplete="new-password"
                    />
                    <input
                        type="password"
                        className="settings-input"
                        placeholder="Confirm new password"
                        value={confirmPw}
                        onChange={e => setConfirmPw(e.target.value)}
                        autoComplete="new-password"
                    />
                    <button
                        className="settings-btn settings-btn--primary"
                        onClick={handleChangePassword}
                        disabled={pwLoading || !currentPw || newPw.length < 8 || newPw !== confirmPw}
                    >
                        {pwLoading ? 'Updating…' : 'Update Password'}
                    </button>
                </section>

                {/* Update Email — disabled */}
                <section className="settings-section settings-section--disabled">
                    <h3 className="settings-section-title">
                        Update Email
                        <span className="settings-badge">Coming Soon</span>
                    </h3>
                    <input type="email" className="settings-input" disabled placeholder="New email address" />
                    <button className="settings-btn settings-btn--primary" disabled>Update Email</button>
                </section>

                {/* Daily SPark */}
                <section className="settings-section">
                    <h3 className="settings-section-title">Daily Spark</h3>
                    <p className="settings-desc">Show a motivational Kindling message when you log in.</p>
                    <label className="settings-toggle-row">
                        <span>{userInfo?.dailySparkEnabled === false ? 'Disabled' : 'Enabled'}</span>
                        <input
                            type="checkbox"
                            checked={userInfo?.dailySparkEnabled !== false}
                            onChange={e => void handleDailySparkToggle(e.target.checked)}
                            disabled={dailySparkLoading}
                        />
                    </label>
                </section>

                {/* Export Data */}
                <section className="settings-section">
                    <h3 className="settings-section-title">Export Your Data</h3>
                    <p className="settings-desc">Download all your habits and logs as a JSON file.</p>
                    <button
                        className="settings-btn settings-btn--secondary"
                        onClick={handleExport}
                        disabled={exportLoading}
                    >
                        {exportLoading ? 'Exporting…' : 'Download JSON'}
                    </button>
                </section>

                {/* Notifications by Device */}
                <section className="settings-section">
                    <h3 className="settings-section-title">Notifications by Device</h3>
                    <p className="settings-desc">Manage which logged-in devices can receive reminders.</p>
                    <button
                        className="settings-btn settings-btn--primary"
                        onClick={() => void handleEnableOnThisDevice()}
                        disabled={pushSyncLoading}
                    >
                        {pushSyncLoading ? 'Enabling…' : 'Enable on This Device'}
                    </button>
                    {pushLoading ? (
                        <p className="settings-desc">Loading devices…</p>
                    ) : subscriptions.length === 0 ? (
                        <p className="settings-desc">No devices subscribed yet.</p>
                    ) : (
                        <div className="settings-device-list">
                            {subscriptions.map(sub => (
                                <div key={sub.id} className="settings-device-item">
                                    <div className="settings-device-meta">
                                        <strong>{renderSubscriptionName(sub)}</strong>
                                        <span>
                                            {sub.lastSuccessAt
                                                ? `Last delivered: ${new Date(sub.lastSuccessAt).toLocaleString()}`
                                                : 'No successful deliveries yet'}
                                        </span>
                                        {sub.failureCount > 0 && (
                                            <span className="settings-device-warning">
                                                Failures: {sub.failureCount}
                                                {sub.lastFailureCode ? ` (last ${sub.lastFailureCode})` : ''}
                                            </span>
                                        )}
                                    </div>
                                    <div className="settings-device-actions">
                                        <label className="settings-toggle-inline">
                                            <input
                                                type="checkbox"
                                                checked={sub.enabled}
                                                onChange={e => void handleToggleSubscription(sub.id, e.target.checked)}
                                            />
                                            <span>{sub.enabled ? 'Enabled' : 'Disabled'}</span>
                                        </label>
                                        <button
                                            type="button"
                                            className="settings-btn settings-btn--secondary"
                                            onClick={() => void handleTestSubscription(sub.id)}
                                        >
                                            Send Test
                                        </button>
                                        <button
                                            type="button"
                                            className="settings-btn settings-btn--secondary"
                                            onClick={() => void handleDeleteSubscription(sub.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>



                {/* Delete Account */}
                <section className="settings-section settings-section--danger">
                    <h3 className="settings-section-title settings-section-title--danger">Delete Account</h3>
                    {!deleteStep ? (
                        <>
                            <p className="settings-desc">Permanently delete your account and all associated data. This cannot be undone.</p>
                            <button
                                className="settings-btn settings-btn--danger"
                                onClick={() => setDeleteStep(true)}
                            >
                                Delete Account
                            </button>
                        </>
                    ) : (
                        <div className="delete-confirm-box">
                            <p className="delete-warning">
                                ⚠️ <strong>This is irreversible.</strong> All your habits, logs, and account data will be permanently deleted.
                            </p>
                            <label className="delete-ack-label">
                                <input
                                    type="checkbox"
                                    checked={deleteAck}
                                    onChange={e => setDeleteAck(e.target.checked)}
                                />
                                I understand this cannot be undone
                            </label>
                            <input
                                type="password"
                                className="settings-input"
                                placeholder="Enter your password to confirm"
                                value={deletePw}
                                onChange={e => setDeletePw(e.target.value)}
                                autoComplete="current-password"
                            />
                            <div className="delete-actions">
                                <button
                                    className="settings-btn settings-btn--secondary"
                                    onClick={() => { setDeleteStep(false); setDeleteAck(false); setDeletePw(''); }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="settings-btn settings-btn--danger"
                                    disabled={!deleteAck || !deletePw || deleteLoading}
                                    onClick={handleDeleteAccount}
                                >
                                    {deleteLoading ? 'Deleting…' : 'Permanently Delete'}
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
