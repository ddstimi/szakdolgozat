import { error } from 'console';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env['JWT_SECRET'] || 'your_jwt_secret';

interface JwtPayload {
  id: number;
  username: string;
  email: string;
}

// middleware/authenticateJWT.ts

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      (req as any).user = user;
      console.log('JWT middleware passed');
      next();
    });
  } else {
    res.sendStatus(401);
  }
};
