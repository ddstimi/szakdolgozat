import { Injectable } from '@angular/core';

export interface StoredUser {
  name?: string;
  email?: string;
  username?: string;
  gdpr?: boolean;
  img_url?: string;
  [key: string]: any;
}

export interface AuthResult {
  token: string;
  refreshToken?: string;
  user: StoredUser;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  setSession(authResult: AuthResult, stayLoggedIn: boolean): void {
    if (stayLoggedIn) {
      localStorage.setItem('token', authResult.token);
      if (authResult.refreshToken) {
        localStorage.setItem('refresh_token', authResult.refreshToken);
      }
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refresh_token');
    } else {
      sessionStorage.setItem('token', authResult.token);
      if (authResult.refreshToken) {
        sessionStorage.setItem('refresh_token', authResult.refreshToken);
      }
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
    }

    localStorage.setItem('user', JSON.stringify(authResult.user));
  }

  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refresh_token');
  }

  isLoggedIn(): boolean {
    const hasToken =
      !!localStorage.getItem('token') || !!sessionStorage.getItem('token');
    const hasUser = !!localStorage.getItem('user');
    return hasToken && hasUser;
  }

  getCurrentUser(): StoredUser | null {
    const user = localStorage.getItem('user');
    return user ? (JSON.parse(user) as StoredUser) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return (
      localStorage.getItem('refresh_token') ||
      sessionStorage.getItem('refresh_token')
    );
  }

  storeToken(token: string, persistToLocal = true): void {
    if (persistToLocal) {
      localStorage.setItem('token', token);
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('token', token);
      localStorage.removeItem('token');
    }
  }
}
