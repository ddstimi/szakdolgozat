import { Request, Response } from 'express';
import SearchModel from '../models/Search';

interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  gdpr: number;
  img_url?: string;
  register_date: string;
  last_login: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

const getUserId = (req: AuthenticatedRequest): number | null =>
  req.user?.id ?? null;

const SearchController = {
  getHistory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = Number(req.query.limit) || 10;
      const rows = await SearchModel.getByUserId(userId, limit);

      res.status(200).json({ success: true, data: rows });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch search history' });
    }
  },

  addSearch: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { query } = req.body;

      if (!query || typeof query !== 'string' || !query.trim()) {
        res.status(400).json({ success: false, message: 'Query is required' });
        return;
      }

      await SearchModel.addEntry(userId, query);
      res.status(201).json({ success: true, message: 'Search saved' });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to save search' });
    }
  },
};

export default SearchController;
