self.addEventListener('push', (event) => {
  let data = { title: 'New Update', body: 'You have a new notification.' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Notification', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/logo192.png', 
    badge: '/favicon.ico', 
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/' 
    },
    actions: [
      { action: 'open', title: 'View Now' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const targetUrl = notification.data.url;

  notification.close(); 
  if (action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});