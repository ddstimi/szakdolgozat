import bcrypt from 'bcryptjs';
import UserModel from '../models/User';
import { IUser } from '../interfaces/IUser';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import SessionService from './sessionService';
const client = new OAuth2Client(process.env['GOOGLE_CLIENT_ID']);

const JWT_SECRET = process.env['JWT_SECRET'] || 'your_jwt_secret';

interface RegisterUserData {
  name: string;
  username: string;
  email: string;
  password: string;
  gdpr?: boolean;
}

interface LoginResponse {
  user: Omit<IUser, 'password'>;
  token: string;
}

class CustomError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

const UserService = {
  registerUser: async (userData: RegisterUserData): Promise<number> => {
    const { name, username, email, password, gdpr } = userData;

    const usernameExists = await UserModel.usernameExists(username);
    if (usernameExists) {
      throw new CustomError('Username already exists.', 409);
    }

    const emailExists = await UserModel.emailExists(email);
    if (emailExists) {
      throw new CustomError('Email already exists.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = await UserModel.createUser({
      name,
      username,
      email,
      hashedPassword,
      gdpr: gdpr || false,
    });

    return userId;
  },

  loginUser: async (
    username: string,
    password: string,
    stayLoggedIn = false
  ): Promise<{
    user: Omit<IUser, 'password'>;
    token: string;
    refreshToken: string;
  }> => {
    const user = await UserModel.findByUsername(username);
    if (!user || !user.password) {
      throw new CustomError('Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new CustomError('Invalid credentials', 401);
    }

    await UserModel.updateLastLogin(user.id as number);
    const { password: _, ...userDataWithoutPassword } = user;

    const { token, refreshToken } = SessionService.createTokens(
      user,
      stayLoggedIn
    );

    return { user: userDataWithoutPassword, token, refreshToken };
  },

  handleGoogleAuth: async (credential: string): Promise<LoginResponse> => {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env['GOOGLE_CLIENT_ID'],
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new CustomError('Invalid Google token.', 401);
    }

    const email = payload.email;
    const name = payload.name || 'No Name';
    const username = email.split('@')[0];

    let user = await UserModel.findByEmail(email);

    if (!user) {
      const userId = await UserModel.createUser({
        name,
        username,
        email,
        hashedPassword: '',
        gdpr: true,
      });
      user = await UserModel.findById(userId);

      if (!user) {
        throw new CustomError(
          'Failed to create user after Google authentication.',
          500
        );
      }
    }

    if (user.id === undefined) {
      throw new CustomError('User ID is missing.', 500);
    }
    await UserModel.updateLastLogin(user.id);

    const { password: _, ...userDataWithoutPassword } = user;

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { user: userDataWithoutPassword, token };
  },

  updateUser: async (
    userId: number,
    updateData: {
      name?: string;
      email?: string;
      password?: string;
      username?: string;
      gdpr?: boolean;
    }
  ): Promise<LoginResponse> => {
    const { name, email, password, username, gdpr } = updateData;

    const updatedFields: any = {};

    if (name !== undefined) updatedFields.name = name;
    if (email !== undefined) updatedFields.email = email;
    if (username !== undefined) updatedFields.username = username;
    if (gdpr !== undefined) updatedFields.gdpr = gdpr;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedFields.password = hashedPassword;
    }

    const updatedUser = await UserModel.updateUserInfo(userId, updatedFields);

    const { password: _, ...userDataWithoutPassword } = updatedUser;

    const token = jwt.sign(
      {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { user: userDataWithoutPassword, token };
  },
  updateUserPic: async (
    userId: string,
    imgUrl: string
  ): Promise<LoginResponse> => {
    const updated = await UserModel.updateUserPic(parseInt(userId, 10), imgUrl);
    if (!updated) throw new CustomError('User not found', 404);

    const user = {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      img_url: updated.img_url,
      gdpr: updated.gdpr ?? undefined,
      register_date: updated.register_date ?? undefined,
      last_login: updated.last_login ?? undefined,
    } as Omit<IUser, 'password'>;

    const token = jwt.sign(
      { id: updated.id, username: updated.username, email: updated.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { user, token };
  },
  attendConcert: async (
    userId: number,
    concertId: number
  ): Promise<{ attending: boolean }> => {
    const user = await UserModel.findById(userId);
    if (!user) throw new CustomError('User not found', 404);

    const isAttending = await UserModel.isAttendingConcert(userId, concertId);

    if (isAttending) {
      await UserModel.removeAttendance(userId, concertId);
      return { attending: false };
    } else {
      await UserModel.addAttendance(userId, concertId);
      return { attending: true };
    }
  },
};

export default UserService;
