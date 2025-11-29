import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private router: Router) {}

  async login(username: string, password: string, stayLoggedIn: boolean) {
    const response: any = await firstValueFrom(
      this.http.post(`${environment.apiUrl}/api/users/login`, {
        username,
        password,
        stayLoggedIn,
      })
    );
    this.setSession(response, stayLoggedIn);
    return response;
  }

  async loginWithGoogleResponse(response: any, stayLoggedIn: boolean) {
    this.setSession(response, stayLoggedIn);
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
  ) {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.getToken()}`
    );
    try {
      const res: any = await firstValueFrom(
        this.http.put(
          `${environment.apiUrl}/api/users/update-profile`,
          updatedUser,
          { headers }
        )
      );
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
      throw error;
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    const storedUser =
      localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!storedUser) return null;

    const refreshTokenLocal = localStorage.getItem('refresh_token');
    const refreshTokenSession = sessionStorage.getItem('refresh_token');
    const refreshToken = refreshTokenLocal || refreshTokenSession;
    const useLocal = !!refreshTokenLocal;

    if (!refreshToken) return null;

    try {
      const res: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/users/refresh`, {
          refreshToken,
        })
      );
      if (res.token) {
        if (useLocal) {
          localStorage.setItem('token', res.token);
        } else {
          sessionStorage.setItem('token', res.token);
        }
        return res.token;
      }
      return null;
    } catch {
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

    return res.user;
  }

  async updateUserProfilePicture(
    imageUrl: string,
    stayLoggedIn: boolean
  ): Promise<any> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.getToken()}`
    );
    try {
      const res: any = await firstValueFrom(
        this.http.patch(
          `${environment.apiUrl}/api/users/update-static-picture`,
          { img_url: imageUrl },
          { headers }
        )
      );
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
      throw error;
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refresh_token');
    google?.accounts?.id?.disableAutoSelect?.();
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

  forceRemoveStrayPages() {
    setTimeout(() => {
      const profilePage = document.querySelector('app-profile');
      if (profilePage) profilePage.remove();

      const homePage = document.querySelector('app-home');
      if (homePage) homePage.remove();

      const eventsPage = document.querySelector('app-events');
      if (eventsPage) eventsPage.remove();

      const searchPage = document.querySelector('app-search');
      if (searchPage) searchPage.remove();
    }, 300);
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
}
