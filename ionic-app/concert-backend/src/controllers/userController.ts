import { Request, Response, NextFunction, RequestHandler } from 'express';
import UserService from '../services/userService';
import UserModel from '../models/User';

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

  login: (async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: 'Please provide username and password.' });
    }

    try {
      const { user, token } = await UserService.loginUser(username, password);
      return res.status(200).json({
        message: 'Login successful!',
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
  updateUserPic: (async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id; // Assuming middleware set this from token
    const { img_url } = req.body;

    if (!img_url) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    try {
      const { user, token } = await UserService.updateUserPic(userId, img_url);

      return res.status(200).json({
        message: 'User updated successfully!',
        user,
        token,
      });
    } catch (error) {
      return next(error);
    }
  }) as RequestHandler,
};

export default UserController;
