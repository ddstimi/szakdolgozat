import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonChip, IonCard, IonCardHeader, IonCardTitle, IonBadge, IonButtons, IonBackButton, IonItem, IonList, IonItemOptions, IonItemSliding, IonItemOption, IonAccordion, IonLabel, IonAccordionGroup } from '@ionic/angular/standalone';
import { trigger, state, style, animate, transition } from '@angular/animations';


@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [IonAccordionGroup, IonLabel, IonAccordion, IonItemOption, IonItemSliding, IonItemOptions, IonList, IonItem, IonBackButton, IonButtons, IonBadge, IonCardTitle, IonCardHeader, IonCard, IonChip, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule],
  animations: [
    trigger('fadeOut', [
      state('visible', style({ opacity: 1, transform: 'scale(1)' })),
      state('fade', style({ opacity: 0, transform: 'scale(0.95)' })),
      transition('visible => fade', [
        animate('300ms ease-in-out')
      ])])]
})
export class NotificationsPage implements OnInit {

  constructor() { }

  notifications = [
    { title: 'New Concert Alert', message: 'A new concert was added.', timeAgo: '2h ago', read: false },
    { title: 'Reminder', message: 'Concert tomorrow!', timeAgo: '1d ago', read: true },
    { title: 'Thanks!', message: 'Thanks for using Vibecon.', timeAgo: '3d ago', read: true },
    { title: 'New Artist Added', message: 'Your favorite artist is now in your city!', timeAgo: '30m ago', read: false },
    { title: 'New Concert Alert', message: 'A new concert was added.', timeAgo: '2h ago', read: false },
    { title: 'Reminder', message: 'Concert tomorrow!', timeAgo: '1d ago', read: true },
    { title: 'Thanks!', message: 'Thanks for using Vibecon.', timeAgo: '3d ago', read: true },
    { title: 'New Artist Added', message: 'Your favorite artist is now in your city!', timeAgo: '30m ago', read: false }
  ];

  unreadNotifications = this.notifications;
  readNotifications = this.notifications;

  ngOnInit() {
    this.splitNotifications();
  }

  splitNotifications() {
    this.unreadNotifications = this.notifications.filter(n => !n.read);
    this.readNotifications = this.notifications.filter(n => n.read);
  }

  markAsRead(notif: any, slidingItem: IonItemSliding) {
  notif.read = true;
  slidingItem.close();
      this.splitNotifications();
}

  markAsUnread(notif: any, slidingItem: IonItemSliding) {
    notif.read = false;
    this.splitNotifications();
  }
}
