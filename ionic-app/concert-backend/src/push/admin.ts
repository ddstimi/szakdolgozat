import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';

export function messaging() {
  if (!getApps().length) {
    const creds = JSON.parse(
      fs.readFileSync(process.env.FIREBASE_CREDENTIALS!, 'utf8')
    );
    initializeApp({ credential: cert(creds) });
  }
  return getMessaging();
}
