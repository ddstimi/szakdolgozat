import NotificationScan from '../models/notification-scan.model';
import NotificationService from '../services/notification.service';

const TodayNotifications = {
  async run(): Promise<void> {
    console.log('🔔 TodayNotifications.run()');

    const concerts = await NotificationScan.findTodayNeedingNotification();
    console.log('  Today needing notif:', concerts.length);

    for (const c of concerts) {
      const users = await NotificationScan.listUsersForConcert(c.id);

      const concertObj = {
        id: c.id,
        title: c.title || undefined,
        city: c.city_name || undefined,
        venue: c.venue_name || undefined,
      };

      for (const u of users) {
        await NotificationService.notifyConcertToday(u.user_id, concertObj);
      }

      await NotificationScan.markTodayNotified(c.id);
    }

    console.log('✅ TodayNotifications finished');
  },
};

export default TodayNotifications;
