import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  async getPreferences(): Promise<any> {
    const token = this.auth.getToken();
    if (!token) throw new Error('No authentication token found');
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
    const token = this.auth.getToken();
    if (!token) throw new Error('No authentication token found');
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
    let token = this.auth.getToken();
    if (!token) {
      const newToken = await this.auth.refreshAccessToken();
      if (!newToken) {
        return {
          artists: [],
          cities: [],
          genres: [],
          venues: [],
        };
      }
      token = newToken;
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
}
