import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../api/api';
import './LoginPage.css';

export default function ResetPasswordPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = params.get('token') ?? '';

    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token || !window.location.search) return;
        // Remove token from URL/history after reading it.
        window.history.replaceState({}, document.title, window.location.pathname);
    }, [token]);

    if (!token) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <h1 className="auth-title">Reset Password</h1>
                    <p style={{ color: '#ff6b6b' }}>Invalid reset link. Please request a new one.</p>
                    <p className="auth-switch"><Link to="/forgot-password">Request reset</Link></p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
        setLoading(true);
        try {
            await api.auth.resetPassword(token, newPw);
            toast.success('Password reset! Please log in.');
            navigate('/login');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-title">Reset Password</h1>
                <form onSubmit={handleSubmit} className="auth-form">
                    <label>New Password</label>
                    <input
                        type="password"
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        placeholder="Min. 8 characters"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        autoFocus
                    />
                    <label>Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPw}
                        onChange={e => setConfirmPw(e.target.value)}
                        placeholder="Repeat your password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                    />
                    <button
                        className="auth-submit"
                        type="submit"
                        disabled={loading || newPw.length < 8 || newPw !== confirmPw}
                    >
                        {loading ? 'Resetting…' : 'Set New Password'}
                    </button>
                </form>
                <p className="auth-switch">
                    Link expired? <Link to="/forgot-password">Request a new one</Link>
                </p>
            </div>
        </div>
    );
}
