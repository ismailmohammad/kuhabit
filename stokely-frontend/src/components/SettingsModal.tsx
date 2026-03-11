import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api/api';
import { clearUserInfo, setUserInfo } from '../redux/userSlice';
import type { RootState } from '../redux/store';
import type { PushSubscriptionDevice, UserSession } from '../types/habit';
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

    // Email update
    const [newEmail, setNewEmail] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    // Delete account
    const [deleteStep, setDeleteStep] = useState(false);
    const [deleteAck, setDeleteAck] = useState(false);
    const [deletePw, setDeletePw] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [logoutOthersLoading, setLogoutOthersLoading] = useState(false);

    const loadSessions = async () => {
        setSessionsLoading(true);
        try {
            setSessions(await api.sessions.list());
        } catch {
            toast.error('Failed to load sessions');
        } finally {
            setSessionsLoading(false);
        }
    };

    const handleDeleteSession = async (id: string) => {
        try {
            await api.sessions.logout(id);
            setSessions(prev => prev.filter(s => s.id !== id));
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to terminate session');
        }
    };

    const handleLogoutOthers = async () => {
        setLogoutOthersLoading(true);
        try {
            await api.sessions.logoutOthers();
            setSessions(prev => prev.filter(s => s.isCurrent));
            toast.success('All other sessions terminated');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to terminate sessions');
        } finally {
            setLogoutOthersLoading(false);
        }
    };

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

    const handleSendVerifyEmail = async () => {
        if (!newEmail.trim()) return;
        setEmailLoading(true);
        try {
            await api.auth.sendVerifyEmail(newEmail.trim());
            setEmailSent(true);
            setNewEmail('');
            toast.success('Verification email sent — check your inbox');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to send verification email');
        } finally {
            setEmailLoading(false);
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
        void loadSessions();
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

    const renderSessionDevice = (ua: string): string => {
        if (/iphone/i.test(ua)) return 'iPhone';
        if (/ipad/i.test(ua)) return 'iPad';
        if (/android/i.test(ua)) return 'Android Device';
        if (/windows/i.test(ua)) return 'Windows PC';
        if (/macintosh|mac os x/i.test(ua)) return 'Mac';
        if (ua === '') return 'Unknown Device';
        return 'Browser';
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

                {/* Email */}
                <section className="settings-section">
                    <h3 className="settings-section-title">
                        {userInfo?.email ? 'Update Email' : 'Add Email'}
                    </h3>
                    {userInfo?.email ? (
                        <p className="settings-desc">
                            Current: <strong style={{ color: '#ddd' }}>{userInfo.email}</strong>
                            {userInfo.emailVerified
                                ? <span className="settings-session-current" style={{ marginLeft: '0.5rem' }}>Verified</span>
                                : <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: '#f0a66a' }}>Unverified</span>}
                        </p>
                    ) : (
                        <p className="settings-desc">Add a verified email to enable password recovery.</p>
                    )}
                    {emailSent ? (
                        <p className="settings-desc" style={{ color: '#2dca8e' }}>
                            ✓ Check your inbox for a verification link.
                        </p>
                    ) : (
                        <>
                            <input
                                type="email"
                                className="settings-input"
                                placeholder={userInfo?.email ? 'New email address' : 'you@example.com'}
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                autoComplete="email"
                            />
                            <button
                                className="settings-btn settings-btn--primary"
                                onClick={() => void handleSendVerifyEmail()}
                                disabled={emailLoading || !newEmail.trim()}
                            >
                                {emailLoading ? 'Sending…' : 'Send Verification Email'}
                            </button>
                        </>
                    )}
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



                {/* Active Sessions */}
                <section className="settings-section">
                    <h3 className="settings-section-title">Active Sessions</h3>
                    <p className="settings-desc">Devices currently logged into your account.</p>
                    {sessions.filter(s => !s.isCurrent).length > 1 && (
                        <button
                            className="settings-btn settings-btn--secondary"
                            onClick={() => void handleLogoutOthers()}
                            disabled={logoutOthersLoading}
                        >
                            {logoutOthersLoading ? 'Signing out…' : 'Sign Out All Other Devices'}
                        </button>
                    )}
                    {sessionsLoading ? (
                        <p className="settings-desc">Loading sessions…</p>
                    ) : sessions.length === 0 ? (
                        <p className="settings-desc">No active sessions found.</p>
                    ) : (
                        <div className="settings-device-list">
                            {sessions.map(s => (
                                <div key={s.id} className="settings-device-item">
                                    <div className="settings-device-meta">
                                        <strong>
                                            {renderSessionDevice(s.userAgent)}
                                            {s.isCurrent && <span className="settings-session-current">Current</span>}
                                        </strong>
                                        <span>Signed in: {new Date(s.createdAt).toLocaleString()}</span>
                                        <span>Last active: {new Date(s.lastSeenAt).toLocaleString()}</span>
                                    </div>
                                    {!s.isCurrent && (
                                        <div className="settings-device-actions">
                                            <button
                                                type="button"
                                                className="settings-btn settings-btn--secondary"
                                                onClick={() => void handleDeleteSession(s.id)}
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
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
