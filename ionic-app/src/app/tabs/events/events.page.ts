import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
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

import { IonicSlides } from '@ionic/angular';
import { Swiper } from 'swiper/types';
import { frontendService, Concert } from 'src/app/services/frontendService';
import { environment } from 'src/environments/environment.prod';

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

  constructor(private frontendService: frontendService) {}

  async ngOnInit() {
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

  updateStatistics() {
    const intervalStart = this.getIntervalStartDate();

    this.filteredPast = this.past.filter(
      (concert) => new Date(concert.date) >= intervalStart
    );
    this.totalConcerts = this.filteredPast.length;

    this.updateRadarData(this.filteredPast);
    this.createRadarCharts();

    this.chartDescriptions[0].personalizedText = `You're in the top 8% for Pop lovers.`;
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

  chartDescriptions = [
    {
      staticText:
        'Your preferred genre was Pop based on your listening history.You clearly enjoy lyrical flow and urban vibes.',
      personalizedText: 'You’re in the top 8% for Pop lovers.',
    },
    {
      staticText:
        'Your favorite artist is Korda György és Balázs Klári. They started in 999BC and typically play Rap, House and Techno.',
      personalizedText: 'You’re in the top 1% of fans.',
    },
    {
      staticText: 'Concert location you’ve visited the most was Berlin.',
      personalizedText: 'You attend shows in Berlin more than 90% of users.',
    },
  ];

  @ViewChild('swiper')
  swiperRef: ElementRef | undefined;

  onSlideChange() {
    this.activeSlideIndex = this.swiperRef?.nativeElement.swiper.activeIndex;
  }
}
