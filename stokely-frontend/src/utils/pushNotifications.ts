import { api } from "../api/api";

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;
    try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await reg.update();
        return reg;
    } catch (err) {
        console.error('Service worker registration failed:', err);
        return null;
    }
}

function detectDeviceLabel(): string {
    const ua = navigator.userAgent || '';
    if (/iphone/i.test(ua)) return 'iPhone';
    if (/ipad/i.test(ua)) return 'iPad';
    if (/android/i.test(ua)) return 'Android Device';
    if (/macintosh|mac os x/i.test(ua)) return 'Mac';
    if (/windows/i.test(ua)) return 'Windows PC';
    return 'This Device';
}

function isIOS(): boolean {
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
    const nav = navigator as Navigator & { standalone?: boolean };
    return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

export async function syncPushSubscriptionOnDevice(opts?: { requestPermission?: boolean; forceRefresh?: boolean }): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'denied') return false;
    if (isIOS() && !isStandalone()) {
        // iOS web push is intended for Home Screen web apps.
        return false;
    }
    if (Notification.permission === 'default' && !opts?.requestPermission) return false;

    if (Notification.permission === 'default' && opts?.requestPermission) {
        const result = await Notification.requestPermission();
        if (result !== 'granted') return false;
    }

    const reg = await registerServiceWorker();
    if (!reg) return false;

    const { publicKey } = await api.push.getVapidKey();
    if (!publicKey) return false;

    if (opts?.forceRefresh) {
        try {
            const existing = await reg.pushManager.getSubscription();
            if (existing) {
                await existing.unsubscribe();
                await api.push.unsubscribe(existing.endpoint);
            }
        } catch {
            // Continue and attempt a fresh subscription.
        }
    }

    const sub = await subscribeToPush(reg, publicKey);
    if (!sub) return false;

    const json = sub.toJSON();
    await api.push.subscribe({
        endpoint: sub.endpoint,
        p256dh: (json.keys as Record<string, string>)?.p256dh ?? '',
        auth: (json.keys as Record<string, string>)?.auth ?? '',
        deviceLabel: detectDeviceLabel(),
    });
    return true;
}

export async function subscribeToPush(
    reg: ServiceWorkerRegistration,
    vapidPublicKey: string
): Promise<PushSubscription | null> {
    try {
        const existing = await reg.pushManager.getSubscription();
        if (existing) return existing;
        return await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
    } catch (err) {
        console.error('Push subscription failed:', err);
        return null;
    }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
