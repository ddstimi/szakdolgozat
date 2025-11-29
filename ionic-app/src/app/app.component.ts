import { Component, OnDestroy } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { PushService } from './services/pushService';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonicModule],
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnDestroy {
  constructor(
    private toastCtrl: ToastController,
    private pushService: PushService
  ) {
    this.setupPushListener();
    this.pushService.startJobPolling(60_000);
  }

  setupPushListener() {
    window.addEventListener('push-toast', async (ev: any) => {
      const { title, body } = ev.detail || {};
      const toast = await this.toastCtrl.create({
        header: title || 'Notification',
        message: body || '',
        duration: 5000,
        position: 'top',
        buttons: [
          {
            icon: 'close',
            role: 'cancel',
          },
        ],
      });

      toast.present();
    });
  }

  ngOnDestroy(): void {
    this.pushService.stopJobPolling();
  }
}
