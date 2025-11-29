import { Request, Response, NextFunction, RequestHandler } from 'express';
import PreferencesService from '../services/preferences.service';
import PreferencesModel from '../models/preferences.model';
import pool from '../config/db';

interface AuthenticatedRequest extends Request {
  user?: { id: number };
}

const PreferencesController = {
  getPreferences: (async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    try {
      const preferences = await PreferencesService.getUserPreferences(userId);
      res.json(preferences);
    } catch (error: any) {
      if (error?.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(error);
    }
  }) as RequestHandler,

  updatePreferences: (async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    try {
      const {
        see_cancelled,
        see_not_available,
        notify_push,
        artists = [],
        locations = [],
        genres = [],
        venues = [],
      } = req.body;

      if (
        typeof see_cancelled === 'undefined' ||
        typeof see_not_available === 'undefined' ||
        typeof notify_push === 'undefined'
      ) {
        res.status(400).json({
          success: false,
          message: 'Missing required boolean preference fields',
        });
        return;
      }

      const preferences = {
        see_cancelled: Boolean(see_cancelled),
        see_not_available: Boolean(see_not_available),
        notify_push: Boolean(notify_push),
      };

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        await PreferencesModel.updatePreferences(userId, preferences);

        await Promise.all([
          PreferencesModel.updateUserArtists(userId, artists),
          PreferencesModel.updateUserCities(userId, locations),
          PreferencesModel.updateUserGenres(userId, genres),
          PreferencesModel.updateUserVenues(userId, venues),
        ]);

        await connection.commit();

        const [
          updatedPrefs,
          updatedArtists,
          updatedLocations,
          updatedGenres,
          updatedVenues,
        ] = await Promise.all([
          PreferencesModel.getPreferences(userId),
          PreferencesModel.getUserArtists(userId),
          PreferencesModel.getUserCities(userId),
          PreferencesModel.getUserGenres(userId),
          PreferencesModel.getUserVenues(userId),
        ]);

        res.status(200).json({
          success: true,
          data: {
            ...updatedPrefs,
            artists: updatedArtists,
            locations: updatedLocations,
            genres: updatedGenres,
            venues: updatedVenues,
          },
        });
      } catch (error) {
        await connection.rollback();
        console.error('Transaction error:', error);
        throw error;
      } finally {
        connection.release();
      }
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating preferences',
        error: error.message,
      });
    }
  }) as RequestHandler,

  getAvailableOptions: (async (_req: Request, res: Response) => {
    try {
      const options = await PreferencesService.getAvailableOptions();
      res.json({
        success: true,
        data: options,
      });
    } catch (error: any) {
      console.error('Error getting available options:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get available options',
      });
    }
  }) as RequestHandler,
};

export default PreferencesController;
