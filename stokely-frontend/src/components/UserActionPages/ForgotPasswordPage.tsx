import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../api/api';
import './LoginPage.css';

export default function ForgotPasswordPage() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.auth.forgotPassword(username);
            setSent(true);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Request failed';
            // Surface the specific message (no account / no email) directly.
            toast.error(msg, { duration: 6000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-title">Recover Account</h1>
                {sent ? (
                    <>
                        <p style={{ color: '#2dca8e', marginBottom: '0.75rem' }}>
                            ✓ Reset link sent!
                        </p>
                        <p style={{ color: '#888', fontSize: '0.875rem', lineHeight: 1.6 }}>
                            Check your inbox for a password reset email. The link expires in <strong style={{ color: '#f0a66a' }}>10 minutes</strong>.
                        </p>
                        <p className="auth-switch" style={{ marginTop: '1.5rem' }}>
                            <Link to="/login">Back to login</Link>
                        </p>
                    </>
                ) : (
                    <>
                        <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                            Enter your username and we'll send a reset link to your registered email.
                        </p>
                        <form onSubmit={handleSubmit} className="auth-form">
                            <label>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Your username"
                                required
                                autoComplete="username"
                                autoFocus
                            />
                            <button className="auth-submit" type="submit" disabled={loading || !username.trim()}>
                                {loading ? 'Sending…' : 'Send Reset Link'}
                            </button>
                        </form>
                        <p className="auth-switch">
                            Remembered it? <Link to="/login">Log in</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
