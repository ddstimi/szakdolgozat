import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import concertController from '../controllers/concertController';

const router = express.Router();

router.get('/top-picks', authenticateJWT, concertController.getTopPicks);
router.get('/near-me', authenticateJWT, concertController.getNearMe);

export default router;
