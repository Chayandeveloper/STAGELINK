// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Config parameters passed via URL query or initialized with placeholder that gets configured
const urlParams = new URLSearchParams(location.search);

const firebaseConfig = {
  apiKey: urlParams.get('apiKey') || undefined,
  authDomain: urlParams.get('authDomain') || undefined,
  projectId: urlParams.get('projectId') || undefined,
  storageBucket: urlParams.get('storageBucket') || undefined,
  messagingSenderId: urlParams.get('messagingSenderId') || undefined,
  appId: urlParams.get('appId') || undefined,
};

// Initialize if config exists
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message:', payload);
      const title = payload.notification?.title || payload.data?.senderName || 'StageLink Message';
      const body = payload.notification?.body || 'You have a new message';
      const icon = '/favicon.ico';
      const data = payload.data || {};

      self.registration.showNotification(title, {
        body,
        icon,
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        data: {
          url: data.click_action || '/dashboard/messages',
          conversationId: data.conversationId,
        },
      });
    });
  } catch (err) {
    console.warn('[firebase-messaging-sw.js] Init error:', err);
  }
}

// Handle notification click to focus or open chat window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard/messages';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/dashboard/messages') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
