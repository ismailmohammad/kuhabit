import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/api';
import './LoginPage.css';

export default function VerifyEmailPage() {
    const [params] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = params.get('token') ?? '';
        if (!token) {
            setStatus('error');
            setMessage('No verification token found in this link.');
            return;
        }
        api.auth.verifyEmail(token)
            .then(res => { setStatus('success'); setMessage(res.message); })
            .catch(err => { setStatus('error'); setMessage(err instanceof Error ? err.message : 'Verification failed.'); });
    }, [params]);

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-title">Email Verification</h1>
                {status === 'loading' && <p style={{ color: '#888' }}>Verifying your email…</p>}
                {status === 'success' && (
                    <>
                        <p style={{ color: '#2dca8e', marginBottom: '1.25rem' }}>✓ {message}</p>
                        <p style={{ color: '#888', fontSize: '0.875rem' }}>
                            Password recovery is now enabled for your account.
                        </p>
                        <Link to="/dashboard" className="auth-submit" style={{ display: 'block', textAlign: 'center', marginTop: '1.5rem', textDecoration: 'none' }}>
                            Go to Dashboard
                        </Link>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{message}</p>
                        <p className="auth-switch">
                            Go back to <Link to="/dashboard">Dashboard</Link> and request a new verification email from Settings.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
