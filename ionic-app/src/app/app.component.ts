import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonHeader } from '@ionic/angular/standalone';
import { register } from 'swiper/element/bundle';


register();
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [ IonApp, IonRouterOutlet],
  standalone: true // This makes it a standalone component
})
export class AppComponent {
  constructor() {}
}
