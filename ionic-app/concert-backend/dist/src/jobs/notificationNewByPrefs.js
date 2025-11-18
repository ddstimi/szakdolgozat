"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// concert-backend/src/services/notifications/notificationNewByPrefs.ts
const NotificationScan_1 = __importDefault(require("../models/NotificationScan"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
const NewByPrefsNotifications = {
    async run() {
        console.log('✨ NewByPrefsNotifications.run()');
        const concerts = await NotificationScan_1.default.findNewConcertsNeedingPrefsNotification();
        console.log('  New concerts needing prefs notif:', concerts.length);
        for (const c of concerts) {
            const users = await NotificationScan_1.default.listUsersMatchingPreferences(c.id);
            const concertObj = {
                id: c.id,
                title: c.title || undefined,
                city: c.city_name || undefined,
                venue: c.venue_name || undefined,
                artistName: undefined, // you can join artist name if you want
            };
            for (const u of users) {
                await notificationService_1.default.notifyNewConcertByPreferences(u.user_id, concertObj);
            }
            await NotificationScan_1.default.markPrefsNotified(c.id);
        }
        console.log('✅ NewByPrefsNotifications finished');
    },
};
exports.default = NewByPrefsNotifications;
