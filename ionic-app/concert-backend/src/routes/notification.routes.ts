import express from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import notificationController from '../controllers/notification.controller';
import { runAllNotificationJobs } from '../jobs/notification-scheduler.job';

const router = express.Router();

router.get('/', authenticateJWT, notificationController.listForMe);
router.get(
  '/unread-count',
  authenticateJWT,
  notificationController.unreadCount
);
router.patch('/:id/read', authenticateJWT, notificationController.markRead);

router.post(
  '/push-tokens',
  authenticateJWT,
  notificationController.registerMyToken
);
router.delete(
  '/push-tokens/:token',
  authenticateJWT,
  notificationController.revokeMyToken
);

router.post('/run-jobs', authenticateJWT, async (req, res) => {
  try {
    console.log('🔄 Manually triggered notification job');
    await runAllNotificationJobs();
    res.json({ success: true, message: 'Jobs executed' });
  } catch (err) {
    console.error('Job failed', err);
    res.status(500).json({ success: false, message: 'Job failed' });
  }
});
export default router;
