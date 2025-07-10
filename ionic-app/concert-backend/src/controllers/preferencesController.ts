import { Request, Response, NextFunction, RequestHandler } from 'express';
import PreferencesService from '../services/preferencesService';
import PreferencesModel from '../models/Preferences';

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
    try {
      const userId = (req as any).user.id;
      const {
        see_cancelled,
        see_not_available,
        notify_push,
        artists,
        locations,
        genres,
        venues,
      } = req.body;

      // Validate required fields
      if (
        typeof see_cancelled === 'undefined' ||
        typeof see_not_available === 'undefined' ||
        typeof notify_push === 'undefined'
      ) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      }

      // Update main preferences
      await PreferencesModel.updatePreferences(userId, {
        see_cancelled,
        see_not_available,
        notify_push,
      });

      // Update relationship tables in parallel
      await Promise.all([
        PreferencesModel.updateUserArtists(userId, artists || []),
        PreferencesModel.updateUserCities(userId, locations || []),
        PreferencesModel.updateUserGenres(userId, genres || []),
        PreferencesModel.updateUserVenues(userId, venues || []),
      ]);

      // Get updated preferences to return
      const updatedPreferences = await PreferencesModel.getPreferences(userId);
      const updatedArtists = await PreferencesModel.getUserArtists(userId);
      const updatedLocations = await PreferencesModel.getUserCities(userId);
      const updatedGenres = await PreferencesModel.getUserGenres(userId);
      const updatedVenues = await PreferencesModel.getUserVenues(userId);

      res.status(200).json({
        success: true,
        data: {
          ...updatedPreferences,
          artists: updatedArtists,
          locations: updatedLocations,
          genres: updatedGenres,
          venues: updatedVenues,
        },
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating preferences',
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
