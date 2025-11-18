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

interface ToastItem {
  title: string;
  body: string;
  data: any;
}

@Injectable({ providedIn: 'root' })
export class PushService {
  private _messaging: Messaging | null = null;
  private _foregroundListenerAttached = false;

  // ▶️ toast queue for 10s spacing
  private toastQueue: ToastItem[] = [];
  private toastTimer: any | null = null;
  private toastActive = false;

  // ▶️ optional polling for runNotificationJobs
  private jobPollingId: any | null = null;

  constructor(private http: HttpClient) {
    // attach foreground listener as early as possible
    this.initForegroundListener();
  }

  // ──────────────────────────────────────────────
  // Firebase / messaging init
  // ──────────────────────────────────────────────

  private async ensureMessaging(): Promise<Messaging | null> {
    if (!(await isSupported())) {
      console.warn('FCM not supported in this browser');
      return null;
    }
    if (!this._messaging) {
      const app = initializeApp(environment.firebase);
      this._messaging = getMessaging(app);
      console.log('Messaging initialised', this._messaging);
    }
    return this._messaging;
  }

  private async initForegroundListener(): Promise<void> {
    const messaging = await this.ensureMessaging();
    if (!messaging) return;

    if (this._foregroundListenerAttached) return;
    this._foregroundListenerAttached = true;

    console.log('Attaching onMessage foreground listener');

    onMessage(messaging, (payload) => {
      console.log('FCM foreground message:', payload);
      window.dispatchEvent(new CustomEvent('notif:changed'));

      const data = (payload.data || {}) as {
        title?: string;
        body?: string;
        linkUrl?: string;
        [key: string]: any;
      };

      const title = data.title || payload.notification?.title || 'Notification';
      const body = data.body || payload.notification?.body || '';

      // still try native browser notification (no throttling needed here)
      try {
        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        }
      } catch (e) {
        console.warn('Browser Notification failed:', e);
      }

      // ⬇️ Instead of dispatching push-toast immediately,
      //    put it in the queue so that toasts show 10s apart
      this.enqueueToast({ title, body, data });
    });
  }

  // ──────────────────────────────────────────────
  // Toast queue (10s gap logic)
  // ──────────────────────────────────────────────

  private enqueueToast(item: ToastItem): void {
    this.toastQueue.push(item);
    // if nothing is running, start immediately with first toast
    if (!this.toastActive && !this.toastTimer) {
      this.processNextToast();
    }
  }

  private processNextToast(): void {
    if (this.toastQueue.length === 0) {
      this.toastActive = false;
      this.toastTimer = null;
      return;
    }

    this.toastActive = true;
    const next = this.toastQueue.shift()!;

    const ev = new CustomEvent('push-toast', {
      detail: {
        title: next.title,
        body: next.body,
        data: next.data,
      },
    });
    window.dispatchEvent(ev);

    // schedule the next toast in 10 seconds
    this.toastTimer = setTimeout(() => {
      this.toastActive = false;
      this.processNextToast();
    }, 10_000);
  }

  // ──────────────────────────────────────────────
  // Token + enable / disable push
  // ──────────────────────────────────────────────

  private getAuthToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  async enablePushNotifications(): Promise<string | null> {
    console.log('enablePushNotifications() called');

    const messaging = await this.ensureMessaging();
    if (!messaging) return null;

    await this.initForegroundListener();

    const permission = await Notification.requestPermission();
    console.log('permission:', permission);
    if (permission !== 'granted') {
      console.warn('Permission not granted');
      return null;
    }

    let token: string | null = null;
    try {
      token = await getFcmToken(messaging, {
        vapidKey: environment.vapidKey,
      });
      console.log('FCM token result:', token);
    } catch (err) {
      console.error('getFcmToken() FAILED:', err);
    }

    if (!token) {
      console.warn('No token returned');
      return null;
    }

    const auth = this.getAuthToken();
    console.log('auth token:', auth);
    if (!auth) {
      console.error('User NOT logged in');
      return null;
    }

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/api/notifications/push-tokens`,
          { token, platform: 'web' },
          {
            headers: new HttpHeaders().set('Authorization', `Bearer ${auth}`),
          }
        )
      );
      console.log('SERVER SAVE TOKEN RESPONSE:', response);
    } catch (err) {
      console.error('Failed to send token to server:', err);
    }

    localStorage.setItem('fcm_token', token);
    console.log('Saved token to localStorage');

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
        {
          headers: new HttpHeaders().set('Authorization', `Bearer ${auth}`),
        }
      )
    );
    localStorage.removeItem('fcm_token');
  }

  // ──────────────────────────────────────────────
  // Run notification jobs (trigger backend)
  // ──────────────────────────────────────────────

  async runNotificationJobs(): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('runNotificationJobs: no auth token');
      return;
    }

    try {
      await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/api/notifications/run-jobs`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      console.log('Triggered notification jobs!');
    } catch (err) {
      console.error('runNotificationJobs FAILED:', err);
    }
  }

  // optional helper: poll runNotificationJobs every N ms
  startJobPolling(intervalMs = 60_000): void {
    if (this.jobPollingId) return;
    this.jobPollingId = setInterval(() => {
      // fire and forget; errors logged inside runNotificationJobs()
      void this.runNotificationJobs();
    }, intervalMs);
  }

  stopJobPolling(): void {
    if (this.jobPollingId) {
      clearInterval(this.jobPollingId);
      this.jobPollingId = null;
    }
  }
}
