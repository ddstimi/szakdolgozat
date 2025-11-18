"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
const sessionService_1 = __importDefault(require("../services/sessionService"));
const JWT_SECRET = process.env['JWT_SECRET'] || 'your_jwt_secret';
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = sessionService_1.default.verifyToken(token);
        req.user = decoded;
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({ message: 'Token expired' });
            return;
        }
        res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authenticateJWT = authenticateJWT;
