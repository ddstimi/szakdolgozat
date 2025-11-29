import express from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import searchController from '../controllers/search.controller';

const router = express.Router();

router.get('/', authenticateJWT, searchController.getHistory);
router.post('/', authenticateJWT, searchController.addSearch);

export default router;
