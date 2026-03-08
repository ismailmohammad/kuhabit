import './SettingsModal.css';

type Props = { onClose: () => void };

export default function SettingsModal({ onClose }: Props) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="settings-modal-box" onClick={e => e.stopPropagation()}>
                <div className="settings-modal-header">
                    <h2>Settings</h2>
                    <button className="settings-close-btn" onClick={onClose}>✕</button>
                </div>
                <p style={{ color: '#888', textAlign: 'center', padding: '2rem 0' }}>
                    Settings coming soon.
                </p>
            </div>
        </div>
    );
}
