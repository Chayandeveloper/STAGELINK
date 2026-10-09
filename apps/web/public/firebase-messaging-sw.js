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

let activeApiKey = urlParams.get('apiKey');
if (!activeApiKey || activeApiKey.includes('BSwAIe-') || activeApiKey === 'AIzaSyBSwAIe-ivFoFVWHk2JDsRbL-l_UydAtOE') {
  activeApiKey = 'AIzaSyBSwAle-ivFoFVWHk2JDsRbL-l_UydAtOE';
}

const firebaseConfig = {
  apiKey: activeApiKey,
  authDomain: urlParams.get('authDomain') || 'stagelink-39606.firebaseapp.com',
  projectId: urlParams.get('projectId') || 'stagelink-39606',
  storageBucket: urlParams.get('storageBucket') || 'stagelink-39606.firebasestorage.app',
  messagingSenderId: urlParams.get('messagingSenderId') || '436377211293',
  appId: urlParams.get('appId') || '1:436377211293:web:fd78167823784a6ebbdf74',
};

let currentActiveConversationId = null;

// Track active conversation communicated from client tabs
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_ACTIVE_CONVERSATION') {
    currentActiveConversationId = event.data.conversationId;
  }
});

async function isConversationOpenAndFocused(conversationId) {
  try {
    const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windowClients) {
      if (client.focused && client.visibilityState === 'visible') {
        if (currentActiveConversationId && conversationId && currentActiveConversationId === conversationId) {
          return true;
        }
      }
    }
  } catch {}
  return false;
}

// Initialize Firebase in Service Worker
try {
  if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(async (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    const data = payload.data || {};
    const conversationId = data.conversationId;

    // Do NOT show notification if user is currently looking at this conversation
    if (conversationId && (await isConversationOpenAndFocused(conversationId))) {
      console.log('[firebase-messaging-sw.js] Suppressed notification for active conversation:', conversationId);
      return;
    }

    const title = payload.notification?.title || data.senderName || 'StageLink Message';
    const body = payload.notification?.body || data.messageText || 'You have a new message';
    const icon = payload.notification?.icon || '/favicon.ico';

    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      tag: conversationId ? `chat_${conversationId}` : 'stagelink_push',
      renotify: true,
      data: {
        url: data.click_action || '/dashboard/messages',
        conversationId: data.conversationId,
      },
    });
  });
} catch (err) {
  console.warn('[firebase-messaging-sw.js] Init error:', err);
}

// Fallback native push listener for guaranteed OS display
self.addEventListener('push', (event) => {
  if (!event.data) return;

  event.waitUntil(
    (async () => {
      try {
        const payload = event.data.json();
        const data = payload.data || {};
        const conversationId = data.conversationId;

        // Do NOT show notification if user is currently looking at this conversation
        if (conversationId && (await isConversationOpenAndFocused(conversationId))) {
          console.log('[firebase-messaging-sw.js] Suppressed push for active conversation:', conversationId);
          return;
        }

        const title = payload.notification?.title || data.senderName || 'StageLink Message';
        const body = payload.notification?.body || data.messageText || 'You have a new message';

        await self.registration.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          tag: conversationId ? `chat_${conversationId}` : 'stagelink_push',
          renotify: true,
          data: {
            url: data.click_action || '/dashboard/messages',
            conversationId: data.conversationId,
          },
        });
      } catch (e) {
        // Handled by onBackgroundMessage
      }
    })()
  );
});

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
