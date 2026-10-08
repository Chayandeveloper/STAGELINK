import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from 'firebase/messaging';
import api from './api';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

export const isFirebaseConfigured = () => {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  );
};

export const getFirebaseApp = () => {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured()) return null;

  if (!app) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
};

/**
 * Request notification permission and register FCM device token with StageLink backend
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;
  if (!isFirebaseConfigured()) {
    console.log('ℹ️ Firebase credentials not configured in .env.local yet. Push notifications are in standby.');
    return null;
  }

  try {
    const supported = await isSupported();
    if (!supported) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission was not granted:', permission);
      return null;
    }

    const firebaseAppInstance = getFirebaseApp();
    if (!firebaseAppInstance) return null;

    // Register service worker with config query parameters
    const swUrl = `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(firebaseConfig.apiKey || '')}&projectId=${encodeURIComponent(firebaseConfig.projectId || '')}&messagingSenderId=${encodeURIComponent(firebaseConfig.messagingSenderId || '')}&appId=${encodeURIComponent(firebaseConfig.appId || '')}`;
    const swRegistration = await navigator.serviceWorker.register(swUrl, { scope: '/' });

    messagingInstance = getMessaging(firebaseAppInstance);

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const currentToken = await getToken(messagingInstance, {
      vapidKey: vapidKey || undefined,
      serviceWorkerRegistration: swRegistration,
    });

    if (currentToken) {
      const storedToken = localStorage.getItem('fcm_token');
      // Sync with server if token is new or not recorded
      if (storedToken !== currentToken) {
        await api.post('/auth/fcm-token', { token: currentToken });
        localStorage.setItem('fcm_token', currentToken);
        console.log('🔥 FCM Device Token registered successfully');
      }
      return currentToken;
    } else {
      console.warn('No registration token available. Request permission to generate one.');
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
  }

  return null;
};

/**
 * Remove device FCM token on user logout
 */
export const removeNotificationToken = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('fcm_token');
  if (token) {
    try {
      await api.delete('/auth/fcm-token', { data: { token } });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('fcm_token');
    }
  }
};

/**
 * Setup listener for notifications received while tab is currently focused (foreground)
 */
export const setupForegroundListener = (onMessageReceived: (payload: any) => void) => {
  if (typeof window === 'undefined') return () => {};
  if (!isFirebaseConfigured()) return () => {};

  let unsubscribe: (() => void) | null = null;

  isSupported().then((supported) => {
    if (supported) {
      const firebaseAppInstance = getFirebaseApp();
      if (firebaseAppInstance) {
        const messaging = getMessaging(firebaseAppInstance);
        unsubscribe = onMessage(messaging, (payload) => {
          console.log('📩 Foreground message received:', payload);
          onMessageReceived(payload);
        });
      }
    }
  }).catch(() => {});

  return () => {
    if (unsubscribe) unsubscribe();
  };
};
