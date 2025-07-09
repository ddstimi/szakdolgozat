import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../config/db';
import { IUser } from '../interfaces/IUser';
import { UserInfo } from 'os';

interface CreateUserData {
  name: string;
  username: string;
  email: string;
  hashedPassword: string;
  gdpr: boolean;
}
interface CountRow extends RowDataPacket {
  count: number;
}

interface userProfile {
  id: number;
  username: string;
  name: string;
  hashedPassword: string;
  gdpr: boolean;
  email: string;
}

const UserModel = {
  findByUsername: async (username: string): Promise<IUser | null> => {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, username, email, password, gdpr, img_url, register_date, last_login FROM users WHERE username = ?',
      [username]
    );
    return rows.length > 0 ? (rows[0] as IUser) : null;
  },

  findById: async (userId: number): Promise<IUser | null> => {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, username, email, gdpr, img_url, register_date, last_login FROM users WHERE id = ?',
      [userId.toString()]
    );
    return rows.length > 0 ? (rows[0] as IUser) : null;
  },

  createUser: async (userData: CreateUserData): Promise<number> => {
    const { name, username, email, hashedPassword, gdpr } = userData;
    const [result] = await pool.execute(
      `INSERT INTO users 
        (name, username, email, register_date, last_login, password, gdpr, img_url) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, NULL)`,
      [name, username, email, hashedPassword, gdpr.toString()]
    );
    return (result as ResultSetHeader).insertId;
  },

  findByEmail: async (email: string): Promise<IUser | null> => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [
      email,
    ]);
    const users = rows as IUser[];
    return users[0] || null;
  },

  updateLastLogin: async (userId: number): Promise<void> => {
    await pool.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [userId.toString()]
    );
  },

  usernameExists: async (username: string): Promise<boolean> => {
    const [rows] = await pool.execute<CountRow[]>(
      'SELECT COUNT(*) AS count FROM users WHERE username = ?',
      [username]
    );
    return rows[0].count > 0;
  },

  emailExists: async (email: string): Promise<boolean> => {
    const [rows] = await pool.execute<CountRow[]>(
      'SELECT COUNT(*) AS count FROM users WHERE email = ?',
      [email]
    );
    return rows[0].count > 0;
  },

  getUserInfo: async (userId: number): Promise<IUser | null> => {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [
      userId,
    ]);
    const users = rows as IUser[];
    return users[0] || null;
  },
  updateUserInfo: async (
    userId: number,
    updateFields: {
      name?: string;
      email?: string;
      username?: string;
      gdpr?: boolean;
      password?: string;
    }
  ): Promise<any> => {
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    values.push(userId.toString());

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await pool.execute(sql, values);

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [
      userId.toString(),
    ]);
    return (rows as any[])[0];
  },

  updateUserPic: async (userId: number, updateUrl: string): Promise<any> => {
    const sqlUpdate = `UPDATE users SET img_url = ? WHERE id = ?`;
    await pool.execute(sqlUpdate, [updateUrl, userId]);

    const sqlSelect = `SELECT id, username, email, img_url FROM users WHERE id = ?`;
    const [rows] = await pool.execute(sqlSelect, [userId]);
    const users = rows as IUser[];
    return users[0] || null;
  },
};

export default UserModel;
