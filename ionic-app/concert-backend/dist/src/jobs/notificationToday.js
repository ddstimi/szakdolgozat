"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// concert-backend/src/services/notifications/notificationToday.ts
const NotificationScan_1 = __importDefault(require("../models/NotificationScan"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
const TodayNotifications = {
    async run() {
        console.log('🔔 TodayNotifications.run()');
        const concerts = await NotificationScan_1.default.findTodayNeedingNotification();
        console.log('  Today needing notif:', concerts.length);
        for (const c of concerts) {
            const users = await NotificationScan_1.default.listUsersForConcert(c.id);
            const concertObj = {
                id: c.id,
                title: c.title || undefined,
                city: c.city_name || undefined,
                venue: c.venue_name || undefined,
            };
            for (const u of users) {
                await notificationService_1.default.notifyConcertToday(u.user_id, concertObj);
            }
            await NotificationScan_1.default.markTodayNotified(c.id);
        }
        console.log('✅ TodayNotifications finished');
    },
};
exports.default = TodayNotifications;
