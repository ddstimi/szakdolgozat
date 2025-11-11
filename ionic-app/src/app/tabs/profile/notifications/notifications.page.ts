import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonChip,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonButtons,
  IonBackButton,
  IonItem,
  IonList,
  IonItemOptions,
  IonItemSliding,
  IonItemOption,
  IonAccordion,
  IonLabel,
  IonAccordionGroup,
} from '@ionic/angular/standalone';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import { frontendService } from 'src/app/services/frontendService';

type UINotif = {
  id: number;
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
  sent_date: string;
};

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [
    IonAccordionGroup,
    IonLabel,
    IonAccordion,
    IonItemOption,
    IonItemSliding,
    IonItemOptions,
    IonList,
    IonItem,
    IonBackButton,
    IonButtons,
    IonBadge,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonChip,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
  ],
  animations: [
    trigger('fadeOut', [
      state('visible', style({ opacity: 1, transform: 'scale(1)' })),
      state('fade', style({ opacity: 0, transform: 'scale(0.95)' })),
      transition('visible => fade', [animate('300ms ease-in-out')]),
    ]),
  ],
})
export class NotificationsPage implements OnInit {
  constructor(private frontendService: frontendService) {}

  notifications: UINotif[] = [];
  unreadNotifications: UINotif[] = [];
  readNotifications: UINotif[] = [];

  ngOnInit() {
    this.fetchNotifications();
  }

  private toTimeAgo(iso: string): string {
    const t = new Date(iso).getTime();
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  async fetchNotifications() {
    const rows = await this.frontendService.getNotifications(false);
    this.notifications = rows.map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      sent_date: n.sent_date,
      timeAgo: this.toTimeAgo(n.sent_date),
      read: !!n.is_read,
    }));
    this.splitNotifications();
  }

  splitNotifications() {
    this.unreadNotifications = this.notifications.filter((n) => !n.read);
    this.readNotifications = this.notifications.filter((n) => n.read);
  }

  async markAsRead(notif: UINotif, slidingItem: IonItemSliding) {
    await this.frontendService.markNotificationRead(notif.id, true);
    notif.read = true;
    slidingItem.close();
    this.splitNotifications();
    window.dispatchEvent(new CustomEvent('notif:changed'));
  }

  async markAsUnread(notif: UINotif, slidingItem: IonItemSliding) {
    await this.frontendService.markNotificationRead(notif.id, false);
    notif.read = false;
    slidingItem.close();
    this.splitNotifications();
    window.dispatchEvent(new CustomEvent('notif:changed'));
  }
}
