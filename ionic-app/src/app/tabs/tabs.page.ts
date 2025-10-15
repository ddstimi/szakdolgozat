import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { Platform } from '@ionic/angular';

import {
  add,
  home,
  calendarOutline,
  person,
  search,
  logOutOutline,
} from 'ionicons/icons';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonButton,
  IonInput,
  IonSearchbar,
  IonBadge,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Concert, frontendService } from '../services/frontendService';
import { searchService } from '../services/searchService';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [
    IonBadge,
    IonSearchbar,
    IonInput,
    IonButton,
    IonRouterOutlet,
    IonLabel,
    IonIcon,
    IonTabButton,
    IonTabBar,
    IonTabs,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
  ],
})
export class TabsPage implements OnInit {
  public isMobile: boolean = false;
  searchQuery: string = '';
  upcoming: Concert[] = [];
  upcomingNum: number = 0;

  constructor(
    private platform: Platform,
    private router: Router,
    public frontendService: frontendService,
    private searchService: searchService
  ) {
    addIcons({ search, home, calendarOutline, person, logOutOutline });
  }
  loggedIn = false;
  async ngOnInit() {
    this.upcoming = await this.frontendService.getUpcomingByUser();
    this.checkIfMobile();
    this.platform.resize.subscribe(() => {
      this.checkIfMobile();
    });
    this.loggedIn = this.frontendService.isLoggedIn();
    if (this.loggedIn) {
      this.upcomingNum = this.upcoming.length;
    }
  }

  checkIfMobile() {
    this.isMobile = this.platform.width() <= 768;
  }

  onSearch() {
    this.router.navigate(['/tabs/search']);
    this.searchService.setQuery(this.searchQuery);
  }

  onLogout() {
    this.frontendService.logout();
  }
}
