import { RowDataPacket } from 'mysql2/promise';
import pool from '../config/db';

const ConcertsModel = {
  getTopPicks: async (userId: number) => {
    try {
      let limit = 10;
      const map = new Map<number, RowDataPacket>();
      const [preferredConcerts] = await pool.query<RowDataPacket[]>(
        `
  SELECT c.id, c.title, c.date, c.description, c.ticket_url, c.ticket_available, c.cancelled,
         v.name AS venue_name, v.city_id, ci.name AS city_name,
         a.name AS artist_name
  FROM concerts c
  JOIN venues v ON c.venue_id = v.id
  JOIN cities ci ON v.city_id = ci.id
  JOIN artists a ON c.artist_id = a.id
  LEFT JOIN user_artists ua ON ua.artist_id = c.artist_id AND ua.user_id = ?
  LEFT JOIN user_venues uv ON uv.venue_id = c.venue_id AND uv.user_id = ?
  LEFT JOIN user_cities uc ON uc.city_id = v.city_id AND uc.user_id = ?
  WHERE c.date >= NOW() AND c.cancelled = FALSE
    AND (ua.user_id IS NOT NULL OR uv.user_id IS NOT NULL OR uc.user_id IS NOT NULL)
  ORDER BY c.date ASC
  LIMIT ?
`,
        [userId, userId, userId, limit]
      );

      if (preferredConcerts.length >= limit) return preferredConcerts;
      else {
        for (const concert of preferredConcerts) {
          map.set(concert.id, concert);
          limit--;
        }
      }

      const [popularConcerts] = await pool.query<RowDataPacket[]>(
        `
    SELECT c.id, c.title, c.date, c.description, c.ticket_url, c.ticket_available, c.cancelled,
           v.name AS venue_name, v.city_id, ci.name AS city_name,
           a.name AS artist_name, COUNT(att.id) AS going_count
    FROM concerts c
    JOIN venues v ON c.venue_id = v.id
    JOIN cities ci ON v.city_id = ci.id
    JOIN artists a ON c.artist_id = a.id
    LEFT JOIN attends att ON att.concert_id = c.id
    WHERE c.date >= NOW() AND c.cancelled = FALSE
    GROUP BY c.id
    ORDER BY going_count DESC
    LIMIT ?
  `,
        [limit]
      );

      if (popularConcerts.length >= limit) return popularConcerts;
      else {
        for (const concert of popularConcerts) {
          if (!map.has(concert.id)) {
            map.set(concert.id, concert);
            limit--;
          }
        }
      }

      const [upcomingConcerts] = await pool.query<RowDataPacket[]>(
        `
    SELECT c.id, c.title, c.date, c.description, c.ticket_url, c.ticket_available, c.cancelled,
           v.name AS venue_name, v.city_id, ci.name AS city_name,
           a.name AS artist_name
    FROM concerts c
    JOIN venues v ON c.venue_id = v.id
    JOIN cities ci ON v.city_id = ci.id
    JOIN artists a ON c.artist_id = a.id
    WHERE c.date >= NOW() AND c.cancelled = FALSE
    ORDER BY c.date ASC
    LIMIT ?
  `,
        [limit]
      );

      if (upcomingConcerts.length >= limit) return upcomingConcerts;
      else {
        for (const concert of upcomingConcerts) {
          if (!map.has(concert.id)) {
            map.set(concert.id, concert);
            limit--;
          }
        }
      }
      return Array.from(map.values());
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  getNearMe: async (city: string) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT c.id, c.title, c.date, c.description, c.ticket_url, c.ticket_available, c.cancelled,
               v.name AS venue_name, v.city_id, a.name AS artist_name
        FROM concerts c
        JOIN venues v ON c.venue_id = v.id
        JOIN artists a ON c.artist_id = a.id
        WHERE c.date >= NOW() AND c.cancelled = FALSE AND v.city_id = ?
        ORDER BY c.date ASC
        LIMIT 10
        `,
        [city]
      );
      return rows;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
};

export default ConcertsModel;
