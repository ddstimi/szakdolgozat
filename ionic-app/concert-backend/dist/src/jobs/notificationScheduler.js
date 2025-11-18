"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllNotificationJobs = runAllNotificationJobs;
const notificationStatusChange_1 = __importDefault(require("./notificationStatusChange"));
const notificationToday_1 = __importDefault(require("./notificationToday"));
const notificationWeek_1 = __importDefault(require("./notificationWeek"));
const notificationNewByPrefs_1 = __importDefault(require("./notificationNewByPrefs"));
async function runAllNotificationJobs() {
    console.log('Running notification jobs...');
    await notificationStatusChange_1.default.run();
    await notificationToday_1.default.run();
    await notificationWeek_1.default.run();
    await notificationNewByPrefs_1.default.run();
    console.log('Notification jobs finished');
}
