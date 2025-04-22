import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';

import { routes } from './app/app.routes';  // Make sure this is correctly exported from app.routes.ts
import { AppComponent } from './app/app.component';  // Make sure the standalone AppComponent is correctly set up

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),  // ✅ Keep this one
  ],
});

