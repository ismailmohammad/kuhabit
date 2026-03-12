import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { loadKeyFromDevice, deleteKeyFromDevice, saveKeyToDevice } from '../utils/e2ee';

interface E2EEContextValue {
    key: CryptoKey | null;
    isUnlocked: boolean;
    unlock(key: CryptoKey): Promise<void>;
    lock(): Promise<void>;
}

const E2EEContext = createContext<E2EEContextValue>({
    key: null,
    isUnlocked: false,
    unlock: async () => {},
    lock: async () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export function useE2EE() {
    return useContext(E2EEContext);
}

export function E2EEProvider({ children }: { children: ReactNode }) {
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [key, setKey] = useState<CryptoKey | null>(null);

    // Auto-load key from IndexedDB when user is logged in with E2EE enabled
    useEffect(() => {
        if (!userInfo?.e2eeEnabled || !userInfo.id) {
            setKey(null);
            return;
        }
        void (async () => {
            const stored = await loadKeyFromDevice(userInfo.id);
            if (stored) setKey(stored);
        })();
    }, [userInfo?.id, userInfo?.e2eeEnabled]);

    // Clear key on logout
    useEffect(() => {
        if (!userInfo) setKey(null);
    }, [userInfo]);

    const unlock = useCallback(async (k: CryptoKey) => {
        setKey(k);
        if (userInfo?.id) await saveKeyToDevice(userInfo.id, k);
    }, [userInfo?.id]);

    const lock = useCallback(async () => {
        setKey(null);
        if (userInfo?.id) await deleteKeyFromDevice(userInfo.id);
    }, [userInfo?.id]);

    return (
        <E2EEContext.Provider value={{ key, isUnlocked: key !== null, unlock, lock }}>
            {children}
        </E2EEContext.Provider>
    );
}
