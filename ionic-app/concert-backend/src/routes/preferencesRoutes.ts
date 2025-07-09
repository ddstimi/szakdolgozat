import express from 'express';
import PreferencesController from '../controllers/preferencesController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateJWT, PreferencesController.getPreferences);
router.patch(
  '/update',
  authenticateJWT,
  PreferencesController.updatePreferences
);

export default router;
