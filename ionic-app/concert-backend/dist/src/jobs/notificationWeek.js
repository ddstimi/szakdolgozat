"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// concert-backend/src/services/notifications/notificationWeek.ts
const NotificationScan_1 = __importDefault(require("../models/NotificationScan"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
const WeekNotifications = {
    async run() {
        console.log('📅 WeekNotifications.run()');
        const concerts = await NotificationScan_1.default.findThisWeekNeedingNotification();
        console.log('  This week needing notif:', concerts.length);
        for (const c of concerts) {
            const users = await NotificationScan_1.default.listUsersForConcert(c.id);
            const concertObj = {
                id: c.id,
                title: c.title || undefined,
                city: c.city_name || undefined,
                venue: c.venue_name || undefined,
            };
            for (const u of users) {
                await notificationService_1.default.notifyConcertThisWeek(u.user_id, concertObj);
            }
            await NotificationScan_1.default.markThisWeekNotified(c.id);
        }
        console.log('✅ WeekNotifications finished');
    },
};
exports.default = WeekNotifications;
