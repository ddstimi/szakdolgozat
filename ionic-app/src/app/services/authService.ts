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
          `${environment.apiUrl}/api/users/update-picture`,
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
