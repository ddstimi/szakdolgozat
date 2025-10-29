import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import {
  Chart,
  RadarController,
  PointElement,
  ArcElement,
  RadialLinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  LineElement,
} from 'chart.js';
import { ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { IonicSlides, ActionSheetController } from '@ionic/angular';
import { Swiper } from 'swiper/types';
import { frontendService, Concert } from 'src/app/services/frontendService';
import { environment } from 'src/environments/environment.prod';
import { Router } from '@angular/router';

Chart.register(
  RadarController,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

@Component({
  selector: 'app-event-page',
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class EventsPage implements OnInit, AfterViewInit {
  @ViewChild('genreRadarChart', { static: false }) genreRadarChartCanvas:
    | ElementRef
    | undefined;
  @ViewChild('locationRadarChart', { static: false }) locationRadarChartCanvas:
    | ElementRef
    | undefined;
  @ViewChild('artistRadarChart', { static: false }) artistRadarChartCanvas:
    | ElementRef
    | undefined;

  swiperModules = [IonicSlides];
  selectedChart: string = 'genre';
  selectedInterval = 'all';
  totalConcerts = 0;

  chartDescriptions: string[] = [];
  upcoming: Concert[] = [];
  past: Concert[] = [];
  filteredPast: Concert[] = [];

  filteredEvents: Event[] = [];
  genreData: { [key: string]: number } = {};
  locationData: { [key: string]: number } = {};
  artistData: { [key: string]: number } = {};

  private genreChart: Chart | undefined;
  private locationChart: Chart | undefined;
  private artistChart: Chart | undefined;

  constructor(
    private frontendService: frontendService,
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    let token = this.frontendService.getToken();

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const newToken = await this.frontendService.refreshAccessToken();
    if (!newToken) {
      this.router.navigate(['/login']);
      return;
    }
    this.updateStatistics();
    this.upcoming = await this.frontendService.getUpcomingByUser();
    this.upcoming = this.upcoming.map((concert) => {
      return {
        ...concert,
        image: concert.image?.includes(environment.apiUrl)
          ? concert.image
          : environment.apiUrl +
            (concert.image || '/profile-pictures/bikini.jpg'),
      };
    });
    this.past = await this.frontendService.getPastByUser();
    this.past = this.past.map((concert) => {
      return {
        ...concert,
        image: concert.image?.includes(environment.apiUrl)
          ? concert.image
          : environment.apiUrl +
            (concert.image || '/profile-pictures/bikini.jpg'),
      };
    });
    this.selectedInterval = 'all';
    this.applyIntervalFilter();
    this.cd.detectChanges();
  }

  async ionViewWillEnter() {
    this.cd.detectChanges();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (
        this.genreRadarChartCanvas &&
        this.locationRadarChartCanvas &&
        this.artistRadarChartCanvas
      ) {
        this.createRadarCharts();
      }
    }, 0);
  }

  async markNotGoing(concert: Concert) {
    try {
      const res = await this.frontendService.attendConcert(concert.id);
      // your backend returns { attending: boolean }
      if (!res.attending) {
        this.upcoming = this.upcoming.filter((c) => c.id !== concert.id);
      }
    } catch (e) {
      console.error('Failed to toggle attendance', e);
    }
  }

  openTickets(concert: Concert) {
    if (concert.ticket_url) {
      window.open(concert.ticket_url, '_blank');
    }
  }

  openDirections(concert: Concert) {
    // simple Google Maps query with city + venue
    const q = encodeURIComponent(`${concert.venue_name}, ${concert.city_name}`);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${q}`,
      '_blank'
    );
  }

  async addToCalendar(concert: Concert) {
    // create an ICS file and trigger download
    const starts = new Date(concert.date);
    // assume 2-hour default duration
    const ends = new Date(starts.getTime() + 2 * 60 * 60 * 1000);
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    const fmt = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(
        d.getUTCDate()
      )}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//YourApp//Concerts//EN
BEGIN:VEVENT
UID:${concert.id}@yourapp
DTSTAMP:${fmt(new Date())}
DTSTART:${fmt(starts)}
DTEND:${fmt(ends)}
SUMMARY:${concert.title}
LOCATION:${concert.venue_name}, ${concert.city_name}
DESCRIPTION:${concert.description ?? ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${concert.title.replace(/\s+/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async openUpcomingActions(concert: Concert) {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Event options',
      cssClass: 'action-sheet',
      buttons: [
        {
          text: "I'm not going",
          role: 'destructive',
          icon: 'close-circle-outline',
          handler: () => this.markNotGoing(concert),
        },
        {
          text: 'Add to Calendar',
          icon: 'calendar-outline',
          handler: () => this.addToCalendar(concert),
        },
        {
          text: 'Directions',
          icon: 'navigate-outline',
          handler: () => this.openDirections(concert),
        },
        {
          text: 'Open tickets',
          icon: 'pricetag-outline',
          handler: () => this.openTickets(concert),
        },
        {
          text: 'Share',
          icon: 'share-social-outline',
          handler: () => this.shareConcert(concert),
        },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  shareConcert(concert: Concert) {
    const url = concert.ticket_url || document.location.href;
    const text = `${concert.title} — ${concert.city_name} • ${
      concert.venue_name
    } on ${new Date(concert.date).toLocaleDateString()}`;
    if (navigator.share) {
      navigator.share({ title: concert.title, text, url }).catch(() => {});
    } else {
      // fallback: copy link
      navigator.clipboard?.writeText(url);
    }
  }

  getDaysUntil(dateIso: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateIso);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
  async updateStatistics() {
    try {
      const data = await this.frontendService.getEventStatistics(
        this.selectedInterval as any
      );

      this.totalConcerts = data.totalConcerts;

      this.genreData = data.genreData;
      this.artistData = data.artistData;
      this.locationData = data.locationData;

      this.chartDescriptions = data.insights?.slides || [];

      this.activeSlideIndex = 0;

      this.createRadarCharts();
    } catch (e) {
      console.error('Failed to load event statistics', e);
    }
  }

  getIntervalStartDate() {
    const now = new Date();
    switch (this.selectedInterval) {
      case '6months':
        return new Date(now.setMonth(now.getMonth() - 6));
      case '1year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(0);
    }
  }

  updateRadarData(concerts: Concert[]) {
    this.genreData = {};
    this.locationData = {};
    this.artistData = {};

    concerts.forEach((concert) => {
      concert.genre?.split(',').forEach((genre) => {
        genre = genre.trim();
        if (!genre) return;
        this.genreData[genre] = (this.genreData[genre] || 0) + 1;
      });

      if (concert.venue_name) {
        this.locationData[concert.venue_name] =
          (this.locationData[concert.venue_name] || 0) + 1;
      }

      if (concert.artist_name) {
        this.artistData[concert.artist_name] =
          (this.artistData[concert.artist_name] || 0) + 1;
      }
    });
  }

  applyIntervalFilter() {
    const intervalStart = this.getIntervalStartDate();
    this.filteredPast = this.past.filter(
      (concert) => new Date(concert.date) >= intervalStart
    );

    this.totalConcerts = this.filteredPast.length;
    this.updateRadarData(this.filteredPast);
    this.createRadarCharts();
  }

  onIntervalChange(newInterval: string) {
    this.selectedInterval = newInterval;
    this.applyIntervalFilter();
  }
  createRadarCharts() {
    if (
      !this.genreRadarChartCanvas ||
      !this.locationRadarChartCanvas ||
      !this.artistRadarChartCanvas
    )
      return;

    this.genreChart?.destroy();
    this.locationChart?.destroy();
    this.artistChart?.destroy();

    this.genreChart = this.createChart(
      this.genreRadarChartCanvas.nativeElement,
      'Genres ',
      this.genreData,
      'rgba(255, 99, 132, 0.6)',
      'rgba(255, 99, 132, 1)'
    );
    this.locationChart = this.createChart(
      this.locationRadarChartCanvas.nativeElement,
      'Locations ',
      this.locationData,
      'rgba(74, 195, 144, 0.5)',
      'rgb(74, 195, 144)'
    );
    this.artistChart = this.createChart(
      this.artistRadarChartCanvas.nativeElement,
      'Artists ',
      this.artistData,
      'rgb(180, 89, 255, 0.5)',
      'rgb(180, 89, 255)'
    );
  }

  private createChart(
    canvas: any,
    label: string,
    dataObj: { [key: string]: number },
    bgColor: string,
    borderColor: string
  ): Chart {
    const labels = Object.keys(dataObj);
    const values = labels.map((label) => dataObj[label]);

    return new Chart(canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label,
            data: values,
            fill: 'origin',
            backgroundColor: bgColor,
            borderColor,
            pointBackgroundColor: borderColor,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: borderColor,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { color: '#fff' } },
          title: { display: false },
        },
        scales: {
          r: {
            beginAtZero: true,
            grid: { color: '#afafaf' },
            angleLines: { color: '#ddd' },
            pointLabels: { color: '#fff', font: { size: 13 } },
            ticks: {
              color: '#fff',
              backdropColor: 'rgba(255, 255, 255, 0.03)',
            },
          },
        },
      },
    });
  }

  activeSlideIndex = 0;
  swiperInstance!: Swiper;

  @ViewChild('swiper')
  swiperRef: ElementRef | undefined;

  onSlideChange() {
    this.activeSlideIndex = this.swiperRef?.nativeElement.swiper.activeIndex;
  }
}
