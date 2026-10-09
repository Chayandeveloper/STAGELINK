import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from 'firebase/messaging';
import api from './api';

const VALID_API_KEY = 'AIzaSyBSwAle-ivFoFVWHk2JDsRbL-l_UydAtOE';

let configuredApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || VALID_API_KEY;
if (configuredApiKey.includes('BSwAIe-') || configuredApiKey === 'AIzaSyBSwAIe-ivFoFVWHk2JDsRbL-l_UydAtOE') {
  configuredApiKey = VALID_API_KEY;
}

const firebaseConfig = {
  apiKey: configuredApiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'stagelink-39606.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'stagelink-39606',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'stagelink-39606.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '436377211293',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:436377211293:web:fd78167823784a6ebbdf74',
};

const DEFAULT_VAPID_KEY = 'BHpp2oTt24GapvYQsSzcFBiVRwM9l7Gemb3A1S3YHESvgK9zg1zJKoohUnnokrJZjoYD0EpRioDxGx73RXEeGpM';

let app: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

export const isFirebaseConfigured = () => {
  return Boolean(
    (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey) &&
    (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig.projectId) &&
    (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId) &&
    (process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseConfig.appId)
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

export const getNotificationPermissionState = (): NotificationPermission | 'unsupported' => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

/**
 * Request notification permission and register FCM device token with StageLink backend
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('Push notifications not supported in this browser.');
    return null;
  }

  try {
    const supported = await isSupported().catch(() => false);
    if (!supported) {
      console.warn('Firebase Messaging is not supported in this environment.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission was not granted:', permission);
      return null;
    }

    const firebaseAppInstance = getFirebaseApp();
    if (!firebaseAppInstance) return null;

    // Always register/update service worker with latest configuration to bypass stale caches
    const swUrl = `/firebase-messaging-sw.js?v=4&apiKey=${encodeURIComponent(firebaseConfig.apiKey || '')}&projectId=${encodeURIComponent(firebaseConfig.projectId || '')}&messagingSenderId=${encodeURIComponent(firebaseConfig.messagingSenderId || '')}&appId=${encodeURIComponent(firebaseConfig.appId || '')}`;
    
    const swRegistration = await navigator.serviceWorker.register(swUrl, { scope: '/' });
    try {
      await swRegistration.update();
    } catch {}

    // CRITICAL: Wait for the Service Worker to be fully active and ready
    const activeRegistration = await navigator.serviceWorker.ready;

    messagingInstance = getMessaging(firebaseAppInstance);

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || DEFAULT_VAPID_KEY;
    const currentToken = await getToken(messagingInstance, {
      vapidKey,
      serviceWorkerRegistration: activeRegistration,
    });

    if (currentToken) {
      // Always ensure backend has the token registered
      try {
        await api.post('/auth/fcm-token', { token: currentToken });
        localStorage.setItem('fcm_token', currentToken);
        console.log('🔥 FCM Device Token registered and synced with server successfully');
      } catch (err) {
        console.warn('Failed to sync FCM token with server:', err);
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
