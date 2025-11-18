"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../config/db"));
const PreferencesModel = {
    getPreferences: async (userId) => {
        const [rows] = await db_1.default.query('SELECT * FROM preferences WHERE user_id = ?', [userId]);
        console.log('GET /api/preferences is here');
        return rows[0] || null;
    },
    updatePreferences: async (userId, prefs) => {
        const connection = await db_1.default.getConnection();
        try {
            await connection.beginTransaction();
            const seeCancelledNum = prefs.see_cancelled ? 1 : 0;
            const seeNotAvailableNum = prefs.see_not_available ? 1 : 0;
            const notifyPushNum = prefs.notify_push ? 1 : 0;
            await connection.query(`INSERT INTO preferences 
       (user_id, see_cancelled, see_not_available, notify_push, creation_date, modify_date)
       VALUES (?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
       see_cancelled = VALUES(see_cancelled),
       see_not_available = VALUES(see_not_available),
       notify_push = VALUES(notify_push),
       modify_date = NOW()`, [userId, seeCancelledNum, seeNotAvailableNum, notifyPushNum]);
            await connection.commit();
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    },
    getUserArtists: async (userId) => {
        const [rows] = await db_1.default.query('SELECT artist_id FROM user_artists WHERE user_id = ?', [userId]);
        return rows.map((row) => row.artist_id);
    },
    updateUserArtists: async (userId, artistIds) => {
        await db_1.default.query('START TRANSACTION');
        try {
            await db_1.default.query('DELETE FROM user_artists WHERE user_id = ?', [userId]);
            if (artistIds.length > 0) {
                await db_1.default.query('INSERT INTO user_artists (user_id, artist_id) VALUES ?', [artistIds.map((id) => [userId, id])]);
            }
            await db_1.default.query('COMMIT');
        }
        catch (error) {
            await db_1.default.query('ROLLBACK');
            throw error;
        }
    },
    getUserCities: async (userId) => {
        const [rows] = await db_1.default.query('SELECT city_id FROM user_cities WHERE user_id = ?', [userId]);
        return rows.map((row) => row.city_id);
    },
    updateUserCities: async (userId, cityIds) => {
        await db_1.default.query('START TRANSACTION');
        try {
            await db_1.default.query('DELETE FROM user_cities WHERE user_id = ?', [userId]);
            if (cityIds.length > 0) {
                await db_1.default.query('INSERT INTO user_cities (user_id, city_id) VALUES ?', [cityIds.map((id) => [userId, id])]);
            }
            await db_1.default.query('COMMIT');
        }
        catch (error) {
            await db_1.default.query('ROLLBACK');
            throw error;
        }
    },
    getUserGenres: async (userId) => {
        const [rows] = await db_1.default.query('SELECT genre_id FROM user_genres WHERE user_id = ?', [userId]);
        return rows.map((row) => row.genre_id);
    },
    updateUserGenres: async (userId, genreIds) => {
        await db_1.default.query('START TRANSACTION');
        try {
            await db_1.default.query('DELETE FROM user_genres WHERE user_id = ?', [userId]);
            if (genreIds.length > 0) {
                await db_1.default.query('INSERT INTO user_genres (user_id, genre_id) VALUES ?', [genreIds.map((id) => [userId, id])]);
            }
            await db_1.default.query('COMMIT');
        }
        catch (error) {
            await db_1.default.query('ROLLBACK');
            throw error;
        }
    },
    getUserVenues: async (userId) => {
        const [rows] = await db_1.default.query('SELECT venue_id FROM user_venues WHERE user_id = ?', [userId]);
        return rows.map((row) => row.venue_id);
    },
    updateUserVenues: async (userId, venueIds) => {
        await db_1.default.query('START TRANSACTION');
        try {
            await db_1.default.query('DELETE FROM user_venues WHERE user_id = ?', [userId]);
            if (venueIds.length > 0) {
                await db_1.default.query('INSERT INTO user_venues (user_id, venue_id) VALUES ?', [venueIds.map((id) => [userId, id])]);
            }
            await db_1.default.query('COMMIT');
        }
        catch (error) {
            await db_1.default.query('ROLLBACK');
            throw error;
        }
    },
    getAvailableArtists: async () => {
        const [rows] = await db_1.default.query('SELECT id, name FROM artists');
        return rows;
    },
    getAvailableCities: async () => {
        const [rows] = await db_1.default.query('SELECT id, name FROM cities');
        return rows;
    },
    getAvailableGenres: async () => {
        const [rows] = await db_1.default.query('SELECT id, name FROM genres');
        return rows;
    },
    getAvailableVenues: async () => {
        const [rows] = await db_1.default.query('SELECT id, name FROM venues');
        return rows;
    },
    getPreferencesWithNames: async (userId) => {
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
    getUserArtistsWithNames: async (userId) => {
        const [rows] = await db_1.default.query(`SELECT a.id, a.name 
       FROM artists a
       JOIN user_artists ua ON a.id = ua.artist_id
       WHERE ua.user_id = ?`, [userId]);
        return rows;
    },
    getUserCitiesWithNames: async (userId) => {
        const [rows] = await db_1.default.query(`SELECT c.id, c.name 
       FROM cities c
       JOIN user_cities uc ON c.id = uc.city_id
       WHERE uc.user_id = ?`, [userId]);
        return rows;
    },
    getUserGenresWithNames: async (userId) => {
        const [rows] = await db_1.default.query(`SELECT g.id, g.name 
       FROM genres g
       JOIN user_genres ug ON g.id = ug.genre_id
       WHERE ug.user_id = ?`, [userId]);
        return rows;
    },
    getUserVenuesWithNames: async (userId) => {
        const [rows] = await db_1.default.query(`SELECT v.id, v.name 
       FROM venues v
       JOIN user_venues uv ON v.id = uv.venue_id
       WHERE uv.user_id = ?`, [userId]);
        return rows;
    },
};
exports.default = PreferencesModel;
