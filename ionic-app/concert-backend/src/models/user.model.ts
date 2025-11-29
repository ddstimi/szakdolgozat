import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../config/db';

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

export interface IUser {
  id?: number;
  name: string;
  username: string;
  email: string;
  password?: string;
  gdpr: boolean;
  img_url?: string;
  register_date?: Date;
  last_login?: Date;
}

export interface UserProfile {
  id: number;
  username: string;
  name: string;
  hashedPassword: string;
  gdpr: boolean;
  email: string;
}

const UserModel = {
  async findByUsername(username: string): Promise<IUser | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `
      SELECT id, username, email, password, gdpr, img_url, register_date, last_login
      FROM users
      WHERE username = ?
      `,
      [username]
    );
    return rows.length > 0 ? (rows[0] as IUser) : null;
  },

  async findById(userId: number): Promise<IUser | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `
      SELECT id, username, email, gdpr, img_url, register_date, last_login
      FROM users
      WHERE id = ?
      `,
      [userId.toString()]
    );
    return rows.length > 0 ? (rows[0] as IUser) : null;
  },

  async createUser(userData: CreateUserData): Promise<number> {
    const { name, username, email, hashedPassword, gdpr } = userData;
    const [result] = await pool.execute<ResultSetHeader>(
      `
      INSERT INTO users 
        (name, username, email, register_date, last_login, password, gdpr, img_url) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, NULL)
      `,
      [name, username, email, hashedPassword, gdpr.toString()]
    );
    return result.insertId;
  },

  async findByEmail(email: string): Promise<IUser | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    const users = rows as IUser[];
    return users[0] || null;
  },

  async updateLastLogin(userId: number): Promise<void> {
    await pool.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [userId.toString()]
    );
  },

  async usernameExists(username: string): Promise<boolean> {
    const [rows] = await pool.execute<CountRow[]>(
      'SELECT COUNT(*) AS count FROM users WHERE username = ?',
      [username]
    );
    return rows[0].count > 0;
  },

  async emailExists(email: string): Promise<boolean> {
    const [rows] = await pool.execute<CountRow[]>(
      'SELECT COUNT(*) AS count FROM users WHERE email = ?',
      [email]
    );
    return rows[0].count > 0;
  },

  async getUserInfo(userId: number): Promise<IUser | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    const users = rows as IUser[];
    return users[0] || null;
  },

  async updateUserInfo(
    userId: number,
    updateFields: {
      name?: string;
      email?: string;
      username?: string;
      gdpr?: boolean;
      password?: string;
    }
  ): Promise<IUser | null> {
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (!fields.length) {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM users WHERE id = ?',
        [userId.toString()]
      );
      return (rows as IUser[])[0] || null;
    }

    values.push(userId.toString());

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await pool.execute(sql, values);

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [userId.toString()]
    );
    return (rows as IUser[])[0] || null;
  },

  async updateUserPic(
    userId: number,
    updateUrl: string
  ): Promise<IUser | null> {
    await pool.execute('UPDATE users SET img_url = ? WHERE id = ?', [
      updateUrl,
      userId,
    ]);

    const [rows] = await pool.execute<RowDataPacket[]>(
      `
      SELECT id, username, email, img_url
      FROM users
      WHERE id = ?
      `,
      [userId]
    );
    const users = rows as IUser[];
    return users[0] || null;
  },

  async isAttendingConcert(
    userId: number,
    concertId: number
  ): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT 1 FROM attends WHERE user_id = ? AND concert_id = ?',
      [userId, concertId]
    );
    return (rows as any[]).length > 0;
  },

  async addAttendance(userId: number, concertId: number): Promise<void> {
    await pool.execute(
      'INSERT INTO attends (user_id, concert_id) VALUES (?, ?)',
      [userId, concertId]
    );
  },

  async removeAttendance(userId: number, concertId: number): Promise<void> {
    await pool.execute(
      'DELETE FROM attends WHERE user_id = ? AND concert_id = ?',
      [userId, concertId]
    );
  },
};

export default UserModel;
