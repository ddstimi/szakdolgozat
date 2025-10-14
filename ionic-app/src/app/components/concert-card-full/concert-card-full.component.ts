import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {
  IonCardContent,
  IonCard,
  IonCardTitle,
  IonCardHeader,
  IonCardSubtitle,
  IonImg,
  IonIcon,
  IonChip,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-concert-card-full',
  templateUrl: './concert-card-full.component.html',
  styleUrls: ['./concert-card-full.component.scss'],
  standalone: true,
  imports: [
    IonChip,
    IonIcon,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonImg,
    IonCard,
    CommonModule,
  ],
})
export class ConcertCardFullComponent implements OnInit {
  constructor() {}

  ngOnInit() {}

  @Input() title?: string;
  @Input() date?: string;
  @Input() location?: string;
  @Input() image?: string;
  @Input() genre?: string;
  @Input() artist?: string;
  @Input() ticket_available?: boolean;
  @Input() attending?: boolean;
  @Input() loggedIn?: boolean;

  get attendCheckmarkColor(): string {
    if (!this.loggedIn) return '#737373';
    return this.attending ? '#c17b8c' : '#737373';
  }
  get attendCheckmarkIcon(): string {
    if (!this.loggedIn || !this.attending) {
      return 'checkmark-circle-outline';
    }
    return 'checkmark-circle';
  }

  get genreArray(): string[] {
    return this.genre ? this.genre.split(',') : [];
  }
}
