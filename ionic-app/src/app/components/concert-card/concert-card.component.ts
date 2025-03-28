import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-concert-card',
  standalone: true,
  imports: [CommonModule], // Required for structural directives like *ngIf, *ngFor
  templateUrl: './concert-card.component.html',
  styleUrls: ['./concert-card.component.scss']
})
export class ConcertCardComponent {
  @Input() title: string = '';
  @Input() date: string = '';
  @Input() location: string = '';
  @Input() image: string = '';
}
