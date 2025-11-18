"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../config/db"));
const EventsModel = {
    getUserConcerts: async (userId, fromDate) => {
        let query = `
      SELECT 
        c.id, c.title, c.date, c.venue_id, c.description, c.ticket_url, 
        c.ticket_available, c.cancelled,
        v.name as venue_name, 
        v.city_id,
        ci.name as city_name
      FROM attends a
      JOIN concerts c ON a.concert_id = c.id
      JOIN venues v ON c.venue_id = v.id
      JOIN cities ci ON v.city_id = ci.id
      WHERE a.user_id = ?
    `;
        const params = [userId];
        if (fromDate) {
            query += ' AND c.date >= ?';
            params.push(fromDate);
        }
        const [rows] = await db_1.default.query(query, params);
        return rows.map((row) => ({
            concert: {
                id: row.id,
                title: row.title,
                date: row.date,
                venue_id: row.venue_id,
                description: row.description,
                ticket_url: row.ticket_url,
                ticket_available: row.ticket_available,
                cancelled: row.cancelled,
                constructor: { name: 'RowDataPacket' },
            },
            venue: {
                id: row.venue_id,
                name: row.venue_name,
                city_id: row.city_id,
                constructor: { name: 'RowDataPacket' },
            },
            city: {
                id: row.city_id,
                name: row.city_name,
                constructor: { name: 'RowDataPacket' },
            },
        }));
    },
    getConcertGenres: async (concertId) => {
        const [rows] = await db_1.default.query(`
      SELECT g.id, g.name 
      FROM artist_genres ag
      JOIN genres g ON ag.genre_id = g.id
      JOIN concerts c ON ag.artist_id = c.artist_id
      WHERE c.id = ?
    `, [concertId]);
        return rows;
    },
    getConcertArtists: async (concertId) => {
        const [rows] = await db_1.default.query(`
      SELECT a.id, a.name 
      FROM concerts c
      JOIN artists a ON c.artist_id = a.id
      WHERE c.id = ?
    `, [concertId]);
        return rows;
    },
    getConcertStatistics: async (userId, fromDate) => {
        const concerts = await EventsModel.getUserConcerts(userId, fromDate);
        const enrichedConcerts = await Promise.all(concerts.map(async ({ concert, venue, city }) => {
            const [genres, artists] = await Promise.all([
                EventsModel.getConcertGenres(concert.id),
                EventsModel.getConcertArtists(concert.id),
            ]);
            return {
                ...concert,
                venue,
                city,
                genres,
                artists,
            };
        }));
        return enrichedConcerts;
    },
    async getUserTotals(fromDate) {
        let sql = `
      SELECT a.user_id, COUNT(*) AS cnt
      FROM attends a
      JOIN concerts c ON c.id = a.concert_id
      WHERE c.cancelled = 0 AND c.date <= NOW()
    `;
        const params = [];
        if (fromDate) {
            sql += ' AND c.date >= ?';
            params.push(fromDate);
        }
        sql += ' GROUP BY a.user_id';
        const [rows] = await db_1.default.query(sql, params);
        return rows;
    },
    async getUserCountsByGenreId(genreId, fromDate) {
        let sql = `
      SELECT a.user_id, COUNT(*) AS cnt
      FROM attends a
      JOIN concerts c ON c.id = a.concert_id
      JOIN artist_genres ag ON ag.artist_id = c.artist_id
      WHERE c.cancelled = 0 AND c.date <= NOW() AND ag.genre_id = ? 
    `;
        const params = [genreId];
        if (fromDate) {
            sql += ' AND c.date >= ?';
            params.push(fromDate);
        }
        sql += ' GROUP BY a.user_id';
        const [rows] = await db_1.default.query(sql, params);
        return rows;
    },
    async getUserCountsByArtistId(artistId, fromDate) {
        let sql = `
      SELECT a.user_id, COUNT(*) AS cnt
      FROM attends a
      JOIN concerts c ON c.id = a.concert_id
      WHERE c.cancelled = 0 AND c.date <= NOW() AND c.artist_id = ?
    `;
        const params = [artistId];
        if (fromDate) {
            sql += ' AND c.date >= ?';
            params.push(fromDate);
        }
        sql += ' GROUP BY a.user_id';
        const [rows] = await db_1.default.query(sql, params);
        return rows;
    },
    async getUserCountsByCityId(cityId, fromDate) {
        let sql = `
      SELECT a.user_id, COUNT(*) AS cnt
      FROM attends a
      JOIN concerts c ON c.id = a.concert_id
      JOIN venues v ON v.id = c.venue_id
      JOIN cities ci ON ci.id = v.city_id
      WHERE c.cancelled = 0 AND c.date <= NOW() AND ci.id = ?
    `;
        const params = [cityId];
        if (fromDate) {
            sql += ' AND c.date >= ?';
            params.push(fromDate);
        }
        sql += ' GROUP BY a.user_id';
        const [rows] = await db_1.default.query(sql, params);
        return rows;
    },
};
exports.default = EventsModel;
