import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  IonCard,
  IonImg,
  IonCardTitle,
  IonCardHeader,
  IonCardSubtitle,
  IonCardContent,
  IonChip,
  IonLabel,
} from '@ionic/angular/standalone';
import { ConcertsService, Concert } from 'src/app/services/concertService';
import { CalendarService } from 'src/app/services/calendarService';

@Component({
  selector: 'app-concert-details',
  templateUrl: './concert-details.page.html',
  styleUrls: ['./concert-details.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonLabel,
    IonChip,
    IonCardContent,
    IonCardSubtitle,
    IonCardHeader,
    IonCardTitle,
    IonImg,
    IonCard,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
  ],
})
export class ConcertDetailsPage implements OnInit {
  @Input() concert: any;

  attending = false;

  constructor(
    private modalController: ModalController,
    private calendarService: CalendarService,
    private concertsService: ConcertsService
  ) {}

  async ngOnInit() {
    this.attending = !!this.concert?.is_attending;
  }

  async toggleAttend() {
    if (!this.concert?.id) return;

    try {
      const res = await this.concertsService.attendConcert(this.concert.id);
      this.attending = res.attending;
      this.concert.is_attending = res.attending;
      window.dispatchEvent(new CustomEvent('upcoming:changed'));
    } catch (err) {
      console.error('Failed to update attendance', err);
      alert('Failed to update attendance. Try again.');
    }
  }

  addToCalendar() {
    if (!this.concert) return;
    this.calendarService.addToBrowserCalendar(this.concert);
  }

  viewOnMap() {
    if (!this.concert) return;

    const query = encodeURIComponent(
      `${this.concert.city_name},+${this.concert.venue_name}`
    );

    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_system');
  }

  closeModal() {
    this.modalController.dismiss({
      attending: this.attending,
      concertId: this.concert.id,
    });
  }
}
