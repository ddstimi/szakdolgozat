import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import {
  IonContent,
  IonChip,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Concert, frontendService } from 'src/app/services/frontendService';
import { ConcertCardFullComponent } from 'src/app/components/concert-card-full/concert-card-full.component';
import { environment } from 'src/environments/environment';
import { SearchService } from 'src/app/services/searchService';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonChip,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonSearchbar,
    FormsModule,
    CommonModule,
    ConcertCardFullComponent,
  ],
})
export class SearchPage implements OnInit {
  concerts: Concert[] = [];
  filteredResults: Concert[] = [];
  selectedCity = '';
  selectedGenre = '';
  recentSearches: string[] = [];
  searchQuery: string = '';
  private querySub?: Subscription;

  cities: string[] = ['Budapest', 'London', 'Paris'];
  genres: string[] = ['Rock', 'Pop', 'Indie', 'Jazz'];

  constructor(
    private frontendService: frontendService,
    private searchService: SearchService,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.concerts = await this.frontendService.getUpcomingConcerts();
    this.concerts.forEach((c) => {
      if (c.image) c.image = `${environment.apiUrl}${c.image}`;
    });
    this.filteredResults = [...this.concerts];

    this.querySub = this.searchService.currentQuery$.subscribe((query) => {
      this.ngZone.run(() => {
        this.searchQuery = query || '';
        this.applyFilter(query);
      });
    });

    const initialQuery = this.searchService.getCurrentQuery();
    if (initialQuery) {
      this.ngZone.run(() => this.applyFilter(initialQuery));
    }
  }

  applyFilter(query: string) {
    const lower = (query || '').toLowerCase();

    if (!lower || lower.length < 2) {
      this.filteredResults = [...this.concerts];
      this.cd.detectChanges();
      return;
    }

    this.filteredResults = this.concerts.filter(
      (c) =>
        (c.title?.toLowerCase().includes(lower) ?? false) ||
        (c.artist_name?.toLowerCase().includes(lower) ?? false)
    );
    this.cd.detectChanges();
  }
}
