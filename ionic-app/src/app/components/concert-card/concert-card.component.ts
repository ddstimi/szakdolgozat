import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonImg, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent } from "@ionic/angular/standalone";

@Component({
  selector: 'app-concert-card',
  standalone: true,
  imports: [IonCardContent, IonCardSubtitle, IonCardTitle, IonCardHeader, IonImg, IonCard, CommonModule], // Required for structural directives like *ngIf, *ngFor
  templateUrl: './concert-card.component.html',
  styleUrls: ['./concert-card.component.scss']
})
export class ConcertCardComponent {
  @Input() title?: string;
@Input() date?: string;
@Input() location?: string;
@Input() image?: string;

  
  
}
