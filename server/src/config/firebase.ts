import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import path from 'path';
import fs from 'fs';

let firebaseApp: App | null = null;

// Embedded fallback credentials for StageLink Firebase project
const DEFAULT_SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "stagelink-39606",
  private_key_id: "9fb82e2d965ed81025ce4e794778ead5d0715127",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/WYHyClvQ6iYP\nLAsCc+MKnFJs/DFQ/V9vKHUji6srs84mVLLlo7WpF5MSrxiLLe8TkfT2nbuYDOhM\nQ7/G5hXuhhuhgvdat2mW/ZKc7rA/onWytOMRUelhX53SQCtPFSrllHKBndZba5yM\n361FXwIkkfrYWNxMsZqijYlX2ZYPBoAGlGgz6dx8XcC8tDigW9Kc0bd7AiN3QMyY\nf1SaPCIJ2u7WGSslo78IQyFLkVcpKmAd1ys9xiFGPrAoUjzvQk7ymh0nQQEaim/k\nJWXlIHC7fynAf6hrjSMbQbvu2FoIxFjG+9TLZTIJLNwDzY/nf76eszLALGu5Z8bT\ni3M/WcFnAgMBAAECggEATE9N21D2POKkOvi9i0TcDqc41+3bXQkuvg3MaViR8uPK\nGs88aQhYsg6MwK7Dgv3Wkl9q6c8NuR2spn1+RbwMkws4ibjJHIx4t5Z4mc02zKnl\ndlddFtMr14FiVy7wFqHCcbw5zic8DUllLWkmmLvDBwKQnycQ9CUAHkODul0z0tl7\nzuHl1rMeX2F5ApF47YbCf5xUnubKjL/fFFwLWB8tJ84rW4SL7Id15DWWOvLpNmtZ\nNBgb0UbAkszgbjaJv4k2EkdBOsNgkk56ajEUanj2VssYci6CrO39SioLmujFZgij\nPqT3/McrLxT2sX3SgRIU4JWATjnvzpovsUB6RvwQAQKBgQDtU12DZo5hZUJueY18\nspfzISEAPUXTG72e3NHFa3JGHzX4SqRdk4oN/aN0wJh4yjJeno/nnElX8gCAfmIy\n1FHaFggjqyDYC9fjkekGujoluSY/yVmqJB6gJekEPXhpg3WvzsyaRBJ+1SzCnN4U\n5CH5b9KpFGfo4Pwqgv/IgENSZwKBgQDOaAMNTuBAD6oCiAE+fDm5psymDH4VFUda\nW0PvDcZH++3id94LituvhEgfaZRzFYBa1RGq0QbCVwKuBvXWpFpD2lLwdCqMrMHw\nTRu1pDm83iGZhFy4CQ0W0itynBi1NuOHwIwZDVNn1qxGyYuwny2Zbrd4AOwaEtte\nJFlncOa5AQKBgGz4dlu7X20BHbu0PG8hYfvVHl4JxGHmvu6O3hMT/uiLtDBJtabx\n89XwvHkDZf8weGhRzim+7T5gdDKL1XMZYmwM6bfW/8GzznFDsgfQwppHpXRsc6tX\n4mgOgCvePcfVANi0z+WVlBiAsYi6lo5pIeByo/vWzs9zXtX2SJQ7sK3JAoGBAKvj\nYI9HnWab5NfAzVBtAWGC77BkfOcv1kD/+f3tOa+etIdBjW+NTs/G2I0YTqDcSgza\nnaDj+74B2eB1OWtraSRSf3lxNDH8eHGWtTm6Lr8DOXXwDYrRNs5Hbhk+tzDKKgdW\nKRV/zHKQCt3UX/lRRhcdZbqRAg3goECxAqcrFWkBAoGBAItXtGii48ghlCIKIbcR\nBIc39chVKC9vSuLe8LPSZ+E1J7wWq6d8HYZ0zrlW/GVxYzalmRVMkdJxt0moE1QA\nlpVIyJ3MaJ5hFrFvh1bvIbt0jfB23lLi8ZBJX50cOPcrOulP4y1+23oo7sRE52/Z\ntYZydhaKN7bK++KefcFcKTzi\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@stagelink-39606.iam.gserviceaccount.com",
  client_id: "110566600712298488976",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40stagelink-39606.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

try {
  if (getApps().length > 0) {
    firebaseApp = getApps()[0];
  } else {
    let serviceAccount: any = null;

    // 1. Check environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      } catch {
        try {
          const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
          serviceAccount = JSON.parse(decoded);
        } catch (e) {
          console.warn('⚠️ Could not parse FIREBASE_SERVICE_ACCOUNT_KEY env var:', e);
        }
      }
    }

    // 2. Check local file across possible paths (dev and compiled dist)
    if (!serviceAccount) {
      const possiblePaths = [
        path.resolve(__dirname, 'firebase-service-account.json'),
        path.resolve(__dirname, '../src/config/firebase-service-account.json'),
        path.resolve(__dirname, '../../src/config/firebase-service-account.json'),
        path.resolve(process.cwd(), 'src/config/firebase-service-account.json'),
        path.resolve(process.cwd(), 'server/src/config/firebase-service-account.json'),
        path.resolve(process.cwd(), 'dist/config/firebase-service-account.json'),
        path.resolve(process.cwd(), 'firebase-service-account.json'),
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          try {
            serviceAccount = JSON.parse(fs.readFileSync(p, 'utf-8'));
            console.log(`📁 Loaded Firebase service account from: ${p}`);
            break;
          } catch (e) {
            console.warn(`Failed reading ${p}:`, e);
          }
        }
      }
    }

    // 3. Fallback to embedded credentials
    if (!serviceAccount) {
      serviceAccount = DEFAULT_SERVICE_ACCOUNT;
      console.log('🛡️ Using embedded StageLink Firebase service account credentials');
    }

    if (serviceAccount) {
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('🔥 Firebase Admin initialized successfully (Project: stagelink-39606)');
    }
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin initialization failed:', error);
}

export const getFirebaseApp = (): App | null => firebaseApp;
