import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import notificationController from '../controllers/notificationController';

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

router.post('/', /* adminMiddleware?, */ notificationController.create);
router.post('/test-me', authenticateJWT, notificationController.testMe);

export default router;
