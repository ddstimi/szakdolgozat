"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const preferencesService_1 = __importDefault(require("../services/preferencesService"));
const Preferences_1 = __importDefault(require("../models/Preferences"));
const db_1 = __importDefault(require("../config/db"));
const PreferencesController = {
    getPreferences: (async (req, res, next) => {
        const userId = req.user.id;
        try {
            const preferences = await preferencesService_1.default.getUserPreferences(userId);
            console.log('GET /api/preferences reached');
            res.json(preferences);
        }
        catch (error) {
            if (error) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            next(error);
        }
    }),
    updatePreferences: (async (req, res) => {
        const userId = req.user.id;
        try {
            const { see_cancelled, see_not_available, notify_push, artists = [], locations = [], genres = [], venues = [], } = req.body;
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
            if (typeof see_cancelled === 'undefined' ||
                typeof see_not_available === 'undefined' ||
                typeof notify_push === 'undefined') {
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
            const connection = await db_1.default.getConnection();
            await connection.beginTransaction();
            try {
                // Update boolean preferences
                await Preferences_1.default.updatePreferences(userId, preferences);
                // Update all relational data
                await Promise.all([
                    Preferences_1.default.updateUserArtists(userId, artists),
                    Preferences_1.default.updateUserCities(userId, locations),
                    Preferences_1.default.updateUserGenres(userId, genres),
                    Preferences_1.default.updateUserVenues(userId, venues),
                ]);
                await connection.commit();
                // Fetch updated data
                const [updatedPrefs, updatedArtists, updatedLocations, updatedGenres, updatedVenues,] = await Promise.all([
                    Preferences_1.default.getPreferences(userId),
                    Preferences_1.default.getUserArtists(userId),
                    Preferences_1.default.getUserCities(userId),
                    Preferences_1.default.getUserGenres(userId),
                    Preferences_1.default.getUserVenues(userId),
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
            }
            catch (error) {
                await connection.rollback();
                console.error('Transaction error:', error);
                throw error;
            }
            finally {
                connection.release();
            }
        }
        catch (error) {
            console.error('Error updating preferences:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while updating preferences',
                error: error.message,
            });
        }
    }),
    getAvailableOptions: (async (req, res) => {
        try {
            const options = await preferencesService_1.default.getAvailableOptions();
            res.json({
                success: true,
                data: options,
            });
        }
        catch (error) {
            console.error('Error getting available options:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get available options',
            });
        }
    }),
};
exports.default = PreferencesController;
