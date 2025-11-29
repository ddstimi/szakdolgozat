import { CommonModule, NgFor } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
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
import { AuthService } from 'src/app/services/auth.service';
import { ConcertsService, Concert } from 'src/app/services/concert.service';
import { UserPreferencesService } from 'src/app/services/user-preferences.service';
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
    private auth: AuthService,
    private concertsService: ConcertsService,
    private preferencesService: UserPreferencesService,
    private cd: ChangeDetectorRef
  ) {}

  topPicks: Concert[] = [];
  popular: Concert[] = [];
  userAttendingConcerts: number[] = [];
  selectedPicture: string = '';
  loggedIn = false;

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

        const topPick = this.topPicks.find((c) => c.id === updated.concertId);
        if (topPick) topPick.is_attending = updated.attending;
        const popular = this.popular.find((c) => c.id === updated.concertId);
        if (popular) popular.is_attending = updated.attending;

        this.cd.detectChanges();
      }
    });
    this.cd.detectChanges();

    await modal.present();
  }

  async ionViewWillEnter() {
    this.loggedIn = this.auth.isLoggedIn();

    if (this.loggedIn) {
      this.userAttendingConcerts = (
        await this.concertsService.getUpcomingByUser()
      ).map((c) => +c.id);

      const userData = await this.auth.getUserData();
      this.user = userData;
      this.selectedPicture = this.user.img_url;

      const prefs = await this.preferencesService.getPreferences();
      const raw = prefs.preferences || prefs;

      const preferences = {
        seeCancelled: !!raw.see_cancelled,
        seeNotAvailable: !!raw.se_not_available,
      };

      this.topPicks = await this.concertsService.getTopPicks();
      if (!preferences.seeNotAvailable) {
        this.topPicks = this.topPicks.filter((c) => c.ticket_available);
      }
      if (!preferences.seeCancelled) {
        this.topPicks = this.topPicks.filter((c) => !c.cancelled);
      }
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

      this.popular = await this.concertsService.getPopularConcerts();
      if (!preferences.seeNotAvailable) {
        this.popular = this.popular.filter((c) => c.ticket_available);
      }
      if (!preferences.seeCancelled) {
        this.popular = this.popular.filter((c) => !c.cancelled);
      }
      this.popular = this.popular.map((concert) => {
        return {
          ...concert,
          image: concert.image?.includes(environment.apiUrl)
            ? concert.image
            : environment.apiUrl +
              (concert.image || '/profile-pictures/bikini.jpg'),
          is_attending: this.userAttendingConcerts.includes(concert.id),
        };
      });
    } else {
      this.topPicks = await this.concertsService.getTopPicks();
      this.topPicks = this.topPicks.map((concert) => ({
        ...concert,
        image: concert.image?.includes(environment.apiUrl)
          ? concert.image
          : environment.apiUrl +
            (concert.image || '/profile-pictures/bikini.jpg'),
        is_attending: this.userAttendingConcerts.includes(concert.id),
      }));
      this.popular = await this.concertsService.getPopularConcerts();
      this.popular = this.popular.map((concert) => ({
        ...concert,
        image: concert.image?.includes(environment.apiUrl)
          ? concert.image
          : environment.apiUrl +
            (concert.image || '/profile-pictures/bikini.jpg'),
      }));
    }

    this.cd.detectChanges();
  }

  async ngOnInit() {
    this.cd.detectChanges();

    window.addEventListener('user-updated', () => {
      this.ionViewWillEnter();
    });
  }

  openLogin() {
    this.router.navigate(['/login']);
  }
}
