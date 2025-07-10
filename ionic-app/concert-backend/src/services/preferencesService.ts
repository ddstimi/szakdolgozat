import PreferencesModel from '../models/Preferences';

const PreferencesService = {
  getUserPreferences: async (userId: number) => {
    try {
      const [prefs, artists, cities, genres, venues] = await Promise.all([
        PreferencesModel.getPreferences(userId),
        PreferencesModel.getUserArtists(userId),
        PreferencesModel.getUserCities(userId),
        PreferencesModel.getUserGenres(userId),
        PreferencesModel.getUserVenues(userId),
      ]);

      return {
        preferences: prefs || {
          see_cancelled: false,
          see_not_available: false,
          notify_push: false,
        },
        artists,
        cities,
        genres,
        venues,
      };
    } catch (error) {
      throw new Error('Failed to get user preferences');
    }
  },
  getAvailableOptions: async () => {
    try {
      console.log('Fetching available options from database...');

      const [artists, cities, genres, venues] = await Promise.all([
        PreferencesModel.getAvailableArtists(),
        PreferencesModel.getAvailableCities(),
        PreferencesModel.getAvailableGenres(),
        PreferencesModel.getAvailableVenues(),
      ]);

      console.log('Successfully fetched options:', {
        artists: artists.length,
        cities: cities.length,
        genres: genres.length,
        venues: venues.length,
      });

      return {
        artists,
        cities,
        genres,
        venues,
      };
    } catch (error: any) {
      console.error('Detailed error in getAvailableOptions:', error);
      throw new Error(`Failed to get available options: ${error.message}`);
    }
  },

  updateUserPreferences: async (
    userId: number,
    preferences: {
      see_cancelled?: boolean;
      see_not_available?: boolean;
      notify_push?: boolean;
      artists?: number[];
      cities?: number[];
      genres?: number[];
      venues?: number[];
    }
  ) => {
    try {
      await Promise.all([
        PreferencesModel.updatePreferences(userId, {
          see_cancelled: preferences.see_cancelled,
          see_not_available: preferences.see_not_available,
          notify_push: preferences.notify_push,
        }),
        PreferencesModel.updateUserArtists(userId, preferences.artists || []),
        PreferencesModel.updateUserCities(userId, preferences.cities || []),
        PreferencesModel.updateUserGenres(userId, preferences.genres || []),
        PreferencesModel.updateUserVenues(userId, preferences.venues || []),
      ]);
    } catch (error) {
      throw new Error('Failed to update preferences');
    }
  },
};

export default PreferencesService;
