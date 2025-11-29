import { Injectable } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { environment } from '../../environments/environment.prod';
import { Concert } from './concertService';

declare const google: any;
declare const gapi: any;

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private gisLoaded = false;
  private gapiLoaded = false;
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private gisPromise?: Promise<void>;
  private gapiPromise?: Promise<void>;

  async addToBrowserCalendar(concert: Concert | any): Promise<void> {
    if (!concert) return;

    const title = encodeURIComponent(concert.title);
    const details = encodeURIComponent(concert.description || '');
    const location = encodeURIComponent(
      `${concert.venue_name}, ${concert.city_name}`
    );

    const start = new Date(concert.date);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');

    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${formatDate(
      start
    )}/${formatDate(end)}`;

    await Browser.open({ url });
  }

  async addToGoogleCalendar(concert: Concert | any): Promise<void> {
    if (!concert || !environment.googleClientId) return;

    await this.ensureGisLoaded();
    await this.ensureGapiLoaded();

    if (!this.tokenClient) {
      this.initTokenClient();
    }

    if (!this.tokenClient) return;

    this.tokenClient.requestAccessToken({ prompt: '' });

    const start = Date.now();
    while (!this.accessToken && Date.now() - start < 5000) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (!this.accessToken || !this.gapiLoaded) return;

    await this.insertEventToCalendar(concert);
  }

  private async ensureGisLoaded(): Promise<void> {
    if (this.gisLoaded) return;
    if (this.gisPromise) return this.gisPromise;

    this.gisPromise = new Promise<void>((resolve, reject) => {
      if (document.getElementById('gisScript')) {
        this.gisLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'gisScript';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.gisLoaded = true;
        resolve();
      };
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });

    return this.gisPromise;
  }

  private async ensureGapiLoaded(): Promise<void> {
    if (this.gapiLoaded) return;
    if (this.gapiPromise) return this.gapiPromise;

    this.gapiPromise = new Promise<void>((resolve) => {
      if (!(window as any).gapi) {
        resolve();
        return;
      }
      gapi.load('client', async () => {
        await gapi.client.init({
          apiKey: environment.calendarApiKey || '',
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
          ],
        });
        this.gapiLoaded = true;
        resolve();
      });
    });

    return this.gapiPromise;
  }

  private initTokenClient() {
    if (!environment.googleClientId || !google?.accounts?.oauth2) return;

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: environment.googleClientId,
      scope: 'https://www.googleapis.com/auth/calendar.events',
      callback: (tokenResponse: any) => {
        this.accessToken = tokenResponse.access_token;
      },
    });
  }

  private async insertEventToCalendar(concert: Concert | any): Promise<void> {
    if (!this.gapiLoaded || !this.accessToken) return;

    gapi.client.setToken({ access_token: this.accessToken });

    const event = {
      summary: concert.title,
      description: concert.description || 'Concert event',
      location: `${concert.venue_name}, ${concert.city_name}`,
      start: {
        dateTime: new Date(concert.date).toISOString(),
        timeZone: 'Europe/Budapest',
      },
      end: {
        dateTime: new Date(
          new Date(concert.date).getTime() + 2 * 60 * 60 * 1000
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

    await gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
  }
}
