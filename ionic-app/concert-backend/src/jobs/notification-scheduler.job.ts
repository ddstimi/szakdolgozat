import StatusChangeNotifications from './notification-status-change.job';
import TodayNotifications from './notification-today.job';
import WeekNotifications from './notification-week.job';
import NewByPrefsNotifications from './notification-new-by-prefs.job';

export async function runAllNotificationJobs(): Promise<void> {
  console.log('Running notification jobs...');

  await StatusChangeNotifications.run();
  await TodayNotifications.run();
  await WeekNotifications.run();
  await NewByPrefsNotifications.run();

  console.log('Notification jobs finished');
}
