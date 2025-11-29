import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './authService';

@Injectable({ providedIn: 'root' })
export class NotificationsClientService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  async getNotifications(unreadOnly = false): Promise<any[]> {
    let token = this.auth.getToken();
    if (!token) {
      const newToken = await this.auth.refreshAccessToken();
      if (!newToken) throw new Error('Not logged in');
      token = newToken;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    try {
      const res: any = await firstValueFrom(
        this.http.get(
          `${environment.apiUrl}/api/notifications?unreadOnly=${unreadOnly}`,
          { headers }
        )
      );
      return res?.data ?? [];
    } catch (error: any) {
      if (
        error.status === 401 ||
        error.error?.message === 'TokenExpiredError'
      ) {
        const newToken = await this.auth.refreshAccessToken();
        if (!newToken) throw error;
        const headers2 = new HttpHeaders().set(
          'Authorization',
          `Bearer ${newToken}`
        );
        const res: any = await firstValueFrom(
          this.http.get(
            `${environment.apiUrl}/api/notifications?unreadOnly=${unreadOnly}`,
            { headers: headers2 }
          )
        );
        return res?.data ?? [];
      }
      throw error;
    }
  }

  async getUnreadNotificationCount(): Promise<number> {
    let token = this.auth.getToken();
    if (!token) {
      const newToken = await this.auth.refreshAccessToken();
      if (!newToken) return 0;
      token = newToken;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    try {
      const res: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/api/notifications/unread-count`, {
          headers,
        })
      );
      return Number(res?.data?.count ?? 0);
    } catch (error: any) {
      if (
        error.status === 401 ||
        error.error?.message === 'TokenExpiredError'
      ) {
        const newToken = await this.auth.refreshAccessToken();
        if (!newToken) return 0;
        const headers2 = new HttpHeaders().set(
          'Authorization',
          `Bearer ${newToken}`
        );
        const res: any = await firstValueFrom(
          this.http.get(
            `${environment.apiUrl}/api/notifications/unread-count`,
            { headers: headers2 }
          )
        );
        return Number(res?.data?.count ?? 0);
      }
      throw error;
    }
  }

  async markNotificationRead(id: number, read: boolean): Promise<void> {
    let token = this.auth.getToken();
    if (!token) {
      const newToken = await this.auth.refreshAccessToken();
      if (!newToken) throw new Error('Not logged in');
      token = newToken;
    }
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');

    try {
      await firstValueFrom(
        this.http.patch(
          `${environment.apiUrl}/api/notifications/${id}/read`,
          { read },
          { headers }
        )
      );
    } catch (error: any) {
      if (
        error.status === 401 ||
        error.error?.message === 'TokenExpiredError'
      ) {
        const newToken = await this.auth.refreshAccessToken();
        if (!newToken) throw error;
        const headers2 = new HttpHeaders()
          .set('Authorization', `Bearer ${newToken}`)
          .set('Content-Type', 'application/json');
        await firstValueFrom(
          this.http.patch(
            `${environment.apiUrl}/api/notifications/${id}/read`,
            { read },
            { headers: headers2 }
          )
        );
        return;
      }
      throw error;
    }
  }
}
