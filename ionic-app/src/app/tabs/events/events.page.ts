import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { IonicModule, ActionSheetController } from '@ionic/angular';
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
import { IonicSlides } from '@ionic/angular';
import { Swiper } from 'swiper/types';
import { SessionService } from 'src/app/services/session.service';
import { Concert, ConcertsService } from 'src/app/services/concert.service';
import { environment } from 'src/environments/environment.prod';
import { Router } from '@angular/router';
import { CalendarService } from 'src/app/services/calendar.service';
import { AuthService } from 'src/app/services/auth.service';

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
  @ViewChild('genreRadarChart', { static: false })
  genreRadarChartCanvas?: ElementRef;
  @ViewChild('locationRadarChart', { static: false })
  locationRadarChartCanvas?: ElementRef;
  @ViewChild('artistRadarChart', { static: false })
  artistRadarChartCanvas?: ElementRef;

  swiperModules = [IonicSlides];
  selectedChart = 'genre';
  selectedInterval = 'all';
  totalConcerts = 0;

  chartDescriptions: string[] = [];
  upcoming: Concert[] = [];
  past: Concert[] = [];
  filteredPast: Concert[] = [];

  genreData: Record<string, number> = {};
  locationData: Record<string, number> = {};
  artistData: Record<string, number> = {};

  private genreChart?: Chart;
  private locationChart?: Chart;
  private artistChart?: Chart;

  activeSlideIndex = 0;
  @ViewChild('swiper') swiperRef?: ElementRef;

  constructor(
    private sessionService: SessionService,
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
    private cd: ChangeDetectorRef,
    private calendarService: CalendarService,
    private concertService: ConcertsService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.cd.detectChanges();

    const token = this.sessionService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const newToken = await this.authService.refreshAccessToken();
    if (!newToken) {
      this.router.navigate(['/login']);
      return;
    }

    await this.updateStatistics();

    this.upcoming = (await this.concertService.getUpcomingByUser()).map(
      (concert) => ({
        ...concert,
        image: concert.image?.includes(environment.apiUrl)
          ? concert.image
          : environment.apiUrl +
            (concert.image || '/profile-pictures/bikini.jpg'),
      })
    );

    this.past = (await this.concertService.getPastByUser()).map((concert) => ({
      ...concert,
      image: concert.image?.includes(environment.apiUrl)
        ? concert.image
        : environment.apiUrl +
          (concert.image || '/profile-pictures/bikini.jpg'),
    }));

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
    this.cd.detectChanges();
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
          handler: () => this.calendarService.addToBrowserCalendar(concert),
        },
        {
          text: 'Add to Google Calendar',
          icon: 'logo-google',
          handler: () => this.calendarService.addToGoogleCalendar(concert),
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
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
    this.cd.detectChanges();
  }

  async markNotGoing(concert: Concert) {
    try {
      const res = await this.concertService.attendConcert(concert.id);
      if (!res.attending) {
        this.upcoming = this.upcoming.filter((c) => c.id !== concert.id);
      }
    } catch (e) {
      console.error('Failed to toggle attendance', e);
    }
    this.cd.detectChanges();
  }

  openTickets(concert: Concert) {
    if (concert.ticket_url) {
      window.open(concert.ticket_url, '_blank');
    }
  }

  openDirections(concert: Concert) {
    const q = encodeURIComponent(`${concert.venue_name}, ${concert.city_name}`);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${q}`,
      '_blank'
    );
  }

  async updateStatistics() {
    try {
      const data = await this.concertService.getEventStatistics(
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

  applyIntervalFilter() {
    const intervalStart = this.getIntervalStartDate();
    this.filteredPast = this.past.filter(
      (concert) => new Date(concert.date) >= intervalStart
    );
    this.totalConcerts = this.filteredPast.length;
    this.updateRadarData(this.filteredPast);
    this.createRadarCharts();
  }

  updateRadarData(concerts: Concert[]) {
    this.genreData = {};
    this.locationData = {};
    this.artistData = {};

    concerts.forEach((concert) => {
      concert.genre?.split(',').forEach((genre) => {
        const g = genre.trim();
        if (!g) return;
        this.genreData[g] = (this.genreData[g] || 0) + 1;
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

  createRadarCharts() {
    if (
      !this.genreRadarChartCanvas ||
      !this.locationRadarChartCanvas ||
      !this.artistRadarChartCanvas
    ) {
      return;
    }

    this.genreChart?.destroy();
    this.locationChart?.destroy();
    this.artistChart?.destroy();

    this.genreChart = this.createChart(
      this.genreRadarChartCanvas.nativeElement,
      'Genres',
      this.genreData,
      'rgba(255, 99, 132, 0.6)',
      'rgba(255, 99, 132, 1)'
    );
    this.locationChart = this.createChart(
      this.locationRadarChartCanvas.nativeElement,
      'Locations',
      this.locationData,
      'rgba(74, 195, 144, 0.5)',
      'rgb(74, 195, 144)'
    );
    this.artistChart = this.createChart(
      this.artistRadarChartCanvas.nativeElement,
      'Artists',
      this.artistData,
      'rgb(180, 89, 255, 0.5)',
      'rgb(180, 89, 255)'
    );
  }

  private createChart(
    canvas: any,
    label: string,
    dataObj: Record<string, number>,
    bgColor: string,
    borderColor: string
  ): Chart {
    const labels = Object.keys(dataObj);
    const values = labels.map((l) => dataObj[l]);

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

  onSlideChange() {
    this.activeSlideIndex = this.swiperRef?.nativeElement.swiper.activeIndex;
  }

  getDaysUntil(dateIso: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateIso);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
}
