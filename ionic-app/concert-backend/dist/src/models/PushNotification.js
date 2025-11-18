"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../config/db"));
const PushModel = {
    async upsert(userId, token, platform) {
        await db_1.default.query(`INSERT INTO push_tokens (token, user_id, platform)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), platform = VALUES(platform), revoked_at = NULL`, [token, userId, platform]);
    },
    async revoke(userId, token) {
        await db_1.default.query(`UPDATE push_tokens SET revoked_at = NOW() WHERE token = ? AND user_id = ?`, [token, userId]);
    },
    async listActiveTokensByUserId(userId) {
        const [rows] = await db_1.default.query(`SELECT token FROM push_tokens WHERE user_id = ? AND revoked_at IS NULL`, [userId]);
        return rows.map((r) => r.token);
    },
    async pruneInvalid(tokens) {
        if (!tokens.length)
            return;
        const placeholders = tokens.map(() => '?').join(',');
        await db_1.default.query(`UPDATE push_tokens SET revoked_at = NOW() WHERE token IN (${placeholders})`, tokens);
    },
};
exports.default = PushModel;
