import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonHeader,
  IonToolbar,
  IonSearchbar,
  IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  home,
  search,
  calendarOutline,
  person,
  logOutOutline,
} from 'ionicons/icons';
import { AuthService } from '../services/authService';
import { ConcertsService, Concert } from '../services/concertService';
import { SearchService } from '../services/searchService';
import { NotificationsClientService } from '../services/notificationService';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonHeader,
    IonToolbar,
    IonSearchbar,
    IonBadge,
    CommonModule,
    FormsModule,
  ],
})
export class TabsPage implements OnInit {
  searchQuery = '';
  loggedIn = false;
  upcoming: Concert[] = [];
  upcomingNum = 0;
  notifNum = 0;

  isMobile = false;

  constructor(
    private platform: Platform,
    private router: Router,
    private auth: AuthService,
    private concertsService: ConcertsService,
    private searchService: SearchService,
    private notificationsClient: NotificationsClientService,
    private cd: ChangeDetectorRef
  ) {
    addIcons({ home, search, calendarOutline, person, logOutOutline });
  }

  async ngOnInit() {
    this.loggedIn = this.auth.isLoggedIn();
    if (this.loggedIn) {
      await this.refreshCounts();

      this.platform.resume.subscribe(() => this.refreshCounts());
      window.addEventListener('notif:changed', () => this.refreshCounts());
      window.addEventListener('upcoming:changed', () => this.refreshCounts());

      this.checkIfMobile();
      this.platform.resize.subscribe(() => this.checkIfMobile());
    }

    this.checkIfMobile();
    this.platform.resize.subscribe(() => this.checkIfMobile());
  }

  checkIfMobile() {
    this.isMobile = this.platform.width() <= 768;
  }

  onSearchChange(event: any) {
    const query = event.detail.value || '';
    this.searchQuery = query;
    this.searchService.setQuery(query);
    if (!this.router.url.includes('/tabs/search')) {
      this.router.navigate(['/tabs/search']);
    }
  }

  onSearchCommit(event: any) {
    const value = (event.detail?.value || '').trim();

    if (!value || value.length < 5) {
      return;
    }

    this.searchService.saveToHistory(value);
  }

  async ionViewWillEnter() {
    if (this.auth.isLoggedIn()) await this.refreshCounts();
    this.cd.detectChanges();
  }

  private async refreshCounts() {
    try {
      if (!this.auth.isLoggedIn()) return;
      const [upcoming, unread] = await Promise.all([
        this.concertsService.getUpcomingByUser(),
        this.notificationsClient.getUnreadNotificationCount(),
      ]);
      this.upcoming = upcoming;
      this.upcomingNum = upcoming.length;
      this.notifNum = unread;
      this.cd.detectChanges();
    } catch (e) {
      console.error('refreshCounts failed', e);
    }
  }

  onLogout() {
    this.auth.logout();
  }
}
