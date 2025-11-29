import { Request, Response } from 'express';
import ConcertsModel from '../models/concerts.model';

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

const ConcertController = {
  getTopPicks: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const topPicks = await ConcertsModel.getTopPicks(userId);
      res.status(200).json({ success: true, data: topPicks });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch top picks' });
    }
  },

  getPopular: async (_req: Request, res: Response) => {
    try {
      const concerts = await ConcertsModel.getPopular();
      res.status(200).json({ success: true, data: concerts });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch popular concerts' });
    }
  },

  getUpcoming: async (_req: Request, res: Response) => {
    try {
      const concerts = await ConcertsModel.getUpcoming();
      res.status(200).json({ success: true, data: concerts });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch upcoming concerts' });
    }
  },

  getUpcomingByUserId: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const concerts = await ConcertsModel.getUpcomingByUserId(userId);
      res.status(200).json({ success: true, data: concerts });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch top picks' });
    }
  },

  getPastByUserId: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const concerts = await ConcertsModel.getPastByUserId(userId);
      res.status(200).json({ success: true, data: concerts });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch top picks' });
    }
  },
};

export default ConcertController;
