"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Notifications_1 = __importDefault(require("../models/Notifications"));
const pushService_1 = __importDefault(require("./pushService"));
const NotificationService = {
    listForUser: async (userId, unreadOnly = false) => {
        return await Notifications_1.default.listByUserId(userId, unreadOnly, 100);
    },
    getUnreadCount: async (userId) => {
        return await Notifications_1.default.unreadCount(userId);
    },
    markRead: async (userId, id, read) => {
        return await Notifications_1.default.markRead(userId, id, read);
    },
    create: async (payload) => {
        return await Notifications_1.default.create(payload);
    },
    createAndPush: async (payload) => {
        const id = await Notifications_1.default.create(payload);
        const linkUrl = payload.concertId
            ? `${process.env.APP_BASE_URL || ''}/tabs/concerts/${payload.concertId}`
            : undefined;
        await pushService_1.default.sendToUser(payload.userId, {
            title: payload.title,
            body: payload.message,
            type: payload.type || undefined,
            linkUrl,
            metadata: { notificationId: id, concertId: payload.concertId ?? '' },
        });
        return id;
    },
    async notifyConcertToday(userId, concert) {
        const title = '🎵 Your concert is today!';
        const label = concert.title ?? concert.name ?? 'your concert';
        const venue = concert.venue ? ` at ${concert.venue}` : '';
        const city = concert.city ? ` (${concert.city})` : '';
        const message = `Don't forget: ${label}${venue}${city} is happening today.`;
        return await NotificationService.createAndPush({
            userId,
            title,
            message,
            type: 'concert_today',
            concertId: concert.id,
        });
    },
    async notifyConcertThisWeek(userId, concert) {
        const title = '📅 Concert this week';
        const label = concert.title ?? concert.name ?? 'your concert';
        const venue = concert.venue ? ` at ${concert.venue}` : '';
        const city = concert.city ? ` (${concert.city})` : '';
        const message = `Heads up: ${label}${venue}${city} is coming up this week.`;
        return await NotificationService.createAndPush({
            userId,
            title,
            message,
            type: 'concert_week',
            concertId: concert.id,
        });
    },
    async notifyConcertStatusChange(userId, concert, status) {
        const label = concert.title ?? concert.name ?? 'your concert';
        const isSoldOut = status === 'sold_out';
        const title = isSoldOut
            ? '⚠ Concert is sold out'
            : '⚠ Concert was cancelled';
        const message = isSoldOut
            ? `${label} is now sold out.`
            : `${label} has been cancelled.`;
        return await NotificationService.createAndPush({
            userId,
            title,
            message,
            type: status === 'sold_out' ? 'concert_sold_out' : 'concert_cancelled',
            concertId: concert.id,
        });
    },
    async notifyNewConcertByPreferences(userId, concert) {
        const label = concert.title ?? concert.name ?? 'New concert';
        const artist = concert.artistName ? ` by ${concert.artistName}` : '';
        const city = concert.city ? ` in ${concert.city}` : '';
        const venue = concert.venue ? ` at ${concert.venue}` : '';
        const title = '✨ New concert you might like';
        const message = `${label}${artist}${venue}${city} matches your preferences.`;
        return await NotificationService.createAndPush({
            userId,
            title,
            message,
            type: 'new_by_preferences',
            concertId: concert.id,
        });
    },
};
exports.default = NotificationService;
