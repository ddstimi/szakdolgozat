"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notificationService_1 = __importDefault(require("../services/notificationService"));
const PushNotification_1 = __importDefault(require("../models/PushNotification"));
const getUserId = (req) => req.user?.id ?? null;
const notificationController = {
    listForMe: (async (req, res, _next) => {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const unreadOnly = String(req.query.unreadOnly ?? 'false') === 'true';
        try {
            const data = await notificationService_1.default.listForUser(userId, unreadOnly);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            console.error(err);
            res
                .status(500)
                .json({ success: false, message: 'Failed to fetch notifications' });
        }
    }),
    unreadCount: (async (req, res, _next) => {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        try {
            const count = await notificationService_1.default.getUnreadCount(userId);
            res.status(200).json({ success: true, data: { count } });
        }
        catch (err) {
            console.error(err);
            res
                .status(500)
                .json({ success: false, message: 'Failed to fetch unread count' });
        }
    }),
    markRead: (async (req, res, _next) => {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const id = Number(req.params.id);
        const read = !!req.body?.read;
        try {
            const ok = await notificationService_1.default.markRead(userId, id, read);
            if (!ok) {
                res
                    .status(404)
                    .json({ success: false, message: 'Notification not found' });
                return;
            }
            res.status(200).json({ success: true });
        }
        catch (err) {
            console.error(err);
            res
                .status(500)
                .json({ success: false, message: 'Failed to update notification' });
        }
    }),
    create: (async (req, res, _next) => {
        const { userId, title, message, type, concertId } = req.body || {};
        if (!userId || !title || !message) {
            res
                .status(400)
                .json({ success: false, message: 'userId, title, message required' });
            return;
        }
        try {
            const id = await notificationService_1.default.create({
                userId: Number(userId),
                title: String(title),
                message: String(message),
                type: type ? String(type) : null,
                concertId: concertId ? Number(concertId) : null,
            });
            res.status(201).json({ success: true, data: { id } });
        }
        catch (err) {
            console.error(err);
            res
                .status(500)
                .json({ success: false, message: 'Failed to create notification' });
        }
    }),
    registerMyToken: (async (req, res) => {
        const userId = getUserId(req);
        const { token, platform } = req.body || {};
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        if (!token || !platform) {
            res
                .status(400)
                .json({ success: false, message: 'token & platform required' });
            return;
        }
        await PushNotification_1.default.upsert(userId, token, platform);
        res.status(200).json({ success: true });
    }),
    revokeMyToken: (async (req, res) => {
        const userId = getUserId(req);
        const token = req.params.token;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        if (!token) {
            res.status(400).json({ success: false, message: 'token required' });
            return;
        }
        await PushNotification_1.default.revoke(userId, token);
        res.status(200).json({ success: true });
    }),
    testMe: (async (req, res) => {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { title, message, type, concertId } = req.body || {};
        const finalTitle = title || 'Test notification 🎧';
        const finalMessage = message || 'This is a test push + DB notification';
        const finalType = type ? String(type) : null;
        const finalConcertId = Number(concertId);
        try {
            const id = await notificationService_1.default.createAndPush({
                userId,
                title: finalTitle,
                message: finalMessage,
                type: finalType,
                concertId: finalConcertId,
            });
            res.status(201).json({
                success: true,
                data: {
                    id,
                    title: finalTitle,
                    message: finalMessage,
                },
            });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({
                success: false,
                message: 'Failed to send test notification',
            });
        }
    }),
};
exports.default = notificationController;
