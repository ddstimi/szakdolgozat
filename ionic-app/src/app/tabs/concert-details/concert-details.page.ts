import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonImg, IonCardTitle, IonCardHeader, IonCardSubtitle, IonCardContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-concert-details',
  templateUrl: './concert-details.page.html',
  styleUrls: ['./concert-details.page.scss'],
  standalone: true,
  imports: [IonIcon, IonButton, IonCardContent, IonCardSubtitle, IonCardHeader, IonCardTitle, IonImg, IonCard, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ConcertDetailsPage implements OnInit {
  @Input() concert: any;

  constructor(private modalController: ModalController) {}

  ngOnInit(): void {}

  closeModal() {
    this.modalController.dismiss();
  }
}
