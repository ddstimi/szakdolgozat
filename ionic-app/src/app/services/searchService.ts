// src/app/services/searchService.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private querySource = new BehaviorSubject<string>('');
  currentQuery$ = this.querySource.asObservable();
  readonly id: number;

  constructor() {
    this.id = Math.random();
  }

  setQuery(query: string) {
    this.querySource.next(query);
  }

  getCurrentQuery() {
    return this.querySource.getValue();
  }
}
