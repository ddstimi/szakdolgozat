import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import pool from '../config/db';

export interface NotificationRow extends RowDataPacket {
  id: number;
  user_id: number;
  concert_id: number | null;
  sent_date: string;
  read_date: string | null;
  is_read: 0 | 1;
  title: string;
  message: string;
  type: string | null;
}

export interface CreateNotificationInput {
  userId: number;
  title: string;
  message: string;
  type?: string | null;
  concertId?: number | null;
}

const NotificationsModel = {
  async listByUserId(
    userId: number,
    unreadOnly = false,
    limit = 99
  ): Promise<NotificationRow[]> {
    const [rows] = await pool.query<NotificationRow[]>(
      `
      SELECT id, user_id, concert_id, sent_date, read_date, is_read, title, message, type
      FROM notifications
      WHERE user_id = ? ${unreadOnly ? 'AND is_read = 0' : ''}
      ORDER BY sent_date DESC
      LIMIT ?
      `,
      [userId, limit]
    );
    return rows;
  },

  async unreadCount(userId: number): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    return Number((rows[0] as any)?.cnt ?? 0);
  },

  async markRead(userId: number, id: number, read: boolean): Promise<boolean> {
    const [res] = await pool.query<ResultSetHeader>(
      `
      UPDATE notifications
         SET is_read = ?, read_date = ${read ? 'NOW()' : 'NULL'}
       WHERE id = ? AND user_id = ?
      `,
      [read ? 1 : 0, id, userId]
    );
    return res.affectedRows > 0;
  },

  async create(input: CreateNotificationInput): Promise<number> {
    const { userId, title, message, type = null, concertId = null } = input;

    const [res] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO notifications (user_id, concert_id, sent_date, read_date, is_read, title, message, type)
      VALUES (?, ?, NOW(), NULL, 0, ?, ?, ?)
      `,
      [userId, concertId, title, message, type]
    );

    return res.insertId;
  },
};

export default NotificationsModel;
