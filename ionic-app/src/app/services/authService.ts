import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private router: Router) {}

  async login(username: string, password: string) {
    try {
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
      // Await the first emitted value (the HTTP response)
      const res: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/api/users/profile-info`, {
          headers,
        })
      );

      console.log('User data', res);
      return res.user; // just the user object
    } catch (error) {
      console.error('Failed to fetch user data', error);
      throw error;
    }
  }
  async updateUserData(updatedUser: {
    name: string;
    email: string;
    password?: string; // optional
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
      this.setSession(res); // update local storage with new data
      return res.user;
    } catch (error) {
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
    } catch (error) {
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

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File too large (max 5MB)');
    }

    const formData = new FormData();
    formData.append('profilePicture', file); // Must match Multer field name

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.getToken()}`
    );
    // Don't set Content-Type - let browser handle it for FormData

    try {
      const response = await firstValueFrom(
        this.http.patch<{ user: any; token: string }>(
          `${environment.apiUrl}/api/users/update-picture`,
          formData,
          { headers }
        )
      );

      this.setSession(response); // Update local storage
      return response;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error; // Re-throw for component to handle
    }
  }

  async getPreferences(): Promise<any> {
    const token = await localStorage.getItem('token');
    return this.http
      .get(`${environment.apiUrl}/api/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .toPromise();
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
    return this.http
      .patch(`${environment.apiUrl}/api/preferences/update`, prefs, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .toPromise();
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
