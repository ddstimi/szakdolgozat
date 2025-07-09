import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your_refresh_secret';

class SessionService {
  static createTokens(user: any) {
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '15m' } // Short-lived access token
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      REFRESH_SECRET,
      { expiresIn: '7d' } // Long-lived refresh token
    );

    return { token, refreshToken };
  }

  static verifyToken(token: string, isRefresh = false) {
    return jwt.verify(token, isRefresh ? REFRESH_SECRET : JWT_SECRET);
  }

  static decodeToken(token: string) {
    return jwt.decode(token);
  }
}

export default SessionService;
