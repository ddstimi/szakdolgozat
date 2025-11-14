import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { initializeApp } from 'firebase/app';
import {
  getMessaging,
  getToken as getFcmToken,
  onMessage,
  isSupported,
  Messaging,
} from 'firebase/messaging';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class PushService {
  private _messaging: Messaging | null = null;
  private _foregroundListenerAttached = false;

  constructor(private http: HttpClient) {
    // attach listener as early as possible
    this.initForegroundListener();
  }

  private async ensureMessaging(): Promise<Messaging | null> {
    if (!(await isSupported())) {
      console.warn('⚠ FCM not supported in this browser');
      return null;
    }
    if (!this._messaging) {
      const app = initializeApp(environment.firebase);
      this._messaging = getMessaging(app);
      console.log('✅ Messaging initialised', this._messaging);
    }
    return this._messaging;
  }

  private async initForegroundListener(): Promise<void> {
    const messaging = await this.ensureMessaging();
    if (!messaging) return;

    if (this._foregroundListenerAttached) return;
    this._foregroundListenerAttached = true;

    console.log('👂 Attaching onMessage foreground listener');

    onMessage(messaging, (payload) => {
      console.log('📩 FCM foreground message:', payload);
      window.dispatchEvent(new CustomEvent('notif:changed'));

      // Cast data into a nicer typed object
      const data = (payload.data || {}) as {
        title?: string;
        body?: string;
        linkUrl?: string;
        [key: string]: any;
      };

      const title = data.title || payload.notification?.title || 'Notification';

      const body = data.body || payload.notification?.body || '';

      try {
        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        }
      } catch (e) {
        console.warn('Browser Notification failed:', e);
      }

      const ev = new CustomEvent('push-toast', {
        detail: {
          title,
          body,
          data,
        },
      });
      window.dispatchEvent(ev);
    });
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  async enablePushNotifications(): Promise<string | null> {
    console.log('🔵 enablePushNotifications() called');

    const messaging = await this.ensureMessaging();
    if (!messaging) return null;

    // make sure foreground listener is attached too
    await this.initForegroundListener();

    const permission = await Notification.requestPermission();
    console.log('🔵 permission:', permission);
    if (permission !== 'granted') {
      console.warn('⚠ Permission not granted');
      return null;
    }

    let token: string | null = null;
    try {
      token = await getFcmToken(messaging, {
        vapidKey: environment.vapidKey,
      });
      console.log('🔵 FCM token result:', token);
    } catch (err) {
      console.error('❌ getFcmToken() FAILED:', err);
    }

    if (!token) {
      console.warn('⚠ No token returned');
      return null;
    }

    const auth = this.getAuthToken();
    console.log('auth token:', auth);
    if (!auth) {
      console.error('❌ User NOT logged in');
      return null;
    }

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/api/notifications/push-tokens`,
          { token, platform: 'web' },
          { headers: new HttpHeaders().set('Authorization', `Bearer ${auth}`) }
        )
      );
      console.log('🔵 SERVER SAVE TOKEN RESPONSE:', response);
    } catch (err) {
      console.error('❌ Failed to send token to server:', err);
    }

    localStorage.setItem('fcm_token', token);
    console.log('✔ Saved token to localStorage');

    return token;
  }

  async disablePushNotifications(): Promise<void> {
    const token = localStorage.getItem('fcm_token');
    if (!token) return;

    const auth = this.getAuthToken();
    if (!auth) return;

    await firstValueFrom(
      this.http.delete(
        `${
          environment.apiUrl
        }/api/notifications/push-tokens/${encodeURIComponent(token)}`,
        { headers: new HttpHeaders().set('Authorization', `Bearer ${auth}`) }
      )
    );
    localStorage.removeItem('fcm_token');
  }
}
