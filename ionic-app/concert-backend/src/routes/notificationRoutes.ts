import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import notificationController from '../controllers/notificationController';
import { runAllNotificationJobs } from '../jobs/notificationScheduler';

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

// router.post('/', /* adminMiddleware?, */ notificationController.create);
// router.post('/test-me', authenticateJWT, notificationController.testMe);

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
