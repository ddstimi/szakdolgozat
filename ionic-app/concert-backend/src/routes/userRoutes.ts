import { Router } from 'express';
import UserController from '../controllers/userController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { uploadProfilePicture } from '../controllers/pictureController';

const router = Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/google-auth', UserController.googleAuth);
router.get('/profile-info', authenticateJWT, UserController.userProfile);
router.put('/update-profile', authenticateJWT, UserController.updateUser);
router.patch(
  '/update-static-picture',
  authenticateJWT,
  UserController.updateStaticPic
);
router.patch(
  '/update-picture',
  authenticateJWT,
  uploadProfilePicture,
  UserController.updateUserPic
);
router.put('/preferences', authenticateJWT, UserController.updateUser);
router.post('/refresh', UserController.refreshSession);
router.patch('/attend_concert', authenticateJWT, UserController.attendConcert);

export default router;
