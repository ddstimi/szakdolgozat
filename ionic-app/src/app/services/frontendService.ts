import { firstValueFrom, lastValueFrom, tap } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpEvent,
  HttpEventType,
  HttpProgressEvent,
} from '@angular/common/http';
import { environment } from 'src/environments/environment';

import { Router } from '@angular/router';

declare const google: any;

export interface Concert {
  id: number;
  title: string;
  date: string;
  description?: string;
  ticket_url?: string;
  ticket_available: boolean;
  cancelled: boolean;
  venue_name: string;
  city_id: number;
  city_name: string;
  artist_name: string;
  image?: string;
  genre?: string;
  is_attending?: boolean;
}
@Injectable({
  providedIn: 'root',
})
export class frontendService {
  constructor(private http: HttpClient, private router: Router) {}

  async login(username: string, password: string, stayLoggedIn: boolean) {
    try {
      const response: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/users/login`, {
          username,
          password,
          stayLoggedIn,
        })
      );

      await this.setSession(response, stayLoggedIn);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async loginWithGoogleResponse(
    response: any,
    stayLoggedIn: boolean
  ): Promise<void> {
    await this.setSession(response, stayLoggedIn);
  }

  async getUserData() {
    try {
      const headers = new HttpHeaders().set(
        'Authorization',
        `Bearer ${this.getToken()}`
      );
      const res: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/api/users/profile-info`, {
          headers,
        })
      );
      return res.user;
    } catch (error: any) {
      if (
        error.status === 401 ||
        error.error?.message === 'TokenExpiredError'
      ) {
        const newToken = await this.refreshAccessToken();
        if (!newToken) {
          this.router.navigate(['/login']);
          return null;
        }
        const headers = new HttpHeaders().set(
          'Authorization',
          `Bearer ${newToken}`
        );
        const res: any = await firstValueFrom(
          this.http.get(`${environment.apiUrl}/api/users/profile-info`, {
            headers,
          })
        );
        return res.user;
      }
      throw error;
    }
  }

  async updateUserData(
    updatedUser: {
      name: string;
      email: string;
      password?: string;
      username: string;
      gdpr: boolean;
    },
    stayLoggedIn: boolean
  ): Promise<any> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.getToken()}`
    );
    let res: any;
    try {
      res = await firstValueFrom(
        this.http.put(
          `${environment.apiUrl}/api/users/update-profile`,
          updatedUser,
          { headers }
        )
      );

      console.log('User data updated', res);
      this.setSession(res, stayLoggedIn);
      return res.user;
    } catch (error: any) {
      if (
        error.status === 401 ||
        error.error?.message === 'TokenExpiredError'
      ) {
        const newToken = await this.refreshAccessToken();
        if (!newToken) {
          this.router.navigate(['/login']);
          return null;
        }
        const headers = new HttpHeaders().set(
          'Authorization',
          `Bearer ${newToken}`
        );
        const res: any = await firstValueFrom(
          this.http.put(
            `${environment.apiUrl}/api/users/update-profile`,
            updatedUser,
            { headers }
          )
        );
        return res.user;
      }
      console.error('Failed to update user data', error);
      throw error;
    }
  }
  async refreshAccessToken(): Promise<string | null> {
    const storedUser =
      localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!storedUser) {
      return null;
    }

    const refreshTokenLocal = localStorage.getItem('refresh_token');
    const refreshTokenSession = sessionStorage.getItem('refresh_token');
    const refreshToken = refreshTokenLocal || refreshTokenSession;
    const useLocal = !!refreshTokenLocal;

    if (!refreshToken) {
      return null;
    }

    try {
      const res: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/users/refresh`, {
          refreshToken,
        })
      );
      console.log('Sending refresh token:', refreshToken);
      console.log('try token refresh', res);
      if (res.token) {
        if (useLocal) {
          localStorage.setItem('token', res.token);
        } else {
          sessionStorage.setItem('token', res.token);
        }
        return res.token;
      }
      return null;
    } catch (err) {
      console.error('Failed to refresh token', err);
      this.logout();
      return null;
    }
  }

  async uploadAvatarViaBackend(file: File, stayLoggedIn: boolean) {
    const token = this.getToken();
    if (!token) throw new Error('Not logged in');

    const form = new FormData();
    form.append('file', file);

    const up: any = await firstValueFrom(
      this.http.post(`${environment.apiUrl}/api/users/picture/upload`, form, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    const payload = up.publicUrl
      ? { publicUrl: up.publicUrl }
      : { key: up.key };
    const user = await this.updateUserPicturePublicUrl(payload, stayLoggedIn);
    return { user, publicUrl: up.publicUrl, key: up.key };
  }

  async uploadAvatarToR2(
    file: File,
    stayLoggedIn: boolean,
    onProgress?: (pct: number) => void
  ) {
    if (onProgress) onProgress(5);
    const res = await this.uploadAvatarViaBackend(file, stayLoggedIn);
    if (onProgress) onProgress(100);
    return res;
  }

  async updateUserPicturePublicUrl(
    payload: { publicUrl?: string; key?: string },
    stayLoggedIn: boolean
  ) {
    const token = this.getToken();
    if (!token) throw new Error('Not logged in');

    const res: any = await firstValueFrom(
      this.http.patch(
        `${environment.apiUrl}/api/users/update-picture`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );

    if (stayLoggedIn && res?.token) {
      localStorage.setItem('token', res.token);
    } else if (res?.token) {
      sessionStorage.setItem('token', res.token);
    }
    localStorage.setItem('user', JSON.stringify(res.user));

    return res.user as any;
  }

  async updateUserProfilePicture(
    imageUrl: string,
    stayLoggedIn: boolean
  ): Promise<any> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.getToken()}`
    );
    let res: any;
    try {
      res = await firstValueFrom(
        this.http.patch(
          `${environment.apiUrl}/api/users/update-static-picture`,
          { img_url: imageUrl },
          { headers }
        )
      );

      console.log('User picture updated', res);
      this.setSession(res, stayLoggedIn);
      return res.user;
    } catch (error: any) {
      if (
        error.status === 401 ||
        error.error?.message === 'TokenExpiredError'
      ) {
        const newToken = await this.refreshAccessToken();
        if (!newToken) {
          this.router.navigate(['/login']);
          return null;
        }
        const headers = new HttpHeaders().set(
          'Authorization',
          `Bearer ${newToken}`
        );
        const res: any = await firstValueFrom(
          this.http.patch(
            `${environment.apiUrl}/api/users/update-static-picture`,
            { img_url: imageUrl },
            { headers }
          )
        );
        return res.user;
      }
      console.error('Failed to update user picture', error);
      throw error;
    }
  }

  private setSession(authResult: any, stayLoggedIn: boolean) {
    if (stayLoggedIn) {
      localStorage.setItem('token', authResult.token);
      localStorage.setItem('refresh_token', authResult.refreshToken);
    } else {
      sessionStorage.setItem('token', authResult.token);
      sessionStorage.setItem('refresh_token', authResult.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(authResult.user));
  }

  async getPreferences(): Promise<any> {
    const token = await this.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      throw new Error('No authentication token found');
    }
    return firstValueFrom(
      this.http.get(`${environment.apiUrl}/api/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
  }

  async updatePreferences(prefs: {
    see_cancelled: boolean;
    see_not_available: boolean;
    notify_push: boolean;
    artists: number[];
    locations: number[];
    genres: number[];
    venues: number[];
  }): Promise<any> {
    const token = await localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      throw new Error('No authentication token found');
    }
    return firstValueFrom(
      this.http.patch(`${environment.apiUrl}/api/preferences/update`, prefs, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
  }

  async getPreferenceOptions(): Promise<{
    artists: { id: number; name: string }[];
    cities: { id: number; name: string }[];
    genres: { id: number; name: string }[];
    venues: { id: number; name: string }[];
  }> {
    const token = this.getToken();
    if (!token) {
      const newToken = await this.refreshAccessToken();
      if (!newToken) {
        this.router.navigate(['/login']);
        return {
          artists: [],
          cities: [],
          genres: [],
          venues: [],
        };
      }
      const headers = new HttpHeaders().set(
        'Authorization',
        `Bearer ${newToken}`
      );
      const res: any = await firstValueFrom(
        this.http.get<{
          success: boolean;
          data: {
            artists: { id: number; name: string }[];
            cities: { id: number; name: string }[];
            genres: { id: number; name: string }[];
            venues: { id: number; name: string }[];
          };
        }>(`${environment.apiUrl}/api/preferences/options`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      return res.user;
    }

    const response = await firstValueFrom(
      this.http.get<{
        success: boolean;
        data: {
          artists: { id: number; name: string }[];
          cities: { id: number; name: string }[];
          genres: { id: number; name: string }[];
          venues: { id: number; name: string }[];
        };
      }>(`${environment.apiUrl}/api/preferences/options`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    return (
      response?.data || {
        artists: [],
        cities: [],
        genres: [],
        venues: [],
      }
    );
  }

  async getTopPicks(): Promise<Concert[]> {
    const token = this.getToken();
    if (!this.isLoggedIn()) {
      return this.getPopularConcerts();
    } else {
      const response = await firstValueFrom(
        this.http.get<{
          success: boolean;
          data: Concert[];
        }>(`${environment.apiUrl}/api/concerts/top-picks`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      return response.data;
    }
  }

  async getUpcomingByUser(): Promise<Concert[]> {
    const token = this.getToken();
    if (this.isLoggedIn()) {
      const response = await firstValueFrom(
        this.http.get<{
          success: boolean;
          data: Concert[];
        }>(`${environment.apiUrl}/api/concerts/upcoming-by-user`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      return response.data;
    }
    return this.getUpcomingConcerts();
  }

  async getPastByUser(): Promise<Concert[]> {
    const token = this.getToken();
    if (!this.isLoggedIn()) {
      return this.getPastByUser();
    } else {
      const response = await firstValueFrom(
        this.http.get<{
          success: boolean;
          data: Concert[];
        }>(`${environment.apiUrl}/api/concerts/past`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      return response.data;
    }
  }

  async getPopularConcerts(): Promise<Concert[]> {
    const response = await firstValueFrom(
      this.http.get<{
        success: boolean;
        data: Concert[];
      }>(`${environment.apiUrl}/api/concerts/popular`)
    );

    return response.data;
  }

  async getUpcomingConcerts(): Promise<Concert[]> {
    const response = await firstValueFrom(
      this.http.get<{
        success: boolean;
        data: Concert[];
      }>(`${environment.apiUrl}/api/concerts/upcoming`)
    );

    return response.data;
  }

  async getEventStatistics(interval: '6months' | '1year' | 'all') {
    const token = this.getToken();
    if (!token) throw new Error('Not logged in');

    const res = await firstValueFrom(
      this.http.get<{
        success: boolean;
        data: {
          totalConcerts: number;
          genreData: Record<string, number>;
          locationData: Record<string, number>;
          artistData: Record<string, number>;
          insights: { slides: string[] };
          events: any[];
        };
      }>(`${environment.apiUrl}/api/event-statistics?interval=${interval}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    return res.data;
  }

  async attendConcert(concertId: number): Promise<{ attending: boolean }> {
    const token = this.getToken();
    if (!token) throw new Error('Not logged in');

    const res: any = await firstValueFrom(
      this.http.patch(
        `${environment.apiUrl}/api/users/attend_concert`,
        { concertId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
    );

    return { attending: res.attending };
  }

  async getNotifications(unreadOnly = false): Promise<Array<any>> {
    const token = this.getToken();
    if (!token) {
      const newToken = await this.refreshAccessToken();
      if (!newToken) throw new Error('Not logged in');
    }
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.getToken()}`
    );
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
        const newToken = await this.refreshAccessToken();
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
    const token = this.getToken();
    if (!token) {
      const newToken = await this.refreshAccessToken();
      if (!newToken) return 0;
    }
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.getToken()}`
    );
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
        const newToken = await this.refreshAccessToken();
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
    const token = this.getToken();
    if (!token) {
      const newToken = await this.refreshAccessToken();
      if (!newToken) throw new Error('Not logged in');
    }
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.getToken()}`)
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
        const newToken = await this.refreshAccessToken();
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

  forceRemoveStrayPages() {
    setTimeout(() => {
      const profilePage = document.querySelector('app-profile');
      if (profilePage) profilePage.remove();

      const homePage = document.querySelector('app-home');
      if (homePage) homePage.remove();
    }, 300);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    google.accounts.id.disableAutoSelect();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return (
      (!!localStorage.getItem('token') || !!sessionStorage.getItem('token')) &&
      !!localStorage.getItem('user')
    );
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  storeToken(token: string) {
    localStorage.setItem('token', token);
  }
}
