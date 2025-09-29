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
import { frontendService } from '../services/frontendService';

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

  constructor(
    private platform: Platform,
    private router: Router,
    public frontendService: frontendService
  ) {
    addIcons({ search, home, calendarOutline, person, logOutOutline });
  }

  ngOnInit() {
    this.checkIfMobile();
    this.platform.resize.subscribe(() => {
      this.checkIfMobile();
    });
  }

  checkIfMobile() {
    this.isMobile = this.platform.width() <= 768;
  }

  onSearch() {
    if (this.searchQuery.trim() !== '') {
      this.router.navigate(['/tabs/search'], {
        queryParams: { query: this.searchQuery },
      });
    }
  }
  onLogout() {
    this.frontendService.logout();
  }
}
