import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

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
@Injectable({ providedIn: 'root' })
export class ConcertsService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  async getTopPicks(): Promise<Concert[]> {
    const token = this.auth.getToken();
    if (!this.auth.isLoggedIn() || !token) {
      return this.getPopularConcerts();
    }

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

  async getUpcomingByUser(): Promise<Concert[]> {
    const token = this.auth.getToken();
    if (this.auth.isLoggedIn() && token) {
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
    const token = this.auth.getToken();
    if (!this.auth.isLoggedIn() || !token) {
      return [];
    }
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
    const token = this.auth.getToken();
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
    const token = this.auth.getToken();
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
}
