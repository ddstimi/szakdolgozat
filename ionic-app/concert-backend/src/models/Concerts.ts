import { RowDataPacket } from 'mysql2/promise';
import pool from '../config/db';

interface Concert extends RowDataPacket {
  id: number;
  title: string;
  date: string;
  description: string;
  ticket_url: string;
  ticket_available: boolean;
  cancelled: boolean;
  venue_name: string;
  city_id: number;
  city_name: string;
  artist_name: string;
  image?: string;
  genre?: string[];
}

const ConcertsModel = {
  getTopPicks: async (userId: number): Promise<Concert[]> => {
    try {
      const limit = 10;
      const map = new Map<number, Concert>();

      const [preferredConcerts] = await pool.query<Concert[]>(
        `
        SELECT c.id, c.title, c.date, c.description, c.ticket_url, c.ticket_available, c.cancelled, c.image,
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

      for (const concert of preferredConcerts) {
        map.set(concert.id, concert);
      }
      let remaining = limit - preferredConcerts.length;

      if (map.size >= limit) return Array.from(map.values());
      const [popularConcerts] = await pool.query<Concert[]>(
        `
        SELECT c.id, c.title, c.date, c.description, c.ticket_url, c.ticket_available, c.cancelled, c.image,
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
        [remaining]
      );

      for (const concert of popularConcerts) {
        if (!map.has(concert.id)) {
          map.set(concert.id, concert);
        }
      }
      remaining = limit - map.size;
      if (remaining <= 0) return Array.from(map.values());
      if (map.size >= 10) return Array.from(map.values());

      const [upcomingConcerts] = await pool.query<Concert[]>(
        `
        SELECT c.id, c.title, c.date, c.description, c.ticket_url, c.ticket_available, c.cancelled, c.image,
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
        [remaining]
      );

      for (const concert of upcomingConcerts) {
        if (!map.has(concert.id)) {
          map.set(concert.id, concert);
        }
      }

      return Array.from(map.values());
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
  getUpcoming: async (): Promise<Concert[]> => {
    const limit = 10;
    try {
      const [concerts] = await pool.query<Concert[]>(
        `
        SELECT c.id, c.title, c.date, c.description, c.ticket_url, c.ticket_available, c.cancelled, c.image,
               v.name AS venue_name, v.city_id, ci.name AS city_name,
               a.name AS artist_name,
             GROUP_CONCAT(g.name) AS genre

        FROM concerts c
        JOIN venues v ON c.venue_id = v.id
        JOIN cities ci ON v.city_id = ci.id
        JOIN artists a ON c.artist_id = a.id
      LEFT JOIN artist_genres ag ON ag.artist_id = a.id
      LEFT JOIN genres g ON g.id = ag.genre_id WHERE c.date >= NOW() AND c.cancelled = FALSE
GROUP BY 
    c.id, c.title, c.date, c.description, c.ticket_url, 
    c.ticket_available, c.cancelled, c.image,
    v.name, v.city_id, ci.name, a.name  ORDER BY c.date ASC    
  LIMIT ?
        `,
        [limit]
      );

      return concerts;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  getUpcomingByUserId: async (userId: number): Promise<Concert[]> => {
    try {
      const [concerts] = await pool.query<Concert[]>(
        `
        SELECT c.id, c.title, c.date, c.description, c.ticket_url, c.ticket_available, c.cancelled, c.image,
               v.name AS venue_name, v.city_id, ci.name AS city_name,
               a.name AS artist_name,
             GROUP_CONCAT(g.name) AS genre

        FROM concerts c
        JOIN venues v ON c.venue_id = v.id
        JOIN cities ci ON v.city_id = ci.id
        JOIN artists a ON c.artist_id = a.id
      LEFT JOIN artist_genres ag ON ag.artist_id = a.id
      LEFT JOIN genres g ON g.id = ag.genre_id
WHERE c.id IN (
    SELECT concert_id
    FROM attends
    WHERE user_id = ?
)
AND c.date >= NOW()

GROUP BY c.id
        `,
        [userId]
      );

      return concerts;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  getPastByUserId: async (userId: number): Promise<Concert[]> => {
    try {
      const [concerts] = await pool.query<Concert[]>(
        `
        SELECT c.id, c.title, c.date, c.description, c.ticket_url, c.ticket_available, c.cancelled, c.image,
               v.name AS venue_name, v.city_id, ci.name AS city_name,
               a.name AS artist_name,
             GROUP_CONCAT(g.name) AS genre

        FROM concerts c
        JOIN venues v ON c.venue_id = v.id
        JOIN cities ci ON v.city_id = ci.id
        JOIN artists a ON c.artist_id = a.id
      LEFT JOIN artist_genres ag ON ag.artist_id = a.id
      LEFT JOIN genres g ON g.id = ag.genre_id
WHERE c.id IN (
    SELECT concert_id
    FROM attends
    WHERE user_id = ?
)
AND c.date < NOW()

GROUP BY c.id
        `,
        [userId]
      );

      return concerts;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  getPopular: async (): Promise<Concert[]> => {
    try {
      const limit = 20;
      const map = new Map<number, Concert>();
      const [popularConcerts] = await pool.query<Concert[]>(
        `
         SELECT c.id, c.title, c.date, c.description, c.ticket_url, c.ticket_available, c.cancelled, c.image,
             v.name AS venue_name, v.city_id, ci.name AS city_name,
             a.name AS artist_name,
             GROUP_CONCAT(g.name) AS genre,
             COUNT(att.id) AS going_count
      FROM concerts c
      JOIN venues v ON c.venue_id = v.id
      JOIN cities ci ON v.city_id = ci.id
      JOIN artists a ON c.artist_id = a.id
      LEFT JOIN attends att ON att.concert_id = c.id
      LEFT JOIN artist_genres ag ON ag.artist_id = a.id
      LEFT JOIN genres g ON g.id = ag.genre_id
      WHERE c.date >= NOW() AND c.cancelled = FALSE
      GROUP BY c.id
      ORDER BY going_count DESC
        LIMIT ?
        `,
        [limit]
      );

      for (const concert of popularConcerts) {
        if (!map.has(concert.id)) {
          map.set(concert.id, concert);
        }
      }
      let remaining = limit - map.size;
      if (map.size >= 10) return Array.from(map.values());

      const [upcomingConcerts] = await pool.query<Concert[]>(
        `
        SELECT c.id, c.title, c.date, c.description, c.ticket_url, c.ticket_available, c.cancelled, c.image,
               v.name AS venue_name, v.city_id, ci.name AS city_name,
               a.name AS artist_name,
             GROUP_CONCAT(g.name) AS genre

        FROM concerts c
        JOIN venues v ON c.venue_id = v.id
        JOIN cities ci ON v.city_id = ci.id
        JOIN artists a ON c.artist_id = a.id
      LEFT JOIN artist_genres ag ON ag.artist_id = a.id
      LEFT JOIN genres g ON g.id = ag.genre_id

        WHERE c.date >= NOW() AND c.cancelled = FALSE
        ORDER BY c.date ASC
        LIMIT ?
        `,
        [remaining]
      );

      for (const concert of upcomingConcerts) {
        if (!map.has(concert.id)) {
          map.set(concert.id, concert);
        }
      }

      return Array.from(map.values());
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
};

export default ConcertsModel;
