// src/app/services/searchService.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

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

  constructor(private http: HttpClient) {
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

    if (!query || query.length < 5) {
      return;
    }

    const current = this.historySource.getValue();
    if (current.length && current[0].toLowerCase() === query.toLowerCase()) {
      return;
    }

    this.addToHistory(query);
  }

  loadHistory() {
    this.http
      .get<SearchHistoryResponse>(`${environment.apiUrl}/api/search-history`)
      .subscribe({
        next: (res) => {
          if (!res.success || !res.data) {
            return;
          }

          const queries = res.data.map((r) => r.query).filter((q) => !!q);

          this.historySource.next(queries);
        },
        error: (err) => {
          console.error('Failed to load search history', err);
        },
      });
  }

  private addToHistory(query: string) {
    const current = this.historySource.getValue();
    const withoutDup = current.filter(
      (q) => q.toLowerCase() !== query.toLowerCase()
    );
    const updated = [query, ...withoutDup].slice(0, 10);
    this.historySource.next(updated);

    this.http
      .post(`${environment.apiUrl}/api/search-history`, { query })
      .subscribe({
        error: (err) => {
          console.error('Failed to save search history', err);
        },
      });
  }
}
