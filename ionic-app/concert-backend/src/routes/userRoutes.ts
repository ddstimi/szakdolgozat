import { Router } from 'express';
import UserController from '../controllers/userController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/google-auth', UserController.googleAuth);
router.get('/profile-info', authenticateJWT, UserController.userProfile);
router.put('/update-profile', authenticateJWT, UserController.updateUser);
router.patch('/update-picture', authenticateJWT, UserController.updateUserPic);

export default router;
