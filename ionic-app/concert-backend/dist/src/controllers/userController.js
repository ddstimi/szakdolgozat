"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userService_1 = __importDefault(require("../services/userService"));
const User_1 = __importDefault(require("../models/User"));
const sessionService_1 = __importDefault(require("../services/sessionService"));
const JWT_SECRET = process.env['JWT_SECRET'] || 'your_jwt_secret';
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, CustomError.prototype);
    }
}
const UserController = {
    register: (async (req, res, next) => {
        const { name, username, email, password, gdpr } = req.body;
        if (!name || !username || !email || !password) {
            return res
                .status(400)
                .json({ message: 'Please provide all required fields.' });
        }
        try {
            const userId = await userService_1.default.registerUser({
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
        }
        catch (error) {
            if (error instanceof CustomError && error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return next(error);
        }
    }),
    refreshToken: async (userId) => {
        const user = await User_1.default.findById(userId);
        if (!user) {
            throw new CustomError('User not found', 404);
        }
        return jsonwebtoken_1.default.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    },
    login: (async (req, res, next) => {
        const { username, password, stayLoggedIn } = req.body;
        if (!username || !password) {
            return res
                .status(400)
                .json({ message: 'Please provide username and password.' });
        }
        try {
            const { user, token, refreshToken } = await userService_1.default.loginUser(username, password, stayLoggedIn);
            return res.status(200).json({
                message: 'Login successful!',
                user,
                token,
                refreshToken,
            });
        }
        catch (error) {
            if (error instanceof CustomError && error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return next(error);
        }
    }),
    googleAuth: (async (req, res, next) => {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ message: 'Missing Google credential.' });
        }
        try {
            const { user, token } = await userService_1.default.handleGoogleAuth(credential);
            return res.status(200).json({
                message: 'Google sign-in successful!',
                user,
                token,
            });
        }
        catch (error) {
            console.error(error);
            return next(error);
        }
    }),
    userProfile: (async (req, res, next) => {
        const id = req.user.id;
        if (!id) {
            return res.status(400).json({ message: 'There is no user logged in.' });
        }
        try {
            const user = await User_1.default.getUserInfo(id);
            return res.status(200).json({
                message: 'User data fetch successful!',
                user,
            });
        }
        catch (error) {
            if (error instanceof CustomError && error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return next(error);
        }
    }),
    updateUser: (async (req, res, next) => {
        const userId = req.user.id;
        const { name, email, password, username, gdpr } = req.body;
        try {
            const { user, token } = await userService_1.default.updateUser(userId, {
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
        }
        catch (error) {
            if (error instanceof CustomError && error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return next(error);
        }
    }),
    updateUserPic: (async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { publicUrl, key } = req.body;
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
            const { user, token } = await userService_1.default.updateUserPic(String(userId), finalUrl);
            return res.status(200).json({
                message: 'Profile picture updated successfully!',
                user,
                token,
            });
        }
        catch (error) {
            return next(error);
        }
    }),
    updateStaticPic: (async (req, res, next) => {
        const userId = req.user.id;
        const { img_url } = req.body;
        if (!img_url) {
            return res.status(400).json({ message: 'Image URL is required' });
        }
        try {
            const { user, token } = await userService_1.default.updateUserPic(String(userId), img_url);
            return res.status(200).json({
                message: 'User updated successfully!',
                user,
                token,
            });
        }
        catch (error) {
            return next(error);
        }
    }),
    refreshSession: (async (req, res) => {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return res.status(400).json({ message: 'Refresh token required.' });
        try {
            const payload = sessionService_1.default.verifyToken(refreshToken, true);
            const user = await User_1.default.findById(payload.id);
            if (!user)
                throw new Error('User not found');
            const newAccessToken = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30m' });
            res.status(200).json({ token: newAccessToken });
        }
        catch (err) {
            console.error(err);
            res.status(401).json({ message: 'Invalid or expired refresh token.' });
        }
    }),
    attendConcert: (async (req, res, next) => {
        const userId = req.user.id;
        const { concertId } = req.body;
        if (!concertId) {
            return res.status(400).json({ message: 'concertId is required.' });
        }
        try {
            const result = await userService_1.default.attendConcert(userId, concertId);
            return res.status(200).json({
                message: 'Concert attendance updated successfully!',
                attending: result.attending,
            });
        }
        catch (error) {
            if (error instanceof CustomError && error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return next(error);
        }
    }),
};
exports.default = UserController;
