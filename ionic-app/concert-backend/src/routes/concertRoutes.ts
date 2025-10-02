import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import concertController from '../controllers/concertController';

const router = express.Router();

router.get('/top-picks', authenticateJWT, concertController.getTopPicks);
router.get('/popular', concertController.getPopular);
router.get('/upcoming', concertController.getUpcoming);
router.get(
  '/upcoming-by-user',
  authenticateJWT,
  concertController.getUpcomingByUserId
);
router.get('/past', authenticateJWT, concertController.getPastByUserId);

export default router;
