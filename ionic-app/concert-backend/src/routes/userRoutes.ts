import { Router } from 'express';
import UserController from '../controllers/userController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { uploadProfileDirect } from '../controllers/pictureController';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/google-auth', UserController.googleAuth);
router.get('/profile-info', authenticateJWT, UserController.userProfile);
router.put('/update-profile', authenticateJWT, UserController.updateUser);
router.patch('/update-picture', authenticateJWT, UserController.updateUserPic);
router.patch(
  '/update-static-picture',
  authenticateJWT,
  UserController.updateStaticPic
);
router.post(
  '/picture/upload',
  authenticateJWT,
  upload.single('file'),
  uploadProfileDirect
);
router.put('/preferences', authenticateJWT, UserController.updateUser);
router.post('/refresh', UserController.refreshSession);
router.patch('/attend_concert', authenticateJWT, UserController.attendConcert);

export default router;
