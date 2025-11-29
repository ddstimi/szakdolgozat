import express from 'express';
import EventStatisticsController from '../controllers/event-statistics.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticateJWT, EventStatisticsController.getEventStatistics);

export default router;
