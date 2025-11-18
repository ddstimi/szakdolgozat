"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = require("../push/admin");
const PushNotification_1 = __importDefault(require("../models/PushNotification"));
const PushService = {
    async sendToUser(userId, payload) {
        const tokens = await PushNotification_1.default.listActiveTokensByUserId(userId);
        if (!tokens.length) {
            console.log('No active tokens for user', userId);
            return;
        }
        console.log('Sending push to tokens:', tokens);
        const resp = await (0, admin_1.messaging)().sendEachForMulticast({
            tokens,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: {
                title: payload.title,
                body: payload.body,
                type: payload.type ?? '',
                linkUrl: payload.linkUrl ?? '',
                metadata: JSON.stringify(payload.metadata ?? {}),
            },
        });
        console.log('FCM sendEachForMulticast result:', 'success:', resp.successCount, 'failure:', resp.failureCount);
        resp.responses.forEach((r, i) => {
            if (!r.success) {
                console.error('FCM send error for token', tokens[i], r.error?.code, r.error?.message);
            }
        });
        const bad = [];
        resp.responses.forEach((r, i) => {
            if (!r.success) {
                const code = r.error?.code || '';
                if (code.includes('registration-token-not-registered') ||
                    code.includes('invalid-argument')) {
                    bad.push(tokens[i]);
                }
            }
        });
        if (bad.length) {
            console.log('Pruning invalid tokens:', bad);
            await PushNotification_1.default.pruneInvalid(bad);
        }
    },
};
exports.default = PushService;
