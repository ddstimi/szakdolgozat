import dotenv from 'dotenv';
import { runAllNotificationJobs } from './notification-scheduler.job';

dotenv.config();

(async () => {
  try {
    await runAllNotificationJobs();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Job failed', err);
    process.exit(1);
  }
})();
