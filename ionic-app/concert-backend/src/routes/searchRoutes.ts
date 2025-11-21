import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import searchController from '../controllers/searchController';

const router = express.Router();

router.get('/', authenticateJWT, searchController.getHistory);
router.post('/', authenticateJWT, searchController.addSearch);

export default router;
