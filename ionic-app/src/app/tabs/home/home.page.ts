import { CommonModule, NgFor } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonInfiniteScroll, IonInfiniteScrollContent, IonSegment, IonSegmentButton, IonGrid, IonRow, IonCol, IonLabel } from '@ionic/angular/standalone';
import { ConcertCardComponent } from 'src/app/components/concert-card/concert-card.component';

@Component({
  selector: 'home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonLabel, IonCol, IonRow, IonGrid, IonSegmentButton, IonSegment, IonContent,ConcertCardComponent,IonInfiniteScrollContent, IonInfiniteScroll, IonHeader, IonToolbar, IonTitle, IonContent,CommonModule,NgFor],
})
export class HomePage {
  concerts = [
    {
      title: 'Coldplay - Music of the Spheres Tour',
      date: '2025-06-12',
      location: 'Budapest, Hungary',
      image: 'assets/images/asd.jpg'
    },
    {
      title: 'Arctic Monkeys Live',
      date: '2025-07-18',
      location: 'Vienna, Austria',
      image: 'assets/images/asd.jpg'
    },
    {
      title: 'Arctic Monkeys Live',
      date: '2025-07-18',
      location: 'Vienna, Austria',
      image: 'assets/images/asd.jpg'
    },
    {
      title: 'Arctic Monkeys Live',
      date: '2025-07-18',
      location: 'Vienna, Austria',
      image: 'assets/images/asd.jpg'
    },
    {
      title: 'Arctic Monkeys Live',
      date: '2025-07-18',
      location: 'Vienna, Austria',
      image: 'assets/images/asd.jpg'
    }
  ];
  /*@ViewChild('fyContent', { static: false }) fyContent!: ElementRef;

  ngAfterViewInit() {
    // Ensure the element is found before accessing it
    if (!this.fyContent) {
      console.error('fyContent is not found in the DOM!');
      return;
    }

    const container = this.fyContent.nativeElement;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    // For mouse dragging to scroll
    container.addEventListener('mousedown', (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    });

    container.addEventListener('mouseleave', () => {
      isDown = false;
    });

    container.addEventListener('mouseup', () => {
      isDown = false;
    });

    container.addEventListener('mousemove', (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2; // Adjust scrolling speed
      container.scrollLeft = scrollLeft - walk;
    });

    // For touch events (for mobile)
    let touchStartX: number;
    let touchStartScrollLeft: number;

    container.addEventListener('touchstart', (e: TouchEvent) => {
      isDown = true;
      touchStartX = e.touches[0].pageX - container.offsetLeft;
      touchStartScrollLeft = container.scrollLeft;
    });

    container.addEventListener('touchend', () => {
      isDown = false;
    });

    container.addEventListener('touchmove', (e: TouchEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.touches[0].pageX - container.offsetLeft;
      const walk = (x - touchStartX) * 2; // Adjust scrolling speed
      container.scrollLeft = touchStartScrollLeft - walk;
    });
  }*/
  constructor() {}
}
