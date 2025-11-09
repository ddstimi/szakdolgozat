import { Request, Response, NextFunction, RequestHandler } from 'express';
import UserService from '../services/userService';
import UserModel from '../models/User';
import SessionService from '../services/sessionService';
const JWT_SECRET = process.env['JWT_SECRET'] || 'your_jwt_secret';
import jwt from 'jsonwebtoken';

class CustomError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

const UserController = {
  register: (async (req: Request, res: Response, next: NextFunction) => {
    const { name, username, email, password, gdpr } = req.body;

    if (!name || !username || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Please provide all required fields.' });
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
        userId: userId,
      });
    } catch (error: any) {
      if (error instanceof CustomError && error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return next(error);
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
      return res
        .status(400)
        .json({ message: 'Please provide username and password.' });
    }

    try {
      const { user, token, refreshToken } = await UserService.loginUser(
        username,
        password,
        stayLoggedIn
      );
      return res.status(200).json({
        message: 'Login successful!',
        user,
        token,
        refreshToken,
      });
    } catch (error: any) {
      if (error instanceof CustomError && error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return next(error);
    }
  }) as RequestHandler,

  googleAuth: (async (req: Request, res: Response, next: NextFunction) => {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential.' });
    }

    try {
      const { user, token } = await UserService.handleGoogleAuth(credential);
      return res.status(200).json({
        message: 'Google sign-in successful!',
        user,
        token,
      });
    } catch (error: any) {
      console.error(error);
      return next(error);
    }
  }) as RequestHandler,

  userProfile: (async (req: Request, res: Response, next: NextFunction) => {
    const id = (req as any).user.id;

    if (!id) {
      return res.status(400).json({ message: 'There is no user logged in.' });
    }

    try {
      const user = await UserModel.getUserInfo(id);
      return res.status(200).json({
        message: 'User data fetch successful!',
        user,
      });
    } catch (error: any) {
      if (error instanceof CustomError && error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return next(error);
    }
  }) as RequestHandler,
  updateUser: (async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    const { name, email, password, username, gdpr } = req.body;

    try {
      const { user, token } = await UserService.updateUser(userId, {
        name,
        email,
        password,
        username,
        gdpr,
      });

      return res.status(200).json({
        message: 'User updated successfully!',
        user,
        token,
      });
    } catch (error: any) {
      if (error instanceof CustomError && error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return next(error);
    }
  }) as RequestHandler,
  updateUserPic: (async (req, res, next) => {
    try {
      const userId = (req as any).user.id as number;
      const { publicUrl, key } = req.body as {
        publicUrl?: string;
        key?: string;
      };

      if (!publicUrl && !key) {
        return res
          .status(400)
          .json({ message: 'publicUrl or key is required' });
      }

      const cdnBase = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');
      const finalUrl = publicUrl || (key ? `${cdnBase}/${key}` : '');

      if (!finalUrl) {
        return res.status(400).json({ message: 'Invalid image identifier' });
      }

      const { user, token } = await UserService.updateUserPic(
        String(userId),
        finalUrl
      );

      return res.status(200).json({
        message: 'Profile picture updated successfully!',
        user,
        token,
      });
    } catch (error) {
      return next(error);
    }
  }) as RequestHandler,

  updateStaticPic: (async (req, res, next) => {
    const userId = (req as any).user.id as number;
    const { img_url } = req.body;

    if (!img_url) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    try {
      const { user, token } = await UserService.updateUserPic(
        String(userId),
        img_url
      );
      return res.status(200).json({
        message: 'User updated successfully!',
        user,
        token,
      });
    } catch (error) {
      return next(error);
    }
  }) as RequestHandler,
  refreshSession: (async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: 'Refresh token required.' });

    try {
      const payload: any = SessionService.verifyToken(refreshToken, true);
      const user = await UserModel.findById(payload.id);
      if (!user) throw new Error('User not found');

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

  attendConcert: (async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    const { concertId } = req.body;

    if (!concertId) {
      return res.status(400).json({ message: 'concertId is required.' });
    }

    try {
      const result = await UserService.attendConcert(userId, concertId);

      return res.status(200).json({
        message: 'Concert attendance updated successfully!',
        attending: result.attending,
      });
    } catch (error: any) {
      if (error instanceof CustomError && error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return next(error);
    }
  }) as RequestHandler,
};

export default UserController;
