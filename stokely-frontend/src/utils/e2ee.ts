// WebCrypto + IndexedDB utilities for client-side E2EE.
// The server never receives the passphrase, derived key, or any plaintext.

const E2EE_PREFIX = 'e2ee:v1:';
const SENTINEL = 'stokely-e2ee-v1';
const IDB_DB_NAME = 'stokely-vault';
const IDB_STORE = 'keys';
const PBKDF2_ITERATIONS = 600_000;

// ── Crypto primitives ─────────────────────────────────────────────────────────

export function generateSalt(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return bufToBase64url(bytes);
}

export async function deriveKey(passphrase: string, saltB64: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
        'raw',
        enc.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey'],
    );
    const saltBytes = base64urlToBuf(saltB64);
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false, // non-extractable
        ['encrypt', 'decrypt'],
    );
}

export async function makeVerifier(key: CryptoKey): Promise<string> {
    return encrypt(key, SENTINEL);
}

export async function checkVerifier(key: CryptoKey, verifierB64: string): Promise<boolean> {
    try {
        const plain = await decrypt(key, verifierB64);
        return plain === SENTINEL;
    } catch {
        return false;
    }
}

export async function encrypt(key: CryptoKey, plaintext: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const cipherBuf = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(plaintext),
    );
    // Format: IV (12 bytes) || ciphertext+tag
    const combined = new Uint8Array(12 + cipherBuf.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuf), 12);
    return E2EE_PREFIX + bufToBase64url(combined);
}

export async function decrypt(key: CryptoKey, ciphertext: string): Promise<string> {
    if (!isEncrypted(ciphertext)) {
        throw new Error('Not an e2ee ciphertext');
    }
    const combined = base64urlToBuf(ciphertext.slice(E2EE_PREFIX.length));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(plainBuf);
}

export async function decryptRecursively(key: CryptoKey, value: string, maxDepth = 5): Promise<string> {
    let current = value;
    for (let i = 0; i < maxDepth; i++) {
        if (!isEncrypted(current)) return current;
        current = await decrypt(key, current);
    }
    return current;
}

export function isEncrypted(value: string): boolean {
    return value.startsWith(E2EE_PREFIX);
}

// ── Base64url helpers ─────────────────────────────────────────────────────────

function bufToBase64url(buf: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlToBuf(b64: string): Uint8Array {
    const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded);
    const buf = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
    return buf;
}

// ── IndexedDB key persistence ─────────────────────────────────────────────────

function openVaultDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(IDB_DB_NAME, 1);
        req.onupgradeneeded = () => {
            req.result.createObjectStore(IDB_STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function saveKeyToDevice(userId: string, key: CryptoKey): Promise<void> {
    try {
        const db = await openVaultDB();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            const req = tx.objectStore(IDB_STORE).put(key, userId);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch {
        // IndexedDB unavailable (private browsing in some browsers) — silently fall back
    }
}

export async function loadKeyFromDevice(userId: string): Promise<CryptoKey | null> {
    try {
        const db = await openVaultDB();
        return await new Promise<CryptoKey | null>((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readonly');
            const req = tx.objectStore(IDB_STORE).get(userId);
            req.onsuccess = () => resolve((req.result as CryptoKey) ?? null);
            req.onerror = () => reject(req.error);
        });
    } catch {
        return null;
    }
}

export async function deleteKeyFromDevice(userId: string): Promise<void> {
    try {
        const db = await openVaultDB();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            const req = tx.objectStore(IDB_STORE).delete(userId);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch {
        // Ignore — key will just be missing on next load
    }
}
