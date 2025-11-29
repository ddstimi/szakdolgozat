import {
  Component,
  OnInit,
  NgZone,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
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
import { AuthService } from 'src/app/services/auth.service';
import { ConcertsService, Concert } from 'src/app/services/concert.service';
import { ConcertCardFullComponent } from 'src/app/components/concert-card-full/concert-card-full.component';
import { environment } from 'src/environments/environment';
import { SearchService } from 'src/app/services/search.service';
import { Subscription } from 'rxjs';
import { ModalController } from '@ionic/angular';
import { ConcertDetailsPage } from '../concert-details/concert-details.page';

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
  providers: [ModalController],
})
export class SearchPage implements OnInit, OnDestroy {
  concerts: Concert[] = [];
  filteredResults: Concert[] = [];
  selectedCity = '';
  selectedGenre = '';
  recentSearches: string[] = [];
  searchQuery = '';
  private querySub?: Subscription;
  private historySub?: Subscription;
  cities: string[] = [];
  genres: string[] = [];
  userAttendingConcerts: number[] = [];
  loggedIn = false;
  selectedDateRange = '';

  constructor(
    private auth: AuthService,
    private concertsService: ConcertsService,
    private searchService: SearchService,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef,
    private modalController: ModalController
  ) {}

  async ngOnInit() {
    this.cd.detectChanges();

    this.concerts = await this.concertsService.getUpcomingConcerts();
    this.loggedIn = this.auth.isLoggedIn();

    if (this.loggedIn) {
      this.userAttendingConcerts = (
        await this.concertsService.getUpcomingByUser()
      ).map((c) => +c.id);
    }

    this.concerts.forEach((c) => {
      if (c.image) c.image = `${environment.apiUrl}${c.image}`;
      c.is_attending = this.userAttendingConcerts.includes(c.id);
    });

    this.filteredResults = [...this.concerts];

    const citySet = new Set<string>();
    const genreSet = new Set<string>();

    this.concerts.forEach((c) => {
      if (c.city_name) citySet.add(c.city_name);
      if (c.genre) c.genre.split(',').forEach((g) => genreSet.add(g.trim()));
    });

    this.cities = Array.from(citySet).sort();
    this.genres = Array.from(genreSet).sort();

    this.querySub = this.searchService.currentQuery$.subscribe((query) => {
      this.ngZone.run(() => {
        this.searchQuery = query || '';
        this.applyFilter(query);
      });
    });

    this.historySub = this.searchService.history$.subscribe((history) => {
      this.ngZone.run(() => {
        this.recentSearches = history;
        this.cd.detectChanges();
      });
    });

    if (this.loggedIn) {
      this.searchService.loadHistory();
    }

    const initialQuery = this.searchService.getCurrentQuery();
    if (initialQuery) {
      this.ngZone.run(() => this.applyFilter(initialQuery));
    }
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
    this.historySub?.unsubscribe();
  }

  onFilterChange() {
    this.applyFilter(this.searchQuery);
  }

  async openDetails(concert: any) {
    const modal = await this.modalController.create({
      component: ConcertDetailsPage,
      componentProps: { concert },
    });

    document.body.classList.add('modal-open');

    modal.onDidDismiss().then((result) => {
      document.body.classList.remove('modal-open');

      if (result.data) {
        const updated = result.data;

        if (updated.attending) {
          if (!this.userAttendingConcerts.includes(+updated.concertId)) {
            this.userAttendingConcerts.push(+updated.concertId);
          }
        } else {
          this.userAttendingConcerts = this.userAttendingConcerts.filter(
            (id) => id !== +updated.concertId
          );
        }

        const filtConcert = this.filteredResults.find(
          (c) => c.id === updated.concertId
        );
        if (filtConcert) filtConcert.is_attending = updated.attending;

        this.cd.detectChanges();
      }
    });

    this.cd.detectChanges();
    await modal.present();
  }

  useRecentSearch(query: string) {
    this.searchService.setQuery(query);
  }

  applyFilter(query: string) {
    const lower = (query || '').toLowerCase();

    this.filteredResults = this.concerts.filter((c) => {
      const title = (c.title || '').toLowerCase();
      const artist = (c.artist_name || '').toLowerCase();
      const date = new Date(c.date);

      const matchesQuery =
        !lower || title.includes(lower) || artist.includes(lower);

      const matchesCity =
        !this.selectedCity || c.city_name === this.selectedCity;

      const matchesGenre =
        !this.selectedGenre || c.genre?.includes(this.selectedGenre);

      const matchesDate =
        !this.selectedDateRange || this.isInRange(date, this.selectedDateRange);

      return matchesQuery && matchesCity && matchesGenre && matchesDate;
    });

    this.sortByDate(this.filteredResults);
    this.cd.detectChanges();
  }

  isInRange(date: Date, range: string): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (range === 'today') {
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return d.getTime() === today.getTime();
    }

    if (range === 'week') {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - diffToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return date >= monday && date <= sunday;
    }

    if (range === 'weekend') {
      const day = date.getDay();
      return day === 6 || day === 0;
    }

    if (range === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return date >= monthStart && date <= monthEnd;
    }

    return true;
  }

  private sortByDate(list: Concert[]) {
    list.sort((a, b) => {
      const da = this.normalizeDate(a.date);
      const db = this.normalizeDate(b.date);
      return da.localeCompare(db);
    });
  }

  private normalizeDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    const parts = dateStr.split(' ');
    return parts[0] || '';
  }
}
