import { Component, OnInit, Output } from '@angular/core';
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
import { frontendService, Concert } from '../services/frontendService';
import { SearchService } from '../services/searchService';

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
  searchQuery: string = '';
  loggedIn = false;
  upcoming: Concert[] = [];
  upcomingNum = 0;
  notifNum = 0;

  isMobile = false;

  constructor(
    private platform: Platform,
    private router: Router,
    private frontendService: frontendService,
    private searchService: SearchService
  ) {
    addIcons({ home, search, calendarOutline, person, logOutOutline });
  }

  async ngOnInit() {
    this.loggedIn = this.frontendService.isLoggedIn();
    if (this.loggedIn) {
      this.upcoming = await this.frontendService.getUpcomingByUser();
      this.upcomingNum = this.upcoming.length;
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

  onLogout() {
    this.frontendService.logout();
  }
}
