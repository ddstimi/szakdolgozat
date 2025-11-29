import NotificationScan from '../models/notification-scan.model';
import NotificationService from '../services/notification.service';

const WeekNotifications = {
  async run(): Promise<void> {
    console.log('📅 WeekNotifications.run()');

    const concerts = await NotificationScan.findThisWeekNeedingNotification();
    console.log('  This week needing notif:', concerts.length);

    for (const c of concerts) {
      const users = await NotificationScan.listUsersForConcert(c.id);

      const concertObj = {
        id: c.id,
        title: c.title || undefined,
        city: c.city_name || undefined,
        venue: c.venue_name || undefined,
      };

      for (const u of users) {
        await NotificationService.notifyConcertThisWeek(u.user_id, concertObj);
      }

      await NotificationScan.markThisWeekNotified(c.id);
    }

    console.log('✅ WeekNotifications finished');
  },
};

export default WeekNotifications;
