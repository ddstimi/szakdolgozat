import { CommonModule, NgFor } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import {  Router, RouterModule } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonInfiniteScroll, IonInfiniteScrollContent, IonSegment, IonSegmentButton, IonGrid, IonRow, IonCol, IonLabel, IonButton } from '@ionic/angular/standalone';
import { ConcertCardComponent } from 'src/app/components/concert-card/concert-card.component';
import { ConcertCardFullComponent } from "../../components/concert-card-full/concert-card-full.component";
import { ModalController } from '@ionic/angular';
import { ConcertDetailsPage } from '../concert-details/concert-details.page';

@Component({
  selector: 'home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [RouterModule, IonButton, IonLabel, IonCol, IonRow, IonGrid, IonSegmentButton, IonSegment, IonContent, ConcertCardComponent, IonInfiniteScrollContent, IonInfiniteScroll, IonHeader, IonToolbar, IonTitle, IonContent, CommonModule, NgFor, ConcertCardFullComponent],
  providers: [ModalController]
})
export class HomePage {

  constructor(private router: Router,private modalController: ModalController) {}
  concerts = [
    {
      title: 'Coldplay - Music of the Spheres Tour',
      date: '2025-06-12',
      location: 'Budapest, Hungary',
      image: 'assets/images/asd.jpg',
      genres: ['Rock', 'Pop', 'Indie'],
    },
    {
      title: 'Arctic Monkeys Live',
      date: '2025-07-18',
      location: 'Budapest Park',
      image: 'assets/images/asd.jpg',
    },
    {
      title: 'Imagine Dragons',
      date: '2025-07-15',
      location: 'Budapest Arena',
      image: 'assets/images/aa.jpg',
    },
    {
      title: 'Arctic Monkeys',
      date: '2025-08-02',
      location: 'Sziget Festival',
      image: 'assets/images/aa.jpg',
    },
    {
      title: 'Billie Eilish',
      date: '2025-09-10',
      location: 'Papp László Sportaréna',
      image: 'assets/images/aa.jpg',
    },
    {
      title: 'Arctic Monkeys Live',
      date: '2025-07-18',
      location: 'Vienna, Austria',
      image: 'assets/images/asd.jpg'
    },
    {
      title: 'Arctic Monkeys',
      date: '2025-08-02',
      location: 'Sziget Festival',
      image: 'assets/images/aa.jpg',
    },
    {
      title: 'Billie Eilish',
      date: '2025-09-10',
      location: 'Papp László Sportaréna',
      image: 'assets/images/aa.jpg',
    },
  ];
  
  results = [
    {
      title: 'Rocking Budapest',
      date: '2025-05-12',
      location: 'Budapest',
      image: 'assets/images/asd.jpg',
      genre: 'Rock',
      artist: 'Metallica',
    },
    {
      title: 'Jazz Night',
      date: '2025-06-02',
      location: 'Debrecen',
      image: 'assets/images/aa.jpg',
      genre: 'Jazz',
      artist: 'Norah Jones',
    },
    {
      title: 'Jazz Night',
      date: '2025-06-02',
      location: 'Debrecen',
      image: 'assets/images/aa.jpg',
      genre: 'Jazz',
      artist: 'Norah Jones',
    },
    {
      title: 'Rocking Budapest After Midnight',
      date: '2025-05-12',
      location: 'Budapest',
      image: 'assets/images/asd.jpg',
      genre: 'Rock',
      artist: 'Metallica',
    },
    // Add more dummy concert objects
  ];
  

  toggleTheme() {
    const isDark = document.body.classList.contains('dark');
  
    if (isDark) {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }
 
  async openDetails(concert: any) {
    const modal = await this.modalController.create({
      component: ConcertDetailsPage,
      componentProps: { concert }
    });
  
    // Add a class to blur the background content
    document.body.classList.add('modal-open');
  
    modal.onDidDismiss().then(() => {
      // Remove the blur class when the modal is closed
      document.body.classList.remove('modal-open');
    });
  
    await modal.present();
  }
}
