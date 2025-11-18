"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const NotificationScan_1 = __importDefault(require("../models/NotificationScan"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
const notificationsStatusChange = {
    async run() {
        console.log('🔍 StatusChangeNotifications.run()');
        const soldOut = await NotificationScan_1.default.findSoldOutNeedingNotification();
        console.log('  Sold out needing notif:', soldOut.length);
        for (const c of soldOut) {
            const users = await NotificationScan_1.default.listUsersForConcert(c.id);
            const concertObj = {
                id: c.id,
                title: c.title || undefined,
                city: c.city || undefined,
                venue: c.venue || undefined,
            };
            for (const u of users) {
                await notificationService_1.default.notifyConcertStatusChange(u.user_id, concertObj, 'sold_out');
            }
            await NotificationScan_1.default.markSoldOutNotified(c.id);
        }
        // 2) Cancelled
        const cancelled = await NotificationScan_1.default.findCancelledNeedingNotification();
        console.log('  Cancelled needing notif:', cancelled.length);
        for (const c of cancelled) {
            const users = await NotificationScan_1.default.listUsersForConcert(c.id);
            const concertObj = {
                id: c.id,
                title: c.title || undefined,
                city: c.city || undefined,
                venue: c.venue || undefined,
            };
            for (const u of users) {
                await notificationService_1.default.notifyConcertStatusChange(u.user_id, concertObj, 'cancelled');
            }
            await NotificationScan_1.default.markCancelledNotified(c.id);
        }
        console.log('✅ StatusChangeNotifications finished');
    },
};
exports.default = notificationsStatusChange;
