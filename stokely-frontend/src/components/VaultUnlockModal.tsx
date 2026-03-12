import { useState, type FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import { api } from '../api/api';
import { deriveKey, checkVerifier } from '../utils/e2ee';
import { useE2EE } from '../context/E2EEContext';
import { setUserInfo } from '../redux/userSlice';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';

interface Props {
    onClose: () => void;
}

export default function VaultUnlockModal({ onClose }: Props) {
    const { unlock } = useE2EE();
    const dispatch = useDispatch();
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [passphrase, setPassphrase] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!passphrase) return;
        setLoading(true);
        setError('');
        try {
            const status = await api.e2ee.status();
            if (!status.enabled) {
                // Redux state is stale — server says E2EE is not enabled. Refresh user info.
                const me = await api.auth.me();
                dispatch(setUserInfo(me));
                return;
            }
            if (!status.salt || !status.verifier) {
                setError('Vault data is incomplete. Please re-enable E2EE in Settings.');
                return;
            }
            const key = await deriveKey(passphrase, status.salt);
            const ok = await checkVerifier(key, status.verifier);
            if (!ok) {
                setError('Incorrect passphrase.');
                return;
            }
            await unlock(key);
            setPassphrase('');
            onClose?.();
        } catch {
            setError('Failed to unlock vault. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vault-unlock-overlay" onClick={onClose}>
            <div className="vault-unlock-box" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#888', fontSize: '1.1rem', cursor: 'pointer', padding: '0.25rem' }}
                    aria-label="Close"
                >✕</button>
                <h2 className="vault-unlock-title">🔒 Vault Locked</h2>
                <p className="vault-unlock-desc">
                    {userInfo?.username ? `@${userInfo.username}'s` : 'Your'} encrypted habits are locked.
                    Enter your vault passphrase to decrypt them on this device.
                </p>
                <form onSubmit={e => void handleSubmit(e)}>
                    <input
                        type="password"
                        className="vault-unlock-input"
                        placeholder="Vault passphrase"
                        value={passphrase}
                        onChange={e => setPassphrase(e.target.value)}
                        autoFocus
                        autoComplete="current-password"
                        disabled={loading}
                    />
                    {error && <p className="vault-unlock-error">{error}</p>}
                    <button
                        type="submit"
                        className="vault-unlock-btn"
                        disabled={loading || !passphrase}
                    >
                        {loading ? 'Deriving key…' : 'Unlock Vault'}
                    </button>
                    {loading && (
                        <p className="vault-unlock-hint">
                            Key derivation may take a moment on slower devices…
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
