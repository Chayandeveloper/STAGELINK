import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import path from 'path';
import fs from 'fs';

let firebaseApp: App | null = null;

try {
  // Option 1: Full JSON string or base64 in environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    let serviceAccount: any;
    try {
      // Try direct JSON parsing
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch {
      // Try base64 decoding
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(decoded);
    }

    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });
    console.log('🔥 Firebase Admin initialized via environment variable');
  } else {
    // Option 2: Local service account file
    const serviceAccountFile = path.resolve(__dirname, 'firebase-service-account.json');
    if (fs.existsSync(serviceAccountFile)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountFile, 'utf-8'));
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('🔥 Firebase Admin initialized via service account file');
    } else {
      console.log('ℹ️ Firebase Admin: No service account configured yet. Push notifications are currently in standby.');
    }
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin initialization failed:', error);
}

export const getFirebaseApp = (): App | null => firebaseApp;
