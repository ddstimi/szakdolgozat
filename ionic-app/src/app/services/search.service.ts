import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/services/auth.service';

interface SearchHistoryResponse {
  success: boolean;
  data: { id: number; user_id: number; query: string; search_date: string }[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private querySource = new BehaviorSubject<string>('');
  currentQuery$ = this.querySource.asObservable();
  readonly id: number;

  private historySource = new BehaviorSubject<string[]>([]);
  history$ = this.historySource.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) {
    this.id = Math.random();
  }

  setQuery(query: string) {
    const cleaned = (query || '').trim();
    this.querySource.next(cleaned);
  }

  getCurrentQuery() {
    return this.querySource.getValue();
  }

  saveToHistory(raw: string) {
    const query = (raw || '').trim();
    if (!query || query.length < 5) return;
    const current = this.historySource.getValue();
    if (current.length && current[0].toLowerCase() === query.toLowerCase()) {
      return;
    }
    void this.addToHistory(query);
  }

  async loadHistory(): Promise<void> {
    let token = this.auth.getToken();
    if (!token) return;

    try {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      const res = await firstValueFrom(
        this.http.get<SearchHistoryResponse>(
          `${environment.apiUrl}/api/search-history`,
          { headers }
        )
      );

      if (!res.success || !res.data) return;
      const queries = res.data.map((r) => r.query).filter((q) => !!q);
      this.historySource.next(queries);
    } catch (error: any) {
      if (
        error.status === 401 ||
        error.error?.message === 'TokenExpiredError'
      ) {
        const newToken = await this.auth.refreshAccessToken();
        if (!newToken) return;

        try {
          const headers = new HttpHeaders().set(
            'Authorization',
            `Bearer ${newToken}`
          );
          const res = await firstValueFrom(
            this.http.get<SearchHistoryResponse>(
              `${environment.apiUrl}/api/search-history`,
              { headers }
            )
          );

          if (!res.success || !res.data) return;
          const queries = res.data.map((r) => r.query).filter((q) => !!q);
          this.historySource.next(queries);
        } catch {}
      }
    }
  }

  private async addToHistory(query: string): Promise<void> {
    const current = this.historySource.getValue();
    const withoutDup = current.filter(
      (q) => q.toLowerCase() !== query.toLowerCase()
    );
    const updated = [query, ...withoutDup].slice(0, 10);
    this.historySource.next(updated);

    let token = this.auth.getToken();
    if (!token) return;

    try {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/api/search-history`,
          { query },
          { headers }
        )
      );
    } catch (error: any) {
      if (
        error.status === 401 ||
        error.error?.message === 'TokenExpiredError'
      ) {
        const newToken = await this.auth.refreshAccessToken();
        if (!newToken) return;

        const headers = new HttpHeaders().set(
          'Authorization',
          `Bearer ${newToken}`
        );

        try {
          await firstValueFrom(
            this.http.post(
              `${environment.apiUrl}/api/search-history`,
              { query },
              { headers }
            )
          );
        } catch {}
      }
    }
  }
}
