// concert-backend/src/services/notifications/notificationNewByPrefs.ts
import NotificationScan from '../models/NotificationScan';
import NotificationService from '../services/notificationService';

const NewByPrefsNotifications = {
  async run(): Promise<void> {
    console.log('✨ NewByPrefsNotifications.run()');

    const concerts =
      await NotificationScan.findNewConcertsNeedingPrefsNotification();
    console.log('  New concerts needing prefs notif:', concerts.length);

    for (const c of concerts) {
      const users = await NotificationScan.listUsersMatchingPreferences(c.id);

      const concertObj = {
        id: c.id,
        title: c.title || undefined,
        city: c.city_name || undefined,
        venue: c.venue_name || undefined,
        artistName: undefined, // you can join artist name if you want
      };

      for (const u of users) {
        await NotificationService.notifyNewConcertByPreferences(
          u.user_id,
          concertObj
        );
      }

      await NotificationScan.markPrefsNotified(c.id);
    }

    console.log('✅ NewByPrefsNotifications finished');
  },
};

export default NewByPrefsNotifications;
