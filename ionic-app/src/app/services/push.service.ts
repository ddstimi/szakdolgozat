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
import { AuthService } from 'src/app/services/auth.service';

interface ToastItem {
  title: string;
  body: string;
  data: any;
}

@Injectable({ providedIn: 'root' })
export class PushService {
  private messagingInstance: Messaging | null = null;
  private foregroundListenerAttached = false;

  private toastQueue: ToastItem[] = [];
  private toastTimer: any | null = null;
  private toastActive = false;

  private jobPollingId: any | null = null;

  constructor(private http: HttpClient, private auth: AuthService) {
    void this.initForegroundListener();
  }

  private async ensureMessaging(): Promise<Messaging | null> {
    if (!(await isSupported())) {
      return null;
    }
    if (!this.messagingInstance) {
      const app = initializeApp(environment.firebase);
      this.messagingInstance = getMessaging(app);
    }
    return this.messagingInstance;
  }

  private async initForegroundListener(): Promise<void> {
    const messaging = await this.ensureMessaging();
    if (!messaging) return;

    if (this.foregroundListenerAttached) return;
    this.foregroundListenerAttached = true;

    onMessage(messaging, (payload) => {
      window.dispatchEvent(new CustomEvent('notif:changed'));

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
      } catch {}

      this.enqueueToast({ title, body, data });
    });
  }

  private enqueueToast(item: ToastItem): void {
    this.toastQueue.push(item);
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

    const event = new CustomEvent('push-toast', {
      detail: {
        title: next.title,
        body: next.body,
        data: next.data,
      },
    });
    window.dispatchEvent(event);

    this.toastTimer = setTimeout(() => {
      this.toastActive = false;
      this.processNextToast();
    }, 10_000);
  }

  private getAuthToken(): string | null {
    return this.auth.getToken();
  }

  async enablePushNotifications(): Promise<string | null> {
    const messaging = await this.ensureMessaging();
    if (!messaging) return null;

    await this.initForegroundListener();

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    let token: string | null = null;
    try {
      token = await getFcmToken(messaging, {
        vapidKey: environment.vapidKey,
      });
    } catch {
      return null;
    }

    if (!token) {
      return null;
    }

    const authToken = this.getAuthToken();
    if (!authToken) {
      return null;
    }

    try {
      await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/api/notifications/push-tokens`,
          { token, platform: 'web' },
          {
            headers: new HttpHeaders().set(
              'Authorization',
              `Bearer ${authToken}`
            ),
          }
        )
      );
    } catch {}

    localStorage.setItem('fcm_token', token);
    return token;
  }

  async disablePushNotifications(): Promise<void> {
    const token = localStorage.getItem('fcm_token');
    if (!token) return;

    const authToken = this.getAuthToken();
    if (!authToken) return;

    await firstValueFrom(
      this.http.delete(
        `${
          environment.apiUrl
        }/api/notifications/push-tokens/${encodeURIComponent(token)}`,
        {
          headers: new HttpHeaders().set(
            'Authorization',
            `Bearer ${authToken}`
          ),
        }
      )
    );
    localStorage.removeItem('fcm_token');
  }

  async runNotificationJobs(): Promise<void> {
    const token = this.getAuthToken();
    if (!token) {
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
    } catch {}
  }

  startJobPolling(intervalMs = 60_000): void {
    if (this.jobPollingId) return;
    this.jobPollingId = setInterval(() => {
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
