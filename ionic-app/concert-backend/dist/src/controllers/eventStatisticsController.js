"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const eventStatisticsService_1 = __importDefault(require("../services/eventStatisticsService"));
const EventStatisticsController = {
    getEventStatistics: async (req, res) => {
        const userId = req.user.id;
        const { interval } = req.query;
        try {
            const stats = await eventStatisticsService_1.default.getUserConcertStatistics(userId, interval);
            const insights = await eventStatisticsService_1.default.getPersonalizedInsights(userId, interval, stats);
            res.json({
                success: true,
                data: {
                    totalConcerts: stats.totalConcerts,
                    genreData: stats.genreData,
                    locationData: stats.locationData,
                    artistData: stats.artistData,
                    insights,
                    events: stats.concerts.map((concert) => ({
                        id: concert.id,
                        title: concert.title,
                        date: concert.date,
                        location: concert.venue.name,
                        locationName: concert.city.name,
                        genres: concert.genres,
                        artists: concert.artists,
                    })),
                },
            });
        }
        catch (error) {
            console.error('Error getting event statistics:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get event statistics',
            });
        }
    },
};
exports.default = EventStatisticsController;
