import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import pool from '../config/db';

export interface ConcertForNotifyRow extends RowDataPacket {
  id: number;
  title: string | null;
  city_name: string | null;
  venue_name: string | null;
  date: string | null;
  artist_id: number | null;
  venue_id: number | null;
  ticket_available: number | null;
  cancelled: number;
}

export interface ConcertUserRow extends RowDataPacket {
  user_id: number;
}

const NotificationScan = {
  async findSoldOutNeedingNotification(): Promise<ConcertForNotifyRow[]> {
    const [rows] = await pool.query<ConcertForNotifyRow[]>(
      `
      SELECT
        c.id,
        c.title,
        c.date,
        c.artist_id,
        c.venue_id,
        c.ticket_available,
        c.cancelled,
        v.name  AS venue_name,
        ci.name AS city_name
      FROM concerts c
      LEFT JOIN venues v ON c.venue_id = v.id
      LEFT JOIN cities ci ON v.city_id = ci.id
      WHERE c.ticket_available = 0
        AND c.cancelled = 0
        AND c.sold_out_notified = 0
      `
    );
    return rows;
  },

  async findCancelledNeedingNotification(): Promise<ConcertForNotifyRow[]> {
    const [rows] = await pool.query<ConcertForNotifyRow[]>(
      `
      SELECT
        c.id,
        c.title,
        c.date,
        c.artist_id,
        c.venue_id,
        c.ticket_available,
        c.cancelled,
        v.name  AS venue_name,
        ci.name AS city_name
      FROM concerts c
      LEFT JOIN venues v ON c.venue_id = v.id
      LEFT JOIN cities ci ON v.city_id = ci.id
      WHERE c.cancelled = 1
        AND c.cancelled_notified = 0
      `
    );
    return rows;
  },

  async markSoldOutNotified(concertId: number): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE concerts SET sold_out_notified = 1 WHERE id = ?`,
      [concertId]
    );
  },

  async markCancelledNotified(concertId: number): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE concerts SET cancelled_notified = 1 WHERE id = ?`,
      [concertId]
    );
  },

  async listUsersForConcert(concertId: number): Promise<ConcertUserRow[]> {
    const [rows] = await pool.query<ConcertUserRow[]>(
      `
      SELECT user_id
      FROM attends
      WHERE concert_id = ?
      `,
      [concertId]
    );
    return rows;
  },

  async findTodayNeedingNotification(): Promise<ConcertForNotifyRow[]> {
    const [rows] = await pool.query<ConcertForNotifyRow[]>(
      `
      SELECT
        c.id,
        c.title,
        c.date,
        c.artist_id,
        c.venue_id,
        c.ticket_available,
        c.cancelled,
        v.name  AS venue_name,
        ci.name AS city_name
      FROM concerts c
      LEFT JOIN venues v ON c.venue_id = v.id
      LEFT JOIN cities ci ON v.city_id = ci.id
      WHERE DATE(c.date) = CURRENT_DATE
        AND c.cancelled = 0
        AND c.today_notified = 0
      `
    );
    return rows;
  },

  async markTodayNotified(concertId: number): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE concerts SET today_notified = 1 WHERE id = ?`,
      [concertId]
    );
  },

  async findThisWeekNeedingNotification(): Promise<ConcertForNotifyRow[]> {
    const [rows] = await pool.query<ConcertForNotifyRow[]>(
      `
      SELECT
        c.id,
        c.title,
        c.date,
        c.artist_id,
        c.venue_id,
        c.ticket_available,
        c.cancelled,
        v.name  AS venue_name,
        ci.name AS city_name
      FROM concerts c
      LEFT JOIN venues v ON c.venue_id = v.id
      LEFT JOIN cities ci ON v.city_id = ci.id
      WHERE DATE(c.date) > CURRENT_DATE
        AND DATE(c.date) <= DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
        AND c.cancelled = 0
        AND c.week_notified = 0
      `
    );
    return rows;
  },

  async markThisWeekNotified(concertId: number): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE concerts SET week_notified = 1 WHERE id = ?`,
      [concertId]
    );
  },

  async findNewConcertsNeedingPrefsNotification(): Promise<
    ConcertForNotifyRow[]
  > {
    const [rows] = await pool.query<ConcertForNotifyRow[]>(
      `
      SELECT
        c.id,
        c.title,
        c.date,
        c.artist_id,
        c.venue_id,
        c.ticket_available,
        c.cancelled,
        v.name  AS venue_name,
        ci.name AS city_name
      FROM concerts c
      LEFT JOIN venues v ON c.venue_id = v.id
      LEFT JOIN cities ci ON v.city_id = ci.id
      WHERE c.prefs_notified = 0
        AND c.cancelled = 0
        AND c.date >= NOW()
      `
    );
    return rows;
  },

  async listUsersMatchingPreferences(
    concertId: number
  ): Promise<ConcertUserRow[]> {
    const [rows] = await pool.query<ConcertUserRow[]>(
      `
      SELECT DISTINCT u.id AS user_id
      FROM users u
      JOIN preferences p ON p.user_id = u.id
      JOIN concerts c     ON c.id = ?
      LEFT JOIN venues v  ON c.venue_id = v.id
      LEFT JOIN user_artists ua ON ua.user_id = u.id
      LEFT JOIN user_venues  uv ON uv.user_id = u.id
      LEFT JOIN user_cities  uc ON uc.user_id = u.id
      WHERE p.notify_push = 1
        AND (
          (ua.artist_id IS NOT NULL AND ua.artist_id = c.artist_id)
          OR (uv.venue_id  IS NOT NULL AND uv.venue_id  = c.venue_id)
          OR (uc.city_id   IS NOT NULL AND uc.city_id   = v.city_id)
        )
      `,
      [concertId]
    );
    return rows;
  },

  async markPrefsNotified(concertId: number): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE concerts SET prefs_notified = 1 WHERE id = ?`,
      [concertId]
    );
  },
};

export default NotificationScan;
