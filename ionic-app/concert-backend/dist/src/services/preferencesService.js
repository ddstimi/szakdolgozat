"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Preferences_1 = __importDefault(require("../models/Preferences"));
const PreferencesService = {
    getUserPreferences: async (userId) => {
        try {
            const [prefs, artists, cities, genres, venues] = await Promise.all([
                Preferences_1.default.getPreferences(userId),
                Preferences_1.default.getUserArtists(userId),
                Preferences_1.default.getUserCities(userId),
                Preferences_1.default.getUserGenres(userId),
                Preferences_1.default.getUserVenues(userId),
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
        }
        catch (error) {
            throw new Error('Failed to get user preferences');
        }
    },
    getAvailableOptions: async () => {
        try {
            console.log('Fetching available options from database...');
            const [artists, cities, genres, venues] = await Promise.all([
                Preferences_1.default.getAvailableArtists(),
                Preferences_1.default.getAvailableCities(),
                Preferences_1.default.getAvailableGenres(),
                Preferences_1.default.getAvailableVenues(),
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
        }
        catch (error) {
            console.error('Detailed error in getAvailableOptions:', error);
            throw new Error(`Failed to get available options: ${error.message}`);
        }
    },
    updateUserPreferences: async (userId, preferences) => {
        try {
            await Promise.all([
                Preferences_1.default.updatePreferences(userId, {
                    see_cancelled: preferences.see_cancelled,
                    see_not_available: preferences.see_not_available,
                    notify_push: preferences.notify_push,
                }),
                Preferences_1.default.updateUserArtists(userId, preferences.artists || []),
                Preferences_1.default.updateUserCities(userId, preferences.cities || []),
                Preferences_1.default.updateUserGenres(userId, preferences.genres || []),
                Preferences_1.default.updateUserVenues(userId, preferences.venues || []),
            ]);
        }
        catch (error) {
            throw new Error('Failed to update preferences');
        }
    },
};
exports.default = PreferencesService;
