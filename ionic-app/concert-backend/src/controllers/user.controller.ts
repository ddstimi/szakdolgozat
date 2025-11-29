import { Request, Response, NextFunction, RequestHandler } from 'express';
import UserService from '../services/user.service';
import UserModel from '../models/user.model';
import SessionService from '../services/session.service';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env['JWT_SECRET'] || 'your_jwt_secret';

class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

interface AuthenticatedRequest extends Request {
  user?: { id: number };
}

const UserController = {
  register: (async (req: Request, res: Response, next: NextFunction) => {
    const { name, username, email, password, gdpr } = req.body;

    if (!name || !username || !email || !password) {
      res.status(400).json({ message: 'Please provide all required fields.' });
      return;
    }

    try {
      const userId = await UserService.registerUser({
        name,
        username,
        email,
        password,
        gdpr,
      });

      res.status(201).json({
        message: 'User registered successfully!',
        userId,
      });
    } catch (error: any) {
      if (error instanceof CustomError && error.statusCode) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      next(error);
    }
  }) as RequestHandler,

  refreshToken: async (userId: number): Promise<string> => {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    return jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  },

  login: (async (req: Request, res: Response, next: NextFunction) => {
    const { username, password, stayLoggedIn } = req.body;

    if (!username || !password) {
      res
        .status(400)
        .json({ message: 'Please provide username and password.' });
      return;
    }

    try {
      const { user, token, refreshToken } = await UserService.loginUser(
        username,
        password,
        stayLoggedIn
      );

      res.status(200).json({
        message: 'Login successful!',
        user,
        token,
        refreshToken,
      });
    } catch (error: any) {
      if (error instanceof CustomError && error.statusCode) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      next(error);
    }
  }) as RequestHandler,

  googleAuth: (async (req: Request, res: Response, next: NextFunction) => {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({ message: 'Missing Google credential.' });
      return;
    }

    try {
      const { user, token, refreshToken } = await UserService.handleGoogleAuth(
        credential
      );

      res.status(200).json({
        message: 'Google sign-in successful!',
        user,
        token,
        refreshToken,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }) as RequestHandler,

  userProfile: (async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const id = req.user?.id;

    if (!id) {
      res.status(400).json({ message: 'There is no user logged in.' });
      return;
    }

    try {
      const user = await UserModel.getUserInfo(id);
      res.status(200).json({
        message: 'User data fetch successful!',
        user,
      });
    } catch (error: any) {
      if (error instanceof CustomError && error.statusCode) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      next(error);
    }
  }) as RequestHandler,

  updateUser: (async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { name, email, password, username, gdpr } = req.body;

    try {
      const { user, token } = await UserService.updateUser(userId, {
        name,
        email,
        password,
        username,
        gdpr,
      });

      res.status(200).json({
        message: 'User updated successfully!',
        user,
        token,
      });
    } catch (error: any) {
      if (error instanceof CustomError && error.statusCode) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      next(error);
    }
  }) as RequestHandler,

  updateUserPic: (async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user?.id;
      const { publicUrl, key } = req.body as {
        publicUrl?: string;
        key?: string;
      };

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (!publicUrl && !key) {
        res.status(400).json({ message: 'publicUrl or key is required' });
        return;
      }

      const cdnBase = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');
      const finalUrl = publicUrl || (key ? `${cdnBase}/${key}` : '');

      if (!finalUrl) {
        res.status(400).json({ message: 'Invalid image identifier' });
        return;
      }

      const { user, token } = await UserService.updateUserPic(
        String(userId),
        finalUrl
      );

      res.status(200).json({
        message: 'Profile picture updated successfully!',
        user,
        token,
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  updateStaticPic: (async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.user?.id;
    const { img_url } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!img_url) {
      res.status(400).json({ message: 'Image URL is required' });
      return;
    }

    try {
      const { user, token } = await UserService.updateUserPic(
        String(userId),
        img_url
      );
      res.status(200).json({
        message: 'User updated successfully!',
        user,
        token,
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  refreshSession: (async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ message: 'Refresh token required.' });
      return;
    }

    try {
      const payload: any = SessionService.verifyToken(refreshToken, true);
      const user = await UserModel.findById(payload.id);
      if (!user) {
        throw new Error('User not found');
      }

      const newAccessToken = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '30m' }
      );

      res.status(200).json({ token: newAccessToken });
    } catch (err) {
      console.error(err);
      res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }
  }) as RequestHandler,

  attendConcert: (async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.user?.id;
    const { concertId } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!concertId) {
      res.status(400).json({ message: 'concertId is required.' });
      return;
    }

    try {
      const result = await UserService.attendConcert(userId, concertId);

      res.status(200).json({
        message: 'Concert attendance updated successfully!',
        attending: result.attending,
      });
    } catch (error: any) {
      if (error instanceof CustomError && error.statusCode) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      next(error);
    }
  }) as RequestHandler,
};

export default UserController;
