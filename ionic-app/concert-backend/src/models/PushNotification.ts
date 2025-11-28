import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import pool from '../config/db';

export interface PushTokenRow extends RowDataPacket {
  token: string;
  user_id: number;
  platform: 'web' | 'android' | 'ios';
  created_at: string;
  revoked_at: string | null;
}

const PushModel = {
  async upsert(
    userId: number,
    token: string,
    platform: 'web' | 'android' | 'ios'
  ): Promise<void> {
    await pool.query<ResultSetHeader>(
      `
      INSERT INTO push_tokens (token, user_id, platform)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        platform = VALUES(platform),
        revoked_at = NULL
      `,
      [token, userId, platform]
    );
  },

  async revoke(userId: number, token: string): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE push_tokens SET revoked_at = NOW() WHERE token = ? AND user_id = ?`,
      [token, userId]
    );
  },

  async listActiveTokensByUserId(userId: number): Promise<string[]> {
    const [rows] = await pool.query<PushTokenRow[]>(
      `SELECT token FROM push_tokens WHERE user_id = ? AND revoked_at IS NULL`,
      [userId]
    );
    return rows.map((r) => r.token);
  },

  async pruneInvalid(tokens: string[]): Promise<void> {
    if (!tokens.length) return;

    const placeholders = tokens.map(() => '?').join(',');
    await pool.query(
      `UPDATE push_tokens SET revoked_at = NOW() WHERE token IN (${placeholders})`,
      tokens
    );
  },
};

export default PushModel;
