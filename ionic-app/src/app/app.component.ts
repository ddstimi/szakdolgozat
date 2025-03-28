import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonHeader } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonHeader, IonApp, IonRouterOutlet], // Ensure you import necessary Ionic components
  standalone: true // This makes it a standalone component
})
export class AppComponent {
  constructor() {}
}
