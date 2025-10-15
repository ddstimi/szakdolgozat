import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { frontendService, Concert } from './frontendService';

@Injectable({
  providedIn: 'root',
})
export class searchService {
  private concertsSubject = new BehaviorSubject<Concert[]>([]);
  concerts$ = this.concertsSubject.asObservable();

  private querySubject = new BehaviorSubject<string>('');
  private citySubject = new BehaviorSubject<string>('');
  private genreSubject = new BehaviorSubject<string>('');

  query$ = this.querySubject.asObservable();
  city$ = this.citySubject.asObservable();
  genre$ = this.genreSubject.asObservable();

  constructor(private frontendService: frontendService) {
    this.loadConcerts();
  }

  /** Make sure concerts are loaded once and trigger updates when done */
  private async loadConcerts() {
    try {
      const concerts = await this.frontendService.getUpcomingConcerts();
      this.concertsSubject.next(concerts || []);
    } catch (err) {
      console.error('Failed to load concerts:', err);
      this.concertsSubject.next([]);
    }
  }

  /** Filters are applied every time any filter or concerts change */
  filteredResults$ = combineLatest([
    this.concerts$,
    this.query$,
    this.city$,
    this.genre$,
  ]).pipe(
    map(([concerts, query, city, genre]) => {
      const normalizedQuery = query.toLowerCase();

      return concerts.filter((concert) => {
        const matchesQuery =
          !query ||
          concert.title.toLowerCase().includes(normalizedQuery) ||
          concert.artist_name?.toLowerCase().includes(normalizedQuery);

        const matchesCity =
          !city || concert.city_name.toLowerCase() === city.toLowerCase();

        const matchesGenre =
          !genre || concert.genre?.toLowerCase() === genre.toLowerCase();

        return matchesQuery && matchesCity && matchesGenre;
      });
    })
  );

  // === setters ===
  setQuery(query: string) {
    this.querySubject.next(query || '');
  }

  setCity(city: string) {
    this.citySubject.next(city || '');
  }

  setGenre(genre: string) {
    this.genreSubject.next(genre || '');
  }
}
