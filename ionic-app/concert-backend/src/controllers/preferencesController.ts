import { Request, Response, NextFunction, RequestHandler } from 'express';
import PreferencesService from '../services/preferencesService';

const PreferencesController = {
  getPreferences: (async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;

    try {
      const preferences = await PreferencesService.getUserPreferences(userId);
      console.log('GET /api/preferences reached');
      res.json(preferences);
    } catch (error: any) {
      if (error) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(error);
    }
  }) as RequestHandler,

  updatePreferences: (async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userId = (req as any).user.id;
    const {
      see_cancelled,
      see_not_available,
      notify_push,
      artists,
      cities,
      genres,
      venues,
    } = req.body;

    try {
      await PreferencesService.updateUserPreferences(userId, {
        see_cancelled,
        see_not_available,
        notify_push,
        artists,
        cities,
        genres,
        venues,
      });
      res.json({ success: true });
    } catch (error: any) {
      if (error) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(error);
    }
  }) as RequestHandler,
};

export default PreferencesController;
