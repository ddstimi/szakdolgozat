import { Request, Response } from 'express';
import ConcertsModel from '../models/Concerts';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    gdpr: number;
    img_url?: string;
    register_date: string;
    last_login: string;
  };
}

const concertController = {
  getTopPicks: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const userId = req.user.id;
      const topPicks = await ConcertsModel.getTopPicks(userId);

      res.status(200).json({ success: true, data: topPicks });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch top picks' });
    }
  },

  getPopular: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const concerts = await ConcertsModel.getPopular();
      res.status(200).json({ success: true, data: concerts });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch nearby concerts' });
    }
  },
  getUpcoming: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const concerts = await ConcertsModel.getUpcoming();
      res.status(200).json({ success: true, data: concerts });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch nearby concerts' });
    }
  },
};

export default concertController;
