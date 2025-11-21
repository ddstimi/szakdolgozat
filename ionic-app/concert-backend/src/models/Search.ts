import { RowDataPacket } from 'mysql2/promise';
import pool from '../config/db';

export interface SearchHistoryRow extends RowDataPacket {
  id: number;
  user_id: number;
  query: string;
  search_date: Date;
}

const SearchModel = {
  getByUserId: async (
    userId: number,
    limit: number = 10
  ): Promise<SearchHistoryRow[]> => {
    const [rows] = await pool.query<SearchHistoryRow[]>(
      `
      SELECT id, user_id, query, search_date
      FROM search_history
      WHERE user_id = ?
      ORDER BY search_date DESC
      LIMIT ?
      `,
      [userId, limit]
    );
    return rows;
  },

  addEntry: async (userId: number, query: string): Promise<void> => {
    const cleaned = query.trim();
    if (!cleaned) {
      return;
    }

    await pool.query(
      `
      INSERT INTO search_history (user_id, query)
      VALUES (?, ?)
      `,
      [userId, cleaned]
    );
  },
};

export default SearchModel;
