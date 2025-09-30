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

  getNearMe: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const city = req.query.city as string;
      if (!city) {
        res.status(400).json({ success: false, message: 'City is required' });
        return;
      }

      const concerts = await ConcertsModel.getNearMe(city);
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
