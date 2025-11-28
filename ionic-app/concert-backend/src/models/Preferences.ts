import { RowDataPacket } from 'mysql2/promise';
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

interface Artist extends RowDataPacket {
  id: number;
  name: string;
}

interface City extends RowDataPacket {
  id: number;
  name: string;
}

interface Genre extends RowDataPacket {
  id: number;
  name: string;
}

interface Venue extends RowDataPacket {
  id: number;
  name: string;
}

const PreferencesModel = {
  async getPreferences(userId: number): Promise<UserPreference | null> {
    const [rows] = await pool.query<UserPreference[]>(
      'SELECT * FROM preferences WHERE user_id = ?',
      [userId]
    );
    return rows[0] || null;
  },

  async updatePreferences(
    userId: number,
    prefs: {
      see_cancelled?: boolean;
      see_not_available?: boolean;
      notify_push?: boolean;
    }
  ): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const seeCancelledNum = prefs.see_cancelled ? 1 : 0;
      const seeNotAvailableNum = prefs.see_not_available ? 1 : 0;
      const notifyPushNum = prefs.notify_push ? 1 : 0;

      await connection.query(
        `
        INSERT INTO preferences 
          (user_id, see_cancelled, see_not_available, notify_push, creation_date, modify_date)
        VALUES (?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          see_cancelled = VALUES(see_cancelled),
          see_not_available = VALUES(see_not_available),
          notify_push = VALUES(notify_push),
          modify_date = NOW()
        `,
        [userId, seeCancelledNum, seeNotAvailableNum, notifyPushNum]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async getUserArtists(userId: number): Promise<number[]> {
    const [rows] = await pool.query<UserArtist[]>(
      'SELECT artist_id FROM user_artists WHERE user_id = ?',
      [userId]
    );
    return rows.map((row) => row.artist_id);
  },

  async updateUserArtists(userId: number, artistIds: number[]): Promise<void> {
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

  async getUserCities(userId: number): Promise<number[]> {
    const [rows] = await pool.query<UserCity[]>(
      'SELECT city_id FROM user_cities WHERE user_id = ?',
      [userId]
    );
    return rows.map((row) => row.city_id);
  },

  async updateUserCities(userId: number, cityIds: number[]): Promise<void> {
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

  async getUserGenres(userId: number): Promise<number[]> {
    const [rows] = await pool.query<UserGenre[]>(
      'SELECT genre_id FROM user_genres WHERE user_id = ?',
      [userId]
    );
    return rows.map((row) => row.genre_id);
  },

  async updateUserGenres(userId: number, genreIds: number[]): Promise<void> {
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

  async getUserVenues(userId: number): Promise<number[]> {
    const [rows] = await pool.query<UserVenue[]>(
      'SELECT venue_id FROM user_venues WHERE user_id = ?',
      [userId]
    );
    return rows.map((row) => row.venue_id);
  },

  async updateUserVenues(userId: number, venueIds: number[]): Promise<void> {
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

  async getAvailableArtists(): Promise<Artist[]> {
    const [rows] = await pool.query<Artist[]>('SELECT id, name FROM artists');
    return rows;
  },

  async getAvailableCities(): Promise<City[]> {
    const [rows] = await pool.query<City[]>('SELECT id, name FROM cities');
    return rows;
  },

  async getAvailableGenres(): Promise<Genre[]> {
    const [rows] = await pool.query<Genre[]>('SELECT id, name FROM genres');
    return rows;
  },

  async getAvailableVenues(): Promise<Venue[]> {
    const [rows] = await pool.query<Venue[]>('SELECT id, name FROM venues');
    return rows;
  },

  async getPreferencesWithNames(userId: number): Promise<any> {
    const [prefs, artists, cities, genres, venues] = await Promise.all([
      PreferencesModel.getPreferences(userId),
      PreferencesModel.getUserArtistsWithNames(userId),
      PreferencesModel.getUserCitiesWithNames(userId),
      PreferencesModel.getUserGenresWithNames(userId),
      PreferencesModel.getUserVenuesWithNames(userId),
    ]);

    return {
      ...prefs,
      artists,
      cities,
      genres,
      venues,
    };
  },

  async getUserArtistsWithNames(userId: number): Promise<Artist[]> {
    const [rows] = await pool.query<Artist[]>(
      `
      SELECT a.id, a.name 
      FROM artists a
      JOIN user_artists ua ON a.id = ua.artist_id
      WHERE ua.user_id = ?
      `,
      [userId]
    );
    return rows;
  },

  async getUserCitiesWithNames(userId: number): Promise<City[]> {
    const [rows] = await pool.query<City[]>(
      `
      SELECT c.id, c.name 
      FROM cities c
      JOIN user_cities uc ON c.id = uc.city_id
      WHERE uc.user_id = ?
      `,
      [userId]
    );
    return rows;
  },

  async getUserGenresWithNames(userId: number): Promise<Genre[]> {
    const [rows] = await pool.query<Genre[]>(
      `
      SELECT g.id, g.name 
      FROM genres g
      JOIN user_genres ug ON g.id = ug.genre_id
      WHERE ug.user_id = ?
      `,
      [userId]
    );
    return rows;
  },

  async getUserVenuesWithNames(userId: number): Promise<Venue[]> {
    const [rows] = await pool.query<Venue[]>(
      `
      SELECT v.id, v.name 
      FROM venues v
      JOIN user_venues uv ON v.id = uv.venue_id
      WHERE uv.user_id = ?
      `,
      [userId]
    );
    return rows;
  },
};

export default PreferencesModel;
