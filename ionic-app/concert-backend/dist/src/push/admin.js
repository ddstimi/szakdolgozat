"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messaging = messaging;
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
const fs_1 = __importDefault(require("fs"));
function messaging() {
    if (!(0, app_1.getApps)().length) {
        const creds = JSON.parse(fs_1.default.readFileSync(process.env.FIREBASE_CREDENTIALS, 'utf8'));
        (0, app_1.initializeApp)({ credential: (0, app_1.cert)(creds) });
    }
    return (0, messaging_1.getMessaging)();
}
