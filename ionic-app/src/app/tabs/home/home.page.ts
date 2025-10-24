import { CommonModule, NgFor } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
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
  IonImg,
} from '@ionic/angular/standalone';
import { ConcertCardComponent } from 'src/app/components/concert-card/concert-card.component';
import { ConcertCardFullComponent } from '../../components/concert-card-full/concert-card-full.component';
import { ModalController } from '@ionic/angular';
import { ConcertDetailsPage } from '../concert-details/concert-details.page';
import { Concert, frontendService } from 'src/app/services/frontendService';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonImg,
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
    private frontendService: frontendService,
    private cd: ChangeDetectorRef
  ) {}

  topPicks: Concert[] = [];
  popular: Concert[] = [];
  userAttendingConcerts: number[] = [];
  selectedPicture: string = '';

  user = {
    name: '',
    email: '',
    password: '********',
    username: '',
    gdpr: false,
    img_url: '',
  };

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

        const topPicks = this.topPicks.find((c) => c.id === updated.concertId);
        if (topPicks) topPicks.is_attending = updated.attending;
        const popular = this.popular.find((c) => c.id === updated.concertId);
        if (popular) popular.is_attending = updated.attending;

        this.cd.detectChanges();
      }
    });
    this.cd.detectChanges();

    await modal.present();
  }

  async ionViewWillEnter() {
    console.log('Home entering — refreshing user state');

    this.loggedIn = await this.frontendService.isLoggedIn();

    if (this.loggedIn) {
      const userData = await this.frontendService.getUserData();
      this.user = userData;
      this.user.img_url = userData.img_url?.includes(environment.apiUrl)
        ? userData.img_url
        : environment.apiUrl +
          (userData.img_url || '/profile-pictures/bikini.jpg');
      this.selectedPicture = this.user.img_url;

      this.userAttendingConcerts = (
        await this.frontendService.getUpcomingByUser()
      ).map((c) => +c.id);
    }

    this.cd.detectChanges();
  }

  loggedIn = false;
  async ngOnInit() {
    this.cd.detectChanges();

    window.addEventListener('user-updated', () => {
      this.ionViewWillEnter();
    });

    this.loggedIn = await this.frontendService.isLoggedIn();
    if (this.loggedIn) {
      console.log(
        'User is logged in, fetching top picks and popular concerts.'
      );
      const userData = await this.frontendService.getUserData();
      this.user = userData;
      this.user.img_url = userData.img_url?.includes(environment.apiUrl)
        ? userData.img_url
        : environment.apiUrl +
          (userData.img_url || '/profile-pictures/bikini.jpg');
      this.selectedPicture = this.user.img_url;

      this.userAttendingConcerts = (
        await this.frontendService.getUpcomingByUser()
      ).map((c) => +c.id);

      this.topPicks = await this.frontendService.getTopPicks();
      this.topPicks = this.topPicks.map((concert) => {
        return {
          ...concert,
          image: concert.image?.includes(environment.apiUrl)
            ? concert.image
            : environment.apiUrl +
              (concert.image || '/profile-pictures/bikini.jpg'),
          is_attending: this.userAttendingConcerts.includes(concert.id),
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
    this.router.navigate(['/login']);
  }
}
