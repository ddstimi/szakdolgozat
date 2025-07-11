import { firstValueFrom } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};
import { Router } from '@angular/router';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private router: Router) {}

  async login(username: string, password: string) {
    try {
      this.forceRemoveStrayPages();
      const response: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/users/login`, {
          username,
          password,
        })
      );

      this.setSession(response);
      return response;
    } catch (error) {
      throw error;
    }
  }
  async getUserData() {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.getToken()}`
    );

    try {
      const res: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/api/users/profile-info`, {
          headers,
        })
      );

      console.log('User data', res);
      return res.user;
    } catch (error: any) {
      if (
        error.status === 401 ||
        error.error?.name === 'TokenExpiredError' ||
        error.error?.message === 'TokenExpiredError'
      ) {
        alert('Session expired. Please log in again.');
        this.router.navigate(['/login']);
      }
      console.error('Failed to fetch user data', error);
      throw error;
    }
  }
  async updateUserData(updatedUser: {
    name: string;
    email: string;
    password?: string;
    username: string;
    gdpr: boolean;
  }) {
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

      console.log('User data updated', res);
      this.setSession(res);
      return res.user;
    } catch (error: any) {
      if (
        error.status === 401 ||
        error.error?.name === 'TokenExpiredError' ||
        error.error?.message === 'TokenExpiredError'
      ) {
        this.router.navigate(['/login']);
      }
      console.error('Failed to update user data', error);
      throw error;
    }
  }

  async updateUserProfilePicture(imageUrl: string): Promise<any> {
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

      console.log('User picture updated', res);
      this.setSession(res);
      return res.user;
    } catch (error: any) {
      if (
        error.status === 401 ||
        error.error?.name === 'TokenExpiredError' ||
        error.error?.message === 'TokenExpiredError'
      ) {
        this.router.navigate(['/login']);
      }
      console.error('Failed to update user picture', error);
      throw error;
    }
  }

  private setSession(authResult: any) {
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('user', JSON.stringify(authResult.user));
  }
  async uploadImage(file: File) {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG/PNG allowed.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File too large (max 5MB)');
    }

    const formData = new FormData();
    formData.append('profilePicture', file); // Must match Multer field name

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.getToken()}`
    );

    try {
      const response = await firstValueFrom(
        this.http.patch<{ user: any; token: string }>(
          `${environment.apiUrl}/api/users/update-picture`,
          formData,
          { headers }
        )
      );

      this.setSession(response);
      return response;
    } catch (error: any) {
      if (
        error.status === 401 ||
        error.error?.name === 'TokenExpiredError' ||
        error.error?.message === 'TokenExpiredError'
      ) {
        this.router.navigate(['/login']);
      }
      console.error('Upload failed:', error);
      throw error;
    }
  }

  async getPreferences(): Promise<any> {
    const token = await localStorage.getItem('token');
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
    const apiPrefs = {
      ...prefs,
      see_cancelled: prefs.see_cancelled ? 1 : 0,
      see_not_available: prefs.see_not_available ? 1 : 0,
      notify_push: prefs.notify_push ? 1 : 0,
    };
    const token = await localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      throw new Error('No authentication token found');
    }
    return firstValueFrom(
      this.http.patch(
        `${environment.apiUrl}/api/preferences/update`,
        apiPrefs,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
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
      this.router.navigate(['/login']);
      throw new Error('No authentication token found');
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
    return !!localStorage.getItem('token');
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  storeToken(token: string) {
    localStorage.setItem('token', token);
  }
}
