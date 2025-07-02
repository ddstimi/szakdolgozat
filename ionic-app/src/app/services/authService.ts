import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient, private router: Router) {}

  async login(username: string, password: string) {
    try {
      const response: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/users/login`, { username, password })
      );
      
      this.setSession(response);
      return response;
    } catch (error) {
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
}