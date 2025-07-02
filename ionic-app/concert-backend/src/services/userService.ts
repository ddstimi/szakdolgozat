
import bcrypt from 'bcryptjs';
import UserModel from '../models/User';
import { IUser } from '../interfaces/IUser';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
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
        hashedPassword: "",
        gdpr: true,
    });
    user = await UserModel.findById(userId);

    if (!user) {
        throw new CustomError("Failed to create user after Google authentication.", 500);
    }
}

if (user.id === undefined) {
    throw new CustomError("User ID is missing.", 500);
}
await UserModel.updateLastLogin(user.id);


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
