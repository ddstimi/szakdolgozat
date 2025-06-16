
import bcrypt from 'bcryptjs';
import UserModel from '../models/User';
import { IUser } from '../interfaces/IUser';
import jwt from 'jsonwebtoken';

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
            gdpr: gdpr || false
        });

        return userId;
    },

   loginUser: async (username: string, password: string): Promise<LoginResponse> => {
        const user = await UserModel.findByUsername(username);

        if (!user) {
            throw new CustomError('Invalid credentials.', 401);
        }

        const isMatch = await bcrypt.compare(password, user.password as string);

        if (!isMatch) {
            throw new CustomError('Invalid credentials.', 401);
        }

        await UserModel.updateLastLogin(user.id as number);

        const { password: _, ...userDataWithoutPassword } = user;
       const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { user: userDataWithoutPassword, token };
  }
    
};

export default UserService;
