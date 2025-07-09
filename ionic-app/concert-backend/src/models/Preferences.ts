import { Pool, RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2/promise';
import pool from '../config/db';

interface UserPreference extends RowDataPacket {
  user_id: number;
  creation_date: Date;
  modify_date: Date;
  see_cancelled: boolean;
  see_not_available: boolean;
  notify_push: boolean;
}

interface UserArtist extends RowDataPacket {
  artist_id: number;
}

interface UserCity extends RowDataPacket {
  city_id: number;
}

interface UserGenre extends RowDataPacket {
  genre_id: number;
}

interface UserVenue extends RowDataPacket {
  venue_id: number;
}

const PreferencesModel = {
  // Get main preferences
  getPreferences: async (userId: number): Promise<UserPreference | null> => {
    const [rows] = await pool.query<UserPreference[]>(
      'SELECT * FROM preferences WHERE user_id = ?',
      [userId]
    );
    console.log('GET /api/preferences is here');
    return rows[0] || null;
  },

  // Update main preferences
  updatePreferences: async (
    userId: number,
    prefs: {
      see_cancelled?: boolean;
      see_not_available?: boolean;
      notify_push?: boolean;
    }
  ): Promise<void> => {
    await pool.query(
      `INSERT INTO preferences 
       (user_id, see_cancelled, see_not_available, notify_push, creation_date, modify_date)
       VALUES (?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
       see_cancelled = COALESCE(VALUES(see_cancelled), see_cancelled),
       see_not_available = COALESCE(VALUES(see_not_available), see_not_available),
       notify_push = COALESCE(VALUES(notify_push), notify_push),
       modify_date = NOW()`,
      [userId, prefs.see_cancelled, prefs.see_not_available, prefs.notify_push]
    );
  },

  // Artist preferences
  getUserArtists: async (userId: number): Promise<number[]> => {
    const [rows] = await pool.query<UserArtist[]>(
      'SELECT artist_id FROM user_artists WHERE user_id = ?',
      [userId]
    );
    return rows.map((row) => row.artist_id);
  },

  updateUserArtists: async (
    userId: number,
    artistIds: number[]
  ): Promise<void> => {
    await pool.query('START TRANSACTION');
    try {
      await pool.query('DELETE FROM user_artists WHERE user_id = ?', [userId]);
      if (artistIds.length > 0) {
        await pool.query(
          'INSERT INTO user_artists (user_id, artist_id) VALUES ?',
          [artistIds.map((id) => [userId, id])]
        );
      }
      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  },

  // City preferences
  getUserCities: async (userId: number): Promise<number[]> => {
    const [rows] = await pool.query<UserCity[]>(
      'SELECT city_id FROM user_cities WHERE user_id = ?',
      [userId]
    );
    return rows.map((row) => row.city_id);
  },

  updateUserCities: async (
    userId: number,
    cityIds: number[]
  ): Promise<void> => {
    await pool.query('START TRANSACTION');
    try {
      await pool.query('DELETE FROM user_cities WHERE user_id = ?', [userId]);
      if (cityIds.length > 0) {
        await pool.query(
          'INSERT INTO user_cities (user_id, city_id) VALUES ?',
          [cityIds.map((id) => [userId, id])]
        );
      }
      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  },

  getUserGenres: async (userId: number): Promise<number[]> => {
    const [rows] = await pool.query<UserGenre[]>(
      'SELECT genre_id FROM user_genres WHERE user_id = ?',
      [userId]
    );
    return rows.map((row) => row.genre_id);
  },

  updateUserGenres: async (
    userId: number,
    genreIds: number[]
  ): Promise<void> => {
    await pool.query('START TRANSACTION');
    try {
      await pool.query('DELETE FROM user_genres WHERE user_id = ?', [userId]);
      if (genreIds.length > 0) {
        await pool.query(
          'INSERT INTO user_genres (user_id, genre_id) VALUES ?',
          [genreIds.map((id) => [userId, id])]
        );
      }
      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  },

  // Venue preferences
  getUserVenues: async (userId: number): Promise<number[]> => {
    const [rows] = await pool.query<UserVenue[]>(
      'SELECT venue_id FROM user_venues WHERE user_id = ?',
      [userId]
    );
    return rows.map((row) => row.venue_id);
  },

  updateUserVenues: async (
    userId: number,
    venueIds: number[]
  ): Promise<void> => {
    await pool.query('START TRANSACTION');
    try {
      await pool.query('DELETE FROM user_venues WHERE user_id = ?', [userId]);
      if (venueIds.length > 0) {
        await pool.query(
          'INSERT INTO user_venues (user_id, venue_id) VALUES ?',
          [venueIds.map((id) => [userId, id])]
        );
      }
      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  },
};

export default PreferencesModel;
