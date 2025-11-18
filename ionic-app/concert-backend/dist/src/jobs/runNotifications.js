"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const notificationScheduler_1 = require("./notificationScheduler");
dotenv_1.default.config();
(async () => {
    try {
        await (0, notificationScheduler_1.runAllNotificationJobs)();
        console.log('Done.');
        process.exit(0);
    }
    catch (err) {
        console.error('Job failed', err);
        process.exit(1);
    }
})();
