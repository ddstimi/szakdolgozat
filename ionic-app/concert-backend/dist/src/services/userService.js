"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const sessionService_1 = __importDefault(require("./sessionService"));
const client = new google_auth_library_1.OAuth2Client(process.env['GOOGLE_CLIENT_ID']);
const JWT_SECRET = process.env['JWT_SECRET'] || 'your_jwt_secret';
class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, CustomError.prototype);
    }
}
const UserService = {
    registerUser: async (userData) => {
        const { name, username, email, password, gdpr } = userData;
        const usernameExists = await User_1.default.usernameExists(username);
        if (usernameExists) {
            throw new CustomError('Username already exists.', 409);
        }
        const emailExists = await User_1.default.emailExists(email);
        if (emailExists) {
            throw new CustomError('Email already exists.', 409);
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const userId = await User_1.default.createUser({
            name,
            username,
            email,
            hashedPassword,
            gdpr: gdpr || false,
        });
        return userId;
    },
    loginUser: async (username, password, stayLoggedIn = false) => {
        const user = await User_1.default.findByUsername(username);
        if (!user || !user.password) {
            throw new CustomError('Invalid credentials', 401);
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            throw new CustomError('Invalid credentials', 401);
        }
        await User_1.default.updateLastLogin(user.id);
        const { password: _, ...userDataWithoutPassword } = user;
        const { token, refreshToken } = sessionService_1.default.createTokens(user, stayLoggedIn);
        return { user: userDataWithoutPassword, token, refreshToken };
    },
    handleGoogleAuth: async (credential) => {
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
        let user = await User_1.default.findByEmail(email);
        if (!user) {
            const userId = await User_1.default.createUser({
                name,
                username,
                email,
                hashedPassword: '',
                gdpr: true,
            });
            user = await User_1.default.findById(userId);
            if (!user) {
                throw new CustomError('Failed to create user after Google authentication.', 500);
            }
        }
        if (user.id === undefined) {
            throw new CustomError('User ID is missing.', 500);
        }
        await User_1.default.updateLastLogin(user.id);
        const { password: _, ...userDataWithoutPassword } = user;
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        return { user: userDataWithoutPassword, token };
    },
    updateUser: async (userId, updateData) => {
        const { name, email, password, username, gdpr } = updateData;
        const updatedFields = {};
        if (name !== undefined)
            updatedFields.name = name;
        if (email !== undefined)
            updatedFields.email = email;
        if (username !== undefined)
            updatedFields.username = username;
        if (gdpr !== undefined)
            updatedFields.gdpr = gdpr;
        if (password) {
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            updatedFields.password = hashedPassword;
        }
        const updatedUser = await User_1.default.updateUserInfo(userId, updatedFields);
        const { password: _, ...userDataWithoutPassword } = updatedUser;
        const token = jsonwebtoken_1.default.sign({
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
        }, JWT_SECRET, { expiresIn: '1h' });
        return { user: userDataWithoutPassword, token };
    },
    updateUserPic: async (userId, imgUrl) => {
        const updated = await User_1.default.updateUserPic(parseInt(userId, 10), imgUrl);
        if (!updated)
            throw new CustomError('User not found', 404);
        const user = {
            id: updated.id,
            username: updated.username,
            email: updated.email,
            img_url: updated.img_url,
            gdpr: updated.gdpr ?? undefined,
            register_date: updated.register_date ?? undefined,
            last_login: updated.last_login ?? undefined,
        };
        const token = jsonwebtoken_1.default.sign({ id: updated.id, username: updated.username, email: updated.email }, JWT_SECRET, { expiresIn: '1h' });
        return { user, token };
    },
    attendConcert: async (userId, concertId) => {
        const user = await User_1.default.findById(userId);
        if (!user)
            throw new CustomError('User not found', 404);
        const isAttending = await User_1.default.isAttendingConcert(userId, concertId);
        if (isAttending) {
            await User_1.default.removeAttendance(userId, concertId);
            return { attending: false };
        }
        else {
            await User_1.default.addAttendance(userId, concertId);
            return { attending: true };
        }
    },
};
exports.default = UserService;
