import express from 'express';
import EventStatisticsController from '../controllers/eventStatisticsController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateJWT, EventStatisticsController.getEventStatistics);

export default router;
