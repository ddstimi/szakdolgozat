import { Request, Response, NextFunction, RequestHandler } from 'express';
import PreferencesService from '../services/preferencesService';
import PreferencesModel from '../models/Preferences';
import pool from '../config/db';

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

  updatePreferences: (async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    try {
      // Validate input
      const {
        see_cancelled,
        see_not_available,
        notify_push,
        artists = [],
        locations = [],
        genres = [],
        venues = [],
      } = req.body;

      console.log('Received update request:', {
        userId,
        see_cancelled,
        see_not_available,
        notify_push,
        artists,
        locations,
        genres,
        venues,
      });

      if (
        typeof see_cancelled === 'undefined' ||
        typeof see_not_available === 'undefined' ||
        typeof notify_push === 'undefined'
      ) {
        return res.status(400).json({
          success: false,
          message: 'Missing required boolean preference fields',
        });
      }

      // Convert to proper types
      const preferences = {
        see_cancelled: Boolean(see_cancelled),
        see_not_available: Boolean(see_not_available),
        notify_push: Boolean(notify_push),
      };

      // Process in transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Update boolean preferences
        await PreferencesModel.updatePreferences(userId, preferences);

        // Update all relational data
        await Promise.all([
          PreferencesModel.updateUserArtists(userId, artists),
          PreferencesModel.updateUserCities(userId, locations),
          PreferencesModel.updateUserGenres(userId, genres),
          PreferencesModel.updateUserVenues(userId, venues),
        ]);

        await connection.commit();

        // Fetch updated data
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
  getAvailableOptions: (async (req: Request, res: Response) => {
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
