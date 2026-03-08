import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api/api';
import { clearUserInfo } from '../redux/userSlice';
import './SettingsModal.css';

type Props = { onClose: () => void };

export default function SettingsModal({ onClose }: Props) {
    const dispatch = useDispatch();
    const navigate = useNavigate();

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

    return (
        <div className="modal-overlay" onClick={onClose}>
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
