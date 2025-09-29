// models/Events.ts
import { Pool, RowDataPacket } from 'mysql2/promise';
import pool from '../config/db';

interface UserConcert extends RowDataPacket {
  id: number;
  user_id: number;
  concert_id: number;
  addition_date: Date;
}

interface Concert extends RowDataPacket {
  id: number;
  title: string;
  date: Date;
  venue_id: number;
  description: string | null;
  ticket_url: string | null;
  ticket_available: boolean;
  cancelled: boolean;
}

interface Venue extends RowDataPacket {
  id: number;
  name: string;
  city_id: number;
}

interface City extends RowDataPacket {
  id: number;
  name: string;
}

interface Genre extends RowDataPacket {
  id: number;
  name: string;
}

interface Artist extends RowDataPacket {
  id: number;
  name: string;
}

interface ConcertWithVenueAndCity extends RowDataPacket {
  id: number;
  title: string;
  date: Date;
  venue_id: number;
  description: string | null;
  ticket_url: string | null;
  ticket_available: boolean;
  cancelled: boolean;
  venue_name: string;
  city_id: number;
  city_name: string;
}

const EventsModel = {
  getUserConcerts: async (
    userId: number,
    fromDate?: Date
  ): Promise<
    {
      concert: Concert;
      venue: Venue;
      city: City;
    }[]
  > => {
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
    const params: any[] = [userId];

    if (fromDate) {
      query += ' AND c.date >= ?';
      params.push(fromDate);
    }

    const [rows] = await pool.query<ConcertWithVenueAndCity[]>(query, params);

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
      } as Concert,
      venue: {
        id: row.venue_id,
        name: row.venue_name,
        city_id: row.city_id,
        constructor: { name: 'RowDataPacket' },
      } as Venue,
      city: {
        id: row.city_id,
        name: row.city_name,
        constructor: { name: 'RowDataPacket' },
      } as City,
    }));
  },

  getConcertGenres: async (
    concertId: number
  ): Promise<{ id: number; name: string }[]> => {
    const [rows] = await pool.query<Genre[]>(
      `
      SELECT g.id, g.name 
      FROM artist_genres ag
      JOIN genres g ON ag.genre_id = g.id
      JOIN concerts c ON ag.artist_id = c.artist_id
      WHERE c.id = ?
    `,
      [concertId]
    );
    return rows;
  },

  getConcertArtists: async (
    concertId: number
  ): Promise<{ id: number; name: string }[]> => {
    const [rows] = await pool.query<Artist[]>(
      `
      SELECT a.id, a.name 
      FROM concerts c
      JOIN artists a ON c.artist_id = a.id
      WHERE c.id = ?
    `,
      [concertId]
    );
    return rows;
  },

  getConcertStatistics: async (userId: number, fromDate?: Date) => {
    const concerts = await EventsModel.getUserConcerts(userId, fromDate);

    const enrichedConcerts = await Promise.all(
      concerts.map(async ({ concert, venue, city }) => {
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
      })
    );

    return enrichedConcerts;
  },
};

export default EventsModel;
