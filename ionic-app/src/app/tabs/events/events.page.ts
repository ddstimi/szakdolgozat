import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Chart, RadarController, PointElement, ArcElement, RadialLinearScale, CategoryScale, Title, Tooltip, Legend, LineElement } from 'chart.js';
import { ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { IonicSlides } from '@ionic/angular';

Chart.register(RadarController, PointElement, LineElement, ArcElement, RadialLinearScale, CategoryScale, Title, Tooltip, Legend);

interface Event {
  title: string;
  date: string;
  location: string;
  genres: string[];
  locationName: string;
  artists?: string[];
}

@Component({
  selector: 'app-event-page',
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], 
})
export class EventsPage implements OnInit, AfterViewInit {
  @ViewChild('genreRadarChart', { static: false }) genreRadarChartCanvas: ElementRef | undefined;
  @ViewChild('locationRadarChart', { static: false }) locationRadarChartCanvas: ElementRef | undefined;
  @ViewChild('artistRadarChart', { static: false }) artistRadarChartCanvas: ElementRef | undefined;

  swiperModules = [IonicSlides];
  selectedChart: string = 'genre';
  selectedInterval = 'all';  
  totalConcerts = 0;

  events: Event[] = [
    { title: 'Rocking Budapest After Midnight', date: '2025-04-01', location: 'Budapest, Akvárium Klub', genres: ['Rock'], locationName: 'Budapest', artists: ['Band A'] },
    { title: 'Arctic Monkeys Live', date: '2025-03-15', location: 'Budapest, A38', genres: ['Pop'], locationName: 'Hungary', artists: ['Arctic Monkeys'] },
    { title: 'Jazz Concert', date: '2024-09-01', location: 'Szeged, JATE Klub', genres: ['Jazz'], locationName: 'New York', artists: ['Jazzman'] },
    { title: 'Metallica', date: '2024-12-01', location: 'Szeged, Hungi', genres: ['Rock'], locationName: 'Los Angeles', artists: ['Metallica'] },
    { title: 'Korda Gyuri és Balázs Klári esti vigadás', date: '2023-07-15', location: 'Szeged, Nyugi kert', genres: ['Pop'], locationName: 'Berlin', artists: ['Korda György', 'Balázs Klári'] },
    { title: 'Pop Concert', date: '2023-07-15', location: 'Budapest, Budapest Park', genres: ['HipHop'], locationName: 'Berlin', artists: ['Rapper'] },
    { title: 'Pop Concert', date: '2023-07-15', location: 'Szeged, JATE Klub', genres: ['Metal'], locationName: 'Berlin', artists: ['Metal Band'] },
    { title: 'Rocking Budapest After Midnight', date: '2025-04-01', location: 'Budapest, Akvárium Klub', genres: ['Rock'], locationName: 'Budapest', artists: ['Band A'] },
    { title: 'Arctic Monkeys Live', date: '2025-03-15', location: 'Budapest, A38', genres: ['Pop'], locationName: 'Hungary', artists: ['Arctic Monkeys'] },
    { title: 'Jazz Concert', date: '2024-09-01', location: 'Szeged, JATE Klub', genres: ['Jazz'], locationName: 'New York', artists: ['Jazzman'] },
    { title: 'Metallica', date: '2024-12-01', location: 'Szeged, Hungi', genres: ['Rock'], locationName: 'Los Angeles', artists: ['Metallica'] },
    { title: 'Korda Gyuri és Balázs Klári esti vigadás', date: '2023-07-15', location: 'Szeged, Nyugi kert', genres: ['Pop'], locationName: 'Berlin', artists: ['Korda György', 'Balázs Klári'] },
    { title: 'Korda Gyuri és Balázs Klári esti vigadás', date: '2023-07-15', location: 'Szeged, Nyugi kert', genres: ['Pop'], locationName: 'Berlin', artists: ['Korda György', 'Balázs Klári'] },
    { title: 'Korda Gyuri és Balázs Klári esti vigadás', date: '2023-07-15', location: 'Szeged, Nyugi kert', genres: ['Pop'], locationName: 'Berlin', artists: ['Korda György', 'Balázs Klári'] },
    { title: 'Pop Concert', date: '2023-07-15', location: 'Budapest, Budapest Park', genres: ['HipHop'], locationName: 'Berlin', artists: ['Rapper'] },
    { title: 'Pop Concert', date: '2023-07-15', location: 'Szeged, JATE Klub', genres: ['Metal'], locationName: 'Berlin', artists: ['Metal Band'] },
  
  ];

  filteredEvents: Event[] = [];
  genreData: { [key: string]: number } = {};
  locationData: { [key: string]: number } = {};
  artistData: { [key: string]: number } = {};

  private genreChart: Chart | undefined;
  private locationChart: Chart | undefined;
  private artistChart: Chart | undefined;

  constructor() {}

  ngOnInit() {
    this.updateStatistics();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.genreRadarChartCanvas && this.locationRadarChartCanvas && this.artistRadarChartCanvas) {
        this.createRadarCharts();
      }
    }, 0);
  }

  updateStatistics() {
    const intervalStart = this.getIntervalStartDate();

    this.filteredEvents = this.events.filter(event => new Date(event.date) >= intervalStart);
    this.totalConcerts = this.filteredEvents.length;

    this.updateRadarData();
    this.createRadarCharts();
  }

  getIntervalStartDate() {
    const now = new Date();
    switch (this.selectedInterval) {
      case '6months': return new Date(now.setMonth(now.getMonth() - 6));
      case '1year': return new Date(now.setFullYear(now.getFullYear() - 1));
      default: return new Date(0);
    }
  }

  updateRadarData() {
    this.genreData = {};
    this.locationData = {};
    this.artistData = {};

    this.filteredEvents.forEach(event => {
      event.genres.forEach(genre => {
        this.genreData[genre] = (this.genreData[genre] || 0) + 1;
      });

      this.locationData[event.locationName] = (this.locationData[event.locationName] || 0) + 1;

      event.artists?.forEach(artist => {
        this.artistData[artist] = (this.artistData[artist] || 0) + 1;
      });
    });
  }

  createRadarCharts() {
    if (!this.genreRadarChartCanvas || !this.locationRadarChartCanvas || !this.artistRadarChartCanvas) return;

    this.genreChart?.destroy();
    this.locationChart?.destroy();
    this.artistChart?.destroy();

    this.genreChart = this.createChart(this.genreRadarChartCanvas.nativeElement, 'Genres Attended', this.genreData, 'rgba(255, 99, 132, 0.6)', 'rgba(255, 99, 132, 1)');
    this.locationChart = this.createChart(this.locationRadarChartCanvas.nativeElement, 'Locations Attended', this.locationData, 'rgba(74, 195, 144, 0.5)', 'rgb(74, 195, 144)');
    this.artistChart = this.createChart(this.artistRadarChartCanvas.nativeElement, 'Artists Attended', this.artistData, 'rgb(180, 89, 255, 0.5)', 'rgb(180, 89, 255)');
  }

  private createChart(canvas: any, label: string, dataObj: { [key: string]: number }, bgColor: string, borderColor: string): Chart {
    const labels = Object.keys(dataObj);
    const values = labels.map(label => dataObj[label]);

    return new Chart(canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label,
          data: values,
          fill: 'origin',
          backgroundColor: bgColor,
          borderColor,
          pointBackgroundColor: borderColor,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: borderColor
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { color: '#fff' } },
          title: { display: false }
        },
        scales: {
          r: {
            beginAtZero: true,
            grid: { color: '#afafaf' },
            angleLines: { color: '#ddd' },
            pointLabels: { color: '#fff', font: { size: 13 } },
            ticks: { color: '#fff' }
          }
        }
      }
    });
  }
}