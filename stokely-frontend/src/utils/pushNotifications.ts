export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;
    try {
        return await navigator.serviceWorker.register('/sw.js');
    } catch (err) {
        console.error('Service worker registration failed:', err);
        return null;
    }
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
