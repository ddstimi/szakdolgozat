import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { Platform } from '@ionic/angular';
import { add, home, calendarOutline, person, search, logOutOutline } from 'ionicons/icons';

import { IonContent, IonHeader, IonTitle, IonToolbar, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet, IonButton, IonInput, IonSearchbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [IonSearchbar, IonInput, IonButton, IonRouterOutlet, IonLabel, IonIcon, IonTabButton, IonTabBar, IonTabs, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class TabsPage implements OnInit {
  public isMobile: boolean = false;
  constructor(private platform: Platform) {
    addIcons({search,home,calendarOutline,person,logOutOutline});
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

}
