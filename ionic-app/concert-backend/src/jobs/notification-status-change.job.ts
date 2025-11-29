import NotificationScan from '../models/notification-scan.model';
import NotificationService from '../services/notification.service';

const notificationsStatusChange = {
  async run(): Promise<void> {
    console.log('🔍 StatusChangeNotifications.run()');

    const soldOut = await NotificationScan.findSoldOutNeedingNotification();
    console.log('  Sold out needing notif:', soldOut.length);

    for (const c of soldOut) {
      const users = await NotificationScan.listUsersForConcert(c.id);

      const concertObj = {
        id: c.id,
        title: c.title || undefined,
        city: c.city || undefined,
        venue: c.venue || undefined,
      };

      for (const u of users) {
        await NotificationService.notifyConcertStatusChange(
          u.user_id,
          concertObj,
          'sold_out'
        );
      }

      await NotificationScan.markSoldOutNotified(c.id);
    }

    // 2) Cancelled
    const cancelled = await NotificationScan.findCancelledNeedingNotification();
    console.log('  Cancelled needing notif:', cancelled.length);

    for (const c of cancelled) {
      const users = await NotificationScan.listUsersForConcert(c.id);

      const concertObj = {
        id: c.id,
        title: c.title || undefined,
        city: c.city || undefined,
        venue: c.venue || undefined,
      };

      for (const u of users) {
        await NotificationService.notifyConcertStatusChange(
          u.user_id,
          concertObj,
          'cancelled'
        );
      }

      await NotificationScan.markCancelledNotified(c.id);
    }

    console.log('✅ StatusChangeNotifications finished');
  },
};

export default notificationsStatusChange;
