import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

import UserModel from '../models/User';
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

interface IUser {
  id?: number;
  name: string;
  username: string;
  email: string;
  password?: string;
  gdpr: boolean;
  img_url?: string;
  register_date?: Date;
  last_login?: Date;
}

interface BaseAuthResponse {
  user: Omit<IUser, 'password'>;
  token: string;
}

interface LoginResponse extends BaseAuthResponse {
  refreshToken: string;
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

    if (await UserModel.usernameExists(username)) {
      throw new CustomError('Username already exists.', 409);
    }

    if (await UserModel.emailExists(email)) {
      throw new CustomError('Email already exists.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return UserModel.createUser({
      name,
      username,
      email,
      hashedPassword,
      gdpr: gdpr || false,
    });
  },

  loginUser: async (
    username: string,
    password: string,
    stayLoggedIn = false
  ): Promise<LoginResponse> => {
    const user = await UserModel.findByUsername(username);
    if (!user || !user.password) {
      throw new CustomError('Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new CustomError('Invalid credentials', 401);
    }

    await UserModel.updateLastLogin(user.id as number);

    const { password: _, ...userData } = user;

    const { token, refreshToken } = SessionService.createTokens(
      user,
      stayLoggedIn
    );

    return { user: userData, token, refreshToken };
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
        throw new CustomError('User creation failed.', 500);
      }
    }

    if (!user.id) {
      throw new CustomError('User ID missing.', 500);
    }

    await UserModel.updateLastLogin(user.id);

    const { password: _, ...userData } = user;

    const { token, refreshToken } = SessionService.createTokens(user, true);

    return { user: userData, token, refreshToken };
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
  ): Promise<BaseAuthResponse> => {
    const updatedFields: any = {};

    if (updateData.name !== undefined) updatedFields.name = updateData.name;
    if (updateData.email !== undefined) updatedFields.email = updateData.email;
    if (updateData.username !== undefined)
      updatedFields.username = updateData.username;
    if (updateData.gdpr !== undefined) updatedFields.gdpr = updateData.gdpr;

    if (updateData.password) {
      updatedFields.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedUser = await UserModel.updateUserInfo(userId, updatedFields);

    const { password: _, ...userData } = updatedUser;

    const token = jwt.sign(
      {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { user: userData, token };
  },

  updateUserPic: async (
    userId: string,
    imgUrl: string
  ): Promise<BaseAuthResponse> => {
    const updated = await UserModel.updateUserPic(parseInt(userId, 10), imgUrl);
    if (!updated) {
      throw new CustomError('User not found', 404);
    }

    const user: Omit<IUser, 'password'> = {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      img_url: updated.img_url,
      gdpr: updated.gdpr ?? false,
      register_date: updated.register_date,
      last_login: updated.last_login,
      name: updated.name,
    };

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
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const attending = await UserModel.isAttendingConcert(userId, concertId);

    if (attending) {
      await UserModel.removeAttendance(userId, concertId);
      return { attending: false };
    } else {
      await UserModel.addAttendance(userId, concertId);
      return { attending: true };
    }
  },
};

export default UserService;
