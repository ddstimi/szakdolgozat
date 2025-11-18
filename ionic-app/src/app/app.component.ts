import { Component } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { PushService } from './services/pushService';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonicModule],
  templateUrl: 'app.component.html',
})
export class AppComponent {
  constructor(
    private toastCtrl: ToastController,
    private PushService: PushService
  ) {
    this.setupPushListener();
    this.PushService.startJobPolling(60_000);
  }

  setupPushListener() {
    console.log('🎯 push listener active');
    window.addEventListener('push-toast', async (ev: any) => {
      console.log('🔥 push-toast event received', ev.detail);

      const { title, body, data } = ev.detail || {};
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
    if (this.toastCtrl) {
      window.removeEventListener('push-toast', this.toastCtrl as any);
    }
    this.PushService.stopJobPolling();
  }
}
