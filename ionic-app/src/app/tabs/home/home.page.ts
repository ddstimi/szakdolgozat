import { CommonModule, NgFor } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSegment,
  IonSegmentButton,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonButton,
} from '@ionic/angular/standalone';
import { ConcertCardComponent } from 'src/app/components/concert-card/concert-card.component';
import { ConcertCardFullComponent } from '../../components/concert-card-full/concert-card-full.component';
import { ModalController } from '@ionic/angular';
import { ConcertDetailsPage } from '../concert-details/concert-details.page';
import { Concert, frontendService } from 'src/app/services/frontendService';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    RouterModule,
    IonButton,
    IonLabel,
    IonCol,
    IonRow,
    IonGrid,
    IonSegmentButton,
    IonSegment,
    IonContent,
    ConcertCardComponent,
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    CommonModule,
    NgFor,
    ConcertCardFullComponent,
  ],
  providers: [ModalController],
})
export class HomePage {
  constructor(
    private router: Router,
    private modalController: ModalController,
    private frontendService: frontendService
  ) {}

  topPicks: Concert[] = [];
  popular: Concert[] = [];

  async openDetails(concert: any) {
    const modal = await this.modalController.create({
      component: ConcertDetailsPage,
      componentProps: { concert },
    });

    document.body.classList.add('modal-open');

    modal.onDidDismiss().then(() => {
      document.body.classList.remove('modal-open');
    });

    await modal.present();
  }
  loggedIn = false;
  async ngOnInit() {
    this.loggedIn = await this.frontendService.isLoggedIn();
    if (this.loggedIn) {
      console.log(
        'User is logged in, fetching top picks and popular concerts.'
      );
      this.topPicks = await this.frontendService.getTopPicks();
      this.topPicks = this.topPicks.map((concert) => {
        return {
          ...concert,
          image: concert.image?.includes(environment.apiUrl)
            ? concert.image
            : environment.apiUrl +
              (concert.image || '/profile-pictures/bikini.jpg'),
        };
      });
      this.popular = await this.frontendService.getPopularConcerts();
      this.popular = this.popular.map((concert) => {
        console.log(concert.description);
        return {
          ...concert,
          image: concert.image?.includes(environment.apiUrl)
            ? concert.image
            : environment.apiUrl +
              (concert.image || '/profile-pictures/bikini.jpg'),
        };
      });
    } else {
      console.log(
        'User is not logged in, fetching popular and upcoming concerts.'
      );
      this.topPicks = await this.frontendService.getPopularConcerts();
      this.topPicks = this.topPicks.map((concert) => {
        return {
          ...concert,
          image: concert.image?.includes(environment.apiUrl)
            ? concert.image
            : environment.apiUrl +
              (concert.image || '/profile-pictures/bikini.jpg'),
        };
      });
      this.popular = await this.frontendService.getUpcomingConcerts();
      this.popular = this.popular.map((concert) => {
        console.log(concert.description);
        return {
          ...concert,
          image: concert.image?.includes(environment.apiUrl)
            ? concert.image
            : environment.apiUrl +
              (concert.image || '/profile-pictures/bikini.jpg'),
        };
      });
    }
  }
  openLogin() {
    console.log('Navigating to login...');
    this.router.navigate(['/login']);
  }
}
