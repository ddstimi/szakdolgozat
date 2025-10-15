import { Component, OnInit } from '@angular/core';
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
  searchQuery = '';
  selectedCity = '';
  selectedGenre = '';
  recentSearches: string[] = [];

  cities: string[] = ['Budapest', 'London', 'Paris'];
  genres: string[] = ['Rock', 'Pop', 'Indie', 'Jazz'];

  constructor(private frontendService: frontendService) {}

  async ngOnInit() {
    this.concerts = await this.frontendService.getUpcomingConcerts();
    this.concerts.forEach((concert) => {
      if (concert.image) {
        concert.image = `${environment.apiUrl}${concert.image}`;
      }
    });
    this.filteredResults = [...this.concerts];
  }

  handleSearch(event: Event) {
    const target = event.target as HTMLIonSearchbarElement;
    this.searchQuery = target.value?.toLowerCase() || '';
    this.applyFilters();

    if (this.searchQuery && !this.recentSearches.includes(this.searchQuery)) {
      this.recentSearches.unshift(this.searchQuery);
      this.recentSearches = this.recentSearches.slice(0, 5);
    }
  }

  onCityChange() {
    this.applyFilters();
  }

  onGenreChange() {
    this.applyFilters();
  }

  applyFilters() {
    this.filteredResults = this.concerts.filter((concert) => {
      const matchesQuery =
        !this.searchQuery ||
        concert.title.toLowerCase().includes(this.searchQuery) ||
        concert.artist_name.toLowerCase().includes(this.searchQuery);

      const matchesCity =
        !this.selectedCity || concert.city_name === this.selectedCity;

      const matchesGenre =
        !this.selectedGenre || concert.genre === this.selectedGenre;

      return matchesQuery && matchesCity && matchesGenre;
    });
  }
}
