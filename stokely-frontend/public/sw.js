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
    const url = data.url || '/dashboard';

    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: data.tag || 'stokely-reminder',
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
        await clients.openWindow((event.notification.data && event.notification.data.url) || '/dashboard');
    })());
});
