"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your_refresh_secret';
class SessionService {
    static createTokens(user, stayLoggedIn = false) {
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30m' });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, REFRESH_SECRET, {
            expiresIn: stayLoggedIn ? '30d' : '7d',
        });
        return { token, refreshToken };
    }
    static verifyToken(token, isRefresh = false) {
        return jsonwebtoken_1.default.verify(token, isRefresh ? REFRESH_SECRET : JWT_SECRET);
    }
    static decodeToken(token) {
        return jsonwebtoken_1.default.decode(token);
    }
}
exports.default = SessionService;
