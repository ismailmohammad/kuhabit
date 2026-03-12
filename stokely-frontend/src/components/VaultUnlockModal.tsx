import { useState, type FormEvent } from 'react';
import { api } from '../api/api';
import { deriveKey, checkVerifier } from '../utils/e2ee';
import { useE2EE } from '../context/E2EEContext';

export default function VaultUnlockModal() {
    const { unlock } = useE2EE();
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
            if (!status.salt || !status.verifier) {
                setError('E2EE data missing from server.');
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
        } catch {
            setError('Failed to unlock vault. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vault-unlock-overlay">
            <div className="vault-unlock-box">
                <h2 className="vault-unlock-title">🔒 Vault Locked</h2>
                <p className="vault-unlock-desc">
                    Your habits are encrypted. Enter your vault passphrase to decrypt them on this device.
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
