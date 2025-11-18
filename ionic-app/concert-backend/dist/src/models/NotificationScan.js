"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../config/db"));
const NotificationScan = {
    /**
     * 1) CONCERTS SOLD OUT (ticket_available = 0, cancelled = 0)
     *    and not yet notified (sold_out_notified = 0)
     */
    async findSoldOutNeedingNotification() {
        const [rows] = await db_1.default.query(`
      SELECT
        c.id,
        c.title,
        c.date,
        c.artist_id,
        c.venue_id,
        c.ticket_available,
        c.cancelled,
        v.name         AS venue_name,
        ci.name        AS city_name
      FROM concerts c
      LEFT JOIN venues v ON c.venue_id = v.id
      LEFT JOIN cities ci ON v.city_id = ci.id
      WHERE c.ticket_available = 0
        AND c.cancelled = 0
        AND c.sold_out_notified = 0
      `);
        return rows;
    },
    /**
     * 2) CONCERTS CANCELLED (cancelled = 1)
     *    and not yet notified (cancelled_notified = 0)
     */
    async findCancelledNeedingNotification() {
        const [rows] = await db_1.default.query(`
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
      `);
        return rows;
    },
    async markSoldOutNotified(concertId) {
        await db_1.default.query(`UPDATE concerts SET sold_out_notified = 1 WHERE id = ?`, [concertId]);
    },
    async markCancelledNotified(concertId) {
        await db_1.default.query(`UPDATE concerts SET cancelled_notified = 1 WHERE id = ?`, [concertId]);
    },
    /**
     * Users explicitly attending a concert (attends table).
     * Used for "your concert is today / this week / sold-out / cancelled"
     */
    async listUsersForConcert(concertId) {
        const [rows] = await db_1.default.query(`
      SELECT user_id
      FROM attends
      WHERE concert_id = ?
      `, [concertId]);
        return rows;
    },
    /**
     * 3) CONCERTS HAPPENING TODAY (date = CURRENT_DATE)
     *    and not yet notified for today.
     */
    async findTodayNeedingNotification() {
        const [rows] = await db_1.default.query(`
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
      `);
        return rows;
    },
    async markTodayNotified(concertId) {
        await db_1.default.query(`UPDATE concerts SET today_notified = 1 WHERE id = ?`, [concertId]);
    },
    /**
     * 4) CONCERTS WITHIN NEXT 7 DAYS (excluding today),
     *    not yet notified as "week" reminders.
     */
    async findThisWeekNeedingNotification() {
        const [rows] = await db_1.default.query(`
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
      `);
        return rows;
    },
    async markThisWeekNotified(concertId) {
        await db_1.default.query(`UPDATE concerts SET week_notified = 1 WHERE id = ?`, [concertId]);
    },
    /**
     * 5) NEW CONCERTS THAT THE SYSTEM HASN'T YET CHECKED AGAINST USER PREFERENCES
     *    (prefs_notified = 0, future date, not cancelled).
     */
    async findNewConcertsNeedingPrefsNotification() {
        const [rows] = await db_1.default.query(`
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
      `);
        return rows;
    },
    /**
     * Users whose preferences match this concert:
     * - Has notify_push = 1 in preferences
     * - AND at least one of:
     *   * artist in user_artists
     *   * venue in user_venues
     *   * city in user_cities
     *   * (optionally) genre in user_genres / artist_genres
     *
     * Assumes the following tables:
     *  - preferences(id, user_id, ..., notify_push)
     *  - user_artists(user_id, artist_id)
     *  - user_venues(user_id, venue_id)
     *  - user_cities(user_id, city_id)
     *  - venues(id, name, city_id)
     */
    async listUsersMatchingPreferences(concertId) {
        const [rows] = await db_1.default.query(`
      SELECT DISTINCT u.id AS user_id
      FROM users u
      JOIN preferences p ON p.user_id = u.id
      JOIN concerts c     ON c.id = ?
      LEFT JOIN venues v  ON c.venue_id = v.id
      LEFT JOIN user_artists ua ON ua.user_id = u.id
      LEFT JOIN user_venues  uv ON uv.user_id = u.id
      LEFT JOIN user_cities  uc ON uc.user_id = u.id
      -- LEFT JOIN user_genres  ug ON ug.user_id = u.id
      -- LEFT JOIN artist_genres ag ON ag.artist_id = c.artist_id
      WHERE p.notify_push = 1
        AND (
          (ua.artist_id IS NOT NULL AND ua.artist_id = c.artist_id)
          OR (uv.venue_id  IS NOT NULL AND uv.venue_id  = c.venue_id)
          OR (uc.city_id   IS NOT NULL AND uc.city_id   = v.city_id)
          -- OR (ug.genre_id IS NOT NULL AND ag.genre_id IS NOT NULL AND ug.genre_id = ag.genre_id)
        )
      `, [concertId]);
        return rows;
    },
    async markPrefsNotified(concertId) {
        await db_1.default.query(`UPDATE concerts SET prefs_notified = 1 WHERE id = ?`, [concertId]);
    },
};
exports.default = NotificationScan;
