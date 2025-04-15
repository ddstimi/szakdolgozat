import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {IonCardContent, IonCard, IonCardTitle, IonCardHeader, IonCardSubtitle, IonImg } from "@ionic/angular/standalone";

@Component({
  selector: 'app-concert-card-full',
  templateUrl: './concert-card-full.component.html',
  styleUrls: ['./concert-card-full.component.scss'],
  standalone:true,
    imports: [IonCardContent, IonCardSubtitle, IonCardTitle, IonCardHeader, IonImg, IonCard, CommonModule], // Required for structural directives like *ngIf, *ngFor
  

})
export class ConcertCardFullComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

  @Input() title?: string;
  @Input() date?: string;
  @Input() location?: string;
  @Input() image?: string;
  @Input() genre?: string;
  @Input() artist?: string;
}
