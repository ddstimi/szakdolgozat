import StatusChangeNotifications from './notificationStatusChange';
import TodayNotifications from './notificationToday';
import WeekNotifications from './notificationWeek';
import NewByPrefsNotifications from './notificationNewByPrefs';

export async function runAllNotificationJobs(): Promise<void> {
  console.log('Running notification jobs...');

  await StatusChangeNotifications.run();
  await TodayNotifications.run();
  await WeekNotifications.run();
  await NewByPrefsNotifications.run();

  console.log('Notification jobs finished');
}
