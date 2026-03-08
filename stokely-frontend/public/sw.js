self.addEventListener('push', event => {
    const data = event.data?.json() ?? {};
    const title = data.title ?? 'Stokely';
    const body = data.body ?? 'You have a habit reminder';
    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon: '/cube-logo-green.png',
            badge: '/cube-logo-white.png',
        })
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(clients.openWindow('/dashboard'));
});
