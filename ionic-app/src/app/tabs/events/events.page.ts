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
}

@Component({
  selector: 'app-event-page',
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Ensure you import necessary Ionic components

})
export class EventsPage implements OnInit, AfterViewInit {
  @ViewChild('genreRadarChart', { static: false }) genreRadarChartCanvas: ElementRef | undefined;
  @ViewChild('locationRadarChart', { static: false }) locationRadarChartCanvas: ElementRef | undefined;
  @ViewChild('swiper')swiperRef: ElementRef | undefined;

  swiperModules = [IonicSlides];
  selectedChart: string = 'genre';
  events: Event[] = [
    { title: 'Rock Concert', date: '2025-04-01', location: 'Budapest', genres: ['Rock'], locationName: 'Budapest' },
    { title: 'Pop Concert', date: '2025-03-15', location: 'Hungary', genres: ['Pop'], locationName: 'Hungary' },
    { title: 'Jazz Concert', date: '2024-09-01', location: 'New York', genres: ['Jazz'], locationName: 'New York' },
    { title: 'Rock Concert', date: '2024-12-01', location: 'Los Angeles', genres: ['Rock'], locationName: 'Los Angeles' },
    { title: 'Pop Concert', date: '2023-07-15', location: 'Berlin', genres: ['Pop'], locationName: 'Berlin' },
    { title: 'Pop Concert', date: '2023-07-15', location: 'Berlin', genres: ['HipHop'], locationName: 'Berlin' },
    { title: 'Pop Concert', date: '2023-07-15', location: 'Berlin', genres: ['Metal'], locationName: 'Berlin' },

  ];

  private genreChart: Chart | undefined;
  private locationChart: Chart | undefined;
  

  selectedInterval = 'all';  // Default selected interval
  totalConcerts = 0;
  filteredEvents: Event[] = [];
  genreData: { [key: string]: number } = {};
  locationData: { [key: string]: number } = {};

  constructor() {}

  ngOnInit() {
    this.updateStatistics();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.genreRadarChartCanvas && this.locationRadarChartCanvas) {
        this.createRadarCharts();
      }
    }, 0); // Let Angular finish rendering
  }

  slideToChart() {

  }

  async onSlideChanged() {

  }

  // Function to update the statistics based on the selected interval
  updateStatistics() {
    const intervalStart = this.getIntervalStartDate();

    // Filter events based on the selected interval
    this.filteredEvents = this.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= intervalStart;
    });

    // Update total concerts attended
    this.totalConcerts = this.filteredEvents.length;

    // Update genre and location statistics
    this.updateRadarData();
    this.createRadarCharts();
  }

  // Function to get the start date based on the selected interval
  getIntervalStartDate() {
    const now = new Date();
    switch (this.selectedInterval) {
      case '6months':
        return new Date(now.setMonth(now.getMonth() - 6));
      case '1year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      case 'all':
        return new Date(0);  // No date limit
      default:
        return new Date();
    }
  }

  // Function to update radar chart data for genres and locations
  updateRadarData() {
    this.genreData = {};
    this.locationData = {};

    this.filteredEvents.forEach(event => {
      event.genres.forEach((genre: string) => {
        this.genreData[genre] = (this.genreData[genre] || 0) + 1;
      });
      this.locationData[event.locationName] = (this.locationData[event.locationName] || 0) + 1;
    });
  }

  // Create Radar Charts for Genre and Location data
  createRadarCharts() {
    if (!this.genreRadarChartCanvas || !this.locationRadarChartCanvas) return;
  
    // DESTROY existing charts if they exist
    if (this.genreChart) {
      this.genreChart.destroy();
    }
    if (this.locationChart) {
      this.locationChart.destroy();
    }
  
    // Genre Radar Chart
    const genreLabels = Object.keys(this.genreData);
    const genreValues = genreLabels.map(genre => this.genreData[genre]);
  
    this.genreChart = new Chart(this.genreRadarChartCanvas.nativeElement, {
      type: 'radar',
      data: {
        labels: genreLabels,
        datasets: [{
          label: 'Genres Attended',
          data: genreValues,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: false }
        },
        scales: {
          r: {
            beginAtZero: true,
            suggestedMax: Math.max(...genreValues, 1) + 1,
            angleLines: { color: '#ddd' },
        grid: { color: '#eee' },
        pointLabels: {
        font: {
                size: 13
        },
        }
          
      }
        },
        
      }
    });
  
    // Location Radar Chart
    const locationLabels = Object.keys(this.locationData);
    const locationValues = locationLabels.map(location => this.locationData[location]);
  
    this.locationChart = new Chart(this.locationRadarChartCanvas.nativeElement, {
      type: 'radar',
      data: {
        labels: locationLabels,
        datasets: [{
          label: 'Locations Attended',
          data: locationValues,
          backgroundColor: 'rgba(53, 162, 235, 0.2)',
          borderColor: 'rgba(53, 162, 235, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: false }
        },
        scales: {
          r: {
            beginAtZero: true,
            suggestedMax: Math.max(...locationValues, 1) + 1
          }
        }
      }
    });
  }
  
}
