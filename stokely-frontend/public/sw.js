function safeNotificationUrl(rawUrl) {
    try {
        const candidate = typeof rawUrl === 'string' && rawUrl ? rawUrl : '/dashboard';
        const parsed = new URL(candidate, self.location.origin);
        if (parsed.origin !== self.location.origin) return '/dashboard';
        return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/dashboard';
    } catch {
        return '/dashboard';
    }
}

self.addEventListener('push', event => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        const text = event.data ? event.data.text() : '';
        data = text ? { body: text } : {};
    }

    const title = data.title || 'Stokely';
    const body = data.body || 'You have a habit reminder';
    const url = safeNotificationUrl(data.url);

    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon: '/notif-kindling-hands.png?v=4',
            badge: '/icon-192.png?v=4',
            tag: data.tag || 'stokely-reminder-v4',
            renotify: true,
            data: { url },
        })
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil((async () => {
        const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of allClients) {
            const url = new URL(client.url);
            if (url.origin === self.location.origin) {
                await client.focus();
                client.postMessage({ type: 'OPEN_DASHBOARD' });
                return;
            }
        }
        const rawUrl = event.notification.data && event.notification.data.url;
        await clients.openWindow(safeNotificationUrl(rawUrl));
    })());
});
