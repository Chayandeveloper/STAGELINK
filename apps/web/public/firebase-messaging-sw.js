// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Ensure service worker activates immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Config parameters passed via URL query or fallback to default project config
const urlParams = new URLSearchParams(location.search);

const firebaseConfig = {
  apiKey: urlParams.get('apiKey') || 'AIzaSyBSwAle-ivFoFVWHk2JDsRbL-l_UydAtOE',
  authDomain: urlParams.get('authDomain') || 'stagelink-39606.firebaseapp.com',
  projectId: urlParams.get('projectId') || 'stagelink-39606',
  storageBucket: urlParams.get('storageBucket') || 'stagelink-39606.firebasestorage.app',
  messagingSenderId: urlParams.get('messagingSenderId') || '436377211293',
  appId: urlParams.get('appId') || '1:436377211293:web:fd78167823784a6ebbdf74',
};

// Initialize if config exists
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message:', payload);
      const title = payload.notification?.title || payload.data?.senderName || 'StageLink Message';
      const body = payload.notification?.body || 'You have a new message';
      const icon = payload.notification?.icon || '/favicon.ico';
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
