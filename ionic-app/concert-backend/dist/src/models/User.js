"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../config/db"));
const UserModel = {
    findByUsername: async (username) => {
        const [rows] = await db_1.default.execute('SELECT id, username, email, password, gdpr, img_url, register_date, last_login FROM users WHERE username = ?', [username]);
        return rows.length > 0 ? rows[0] : null;
    },
    findById: async (userId) => {
        const [rows] = await db_1.default.execute('SELECT id, username, email, gdpr, img_url, register_date, last_login FROM users WHERE id = ?', [userId.toString()]);
        return rows.length > 0 ? rows[0] : null;
    },
    createUser: async (userData) => {
        const { name, username, email, hashedPassword, gdpr } = userData;
        const [result] = await db_1.default.execute(`INSERT INTO users 
        (name, username, email, register_date, last_login, password, gdpr, img_url) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, NULL)`, [name, username, email, hashedPassword, gdpr.toString()]);
        return result.insertId;
    },
    findByEmail: async (email) => {
        const [rows] = await db_1.default.query('SELECT * FROM users WHERE email = ?', [
            email,
        ]);
        const users = rows;
        return users[0] || null;
    },
    updateLastLogin: async (userId) => {
        await db_1.default.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [userId.toString()]);
    },
    usernameExists: async (username) => {
        const [rows] = await db_1.default.execute('SELECT COUNT(*) AS count FROM users WHERE username = ?', [username]);
        return rows[0].count > 0;
    },
    emailExists: async (email) => {
        const [rows] = await db_1.default.execute('SELECT COUNT(*) AS count FROM users WHERE email = ?', [email]);
        return rows[0].count > 0;
    },
    getUserInfo: async (userId) => {
        const [rows] = await db_1.default.query('SELECT * FROM users WHERE id = ?', [
            userId,
        ]);
        const users = rows;
        return users[0] || null;
    },
    updateUserInfo: async (userId, updateFields) => {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(updateFields)) {
            if (value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }
        values.push(userId.toString());
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        await db_1.default.execute(sql, values);
        const [rows] = await db_1.default.query('SELECT * FROM users WHERE id = ?', [
            userId.toString(),
        ]);
        return rows[0];
    },
    updateUserPic: async (userId, updateUrl) => {
        const sqlUpdate = `UPDATE users SET img_url = ? WHERE id = ?`;
        await db_1.default.execute(sqlUpdate, [updateUrl, userId]);
        const sqlSelect = `SELECT id, username, email, img_url FROM users WHERE id = ?`;
        const [rows] = await db_1.default.execute(sqlSelect, [userId]);
        const users = rows;
        return users[0] || null;
    },
    isAttendingConcert: async (userId, concertId) => {
        const [rows] = await db_1.default.execute('SELECT 1 FROM attends WHERE user_id = ? AND concert_id = ?', [userId, concertId]);
        return rows.length > 0;
    },
    addAttendance: async (userId, concertId) => {
        await db_1.default.execute('INSERT INTO attends (user_id, concert_id) VALUES (?, ?)', [userId, concertId]);
    },
    removeAttendance: async (userId, concertId) => {
        await db_1.default.execute('DELETE FROM attends WHERE user_id = ? AND concert_id = ?', [userId, concertId]);
    },
};
exports.default = UserModel;
