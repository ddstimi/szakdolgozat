import PreferencesModel from '../models/preferences.model';

const PreferencesService = {
  async getUserPreferences(userId: number) {
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
  },

  async getAvailableOptions() {
    const [artists, cities, genres, venues] = await Promise.all([
      PreferencesModel.getAvailableArtists(),
      PreferencesModel.getAvailableCities(),
      PreferencesModel.getAvailableGenres(),
      PreferencesModel.getAvailableVenues(),
    ]);

    return { artists, cities, genres, venues };
  },

  async updateUserPreferences(
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
  ) {
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
  },
};

export default PreferencesService;
