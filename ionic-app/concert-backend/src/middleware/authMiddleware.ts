import { error } from 'console';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import SessionService from '../services/sessionService';

const JWT_SECRET = process.env['JWT_SECRET'] || 'your_jwt_secret';

interface JwtPayload {
  id: number;
  username: string;
  email: string;
}

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Check for access token first
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = SessionService.verifyToken(token);
        (req as any).user = decoded;
        return next();
      } catch (err) {
        throw err;
      }
    }

    // 2. If access token expired, check refresh token
    const refreshToken = req.headers['x-refresh-token'] as string;
    if (refreshToken) {
      try {
        const decoded = SessionService.verifyToken(refreshToken, true);
        const { token, refreshToken: newRefreshToken } =
          SessionService.createTokens(decoded);

        (req as any).user = decoded;
        res.set({
          Authorization: `Bearer ${token}`,
          'X-New-Refresh-Token': newRefreshToken,
        });
        return next();
      } catch (err) {
        throw new Error('Session expired');
      }
    }

    throw new Error('Authentication required');
  } catch (error) {
    next(error);
  }
};
