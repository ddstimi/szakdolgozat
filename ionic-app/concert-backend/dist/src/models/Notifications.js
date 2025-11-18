"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../config/db"));
const NotificationsModel = {
    async listByUserId(userId, unreadOnly = false, limit = 100) {
        const [rows] = await db_1.default.query(`
      SELECT id, user_id, concert_id, sent_date, read_date, is_read, title, message, type
      FROM notifications
      WHERE user_id = ? ${unreadOnly ? 'AND is_read = 0' : ''}
      ORDER BY sent_date DESC
      LIMIT ?
      `, [userId, limit]);
        return rows;
    },
    async unreadCount(userId) {
        const [rows] = await db_1.default.query(`SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0`, [userId]);
        return Number(rows[0]?.cnt ?? 0);
    },
    async markRead(userId, id, read) {
        const [res] = await db_1.default.query(`
      UPDATE notifications
         SET is_read = ?, read_date = ${read ? 'NOW()' : 'NULL'}
       WHERE id = ? AND user_id = ?
      `, [read ? 1 : 0, id, userId]);
        return res.affectedRows > 0;
    },
    async create(input) {
        const { userId, title, message, type = null, concertId = null } = input;
        const [res] = await db_1.default.query(`
      INSERT INTO notifications (user_id, concert_id, sent_date, read_date, is_read, title, message, type)
      VALUES (?, ?, NOW(), NULL, 0, ?, ?, ?)
      `, [userId, concertId, title, message, type]);
        return res.insertId;
    },
};
exports.default = NotificationsModel;
