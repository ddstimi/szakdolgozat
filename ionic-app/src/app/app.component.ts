import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonHeader } from '@ionic/angular/standalone';
import { register } from 'swiper/element/bundle';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';



register();
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [ IonApp, IonRouterOutlet],
  standalone: true,
    providers: [
    provideAnimations()]
})
export class AppComponent {
  constructor() {}
}
