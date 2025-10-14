import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
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
import { environment } from 'src/environments/environment.prod';

declare const google: any;
declare const gapi: any;

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

  private tokenClient: any = null;
  private gapiLoaded = false;
  private accessToken: string | null = null;

  constructor(private modalController: ModalController) {}

  async ngOnInit() {
    await this.loadGisScript();
    this.initTokenClient();
    await this.loadGapiClient();
  }

  private async loadGisScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('gisScript')) return resolve();

      const script = document.createElement('script');
      script.id = 'gisScript';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  }

  private initTokenClient() {
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: environment.googleClientId,
      scope: 'https://www.googleapis.com/auth/calendar.events',
      callback: (tokenResponse: any) => {
        this.accessToken = tokenResponse.access_token;
        this.insertEventToCalendar();
      },
    });
  }

  private async loadGapiClient(): Promise<void> {
    return new Promise((resolve) => {
      gapi.load('client', async () => {
        await gapi.client.init({
          apiKey: environment.calendarApiKey,
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
          ],
        });
        this.gapiLoaded = true;
        resolve();
      });
    });
  }

  addToCalendar() {
    const isMobile = Capacitor.getPlatform() === 'android';

    if (isMobile) {
      if (!this.concert) return;

      const title = encodeURIComponent(this.concert.title);
      const details = encodeURIComponent(this.concert.description || '');
      const location = encodeURIComponent(
        `${this.concert.venue_name}, ${this.concert.city_name}`
      );

      const start = new Date(this.concert.date);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

      const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');

      const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${formatDate(
        start
      )}/${formatDate(end)}`;

      Browser.open({ url });
    } else {
      if (!this.tokenClient) {
        alert('Google OAuth not ready yet. Please try again.');
        return;
      }
      this.tokenClient.requestAccessToken({ prompt: '' });
    }
  }

  private async insertEventToCalendar() {
    if (!this.gapiLoaded || !this.accessToken) return;

    gapi.client.setToken({ access_token: this.accessToken });

    const event = {
      summary: this.concert.title,
      description: this.concert.description || 'Concert event',
      location: `${this.concert.venue_name}, ${this.concert.city_name}`,
      start: {
        dateTime: new Date(this.concert.date),
        timeZone: 'Europe/Budapest',
      },
      end: {
        dateTime: new Date(
          new Date(this.concert.date).getTime() + 2 * 60 * 60 * 1000
        ).toISOString(),
        timeZone: 'Europe/Budapest',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 24 * 60 },
        ],
      },
    };

    try {
      const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
      alert('🎉 Event added to your Google Calendar!');
      console.log('Event created:', response);
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Failed to add event. Check console for details.');
    }
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
    this.modalController.dismiss();
  }
}
