import { Request, Response } from 'express';
import EventStatisticsService from '../services/event-statistics.service';

const EventStatisticsController = {
  getEventStatistics: async (req: Request, res: Response) => {
    const userId = (req as any).user.id as number;
    const { interval } = req.query;

    try {
      const stats = await EventStatisticsService.getUserConcertStatistics(
        userId,
        interval as string | undefined
      );

      const insights = await EventStatisticsService.getPersonalizedInsights(
        userId,
        interval as string | undefined,
        stats
      );

      res.json({
        success: true,
        data: {
          totalConcerts: stats.totalConcerts,
          genreData: stats.genreData,
          locationData: stats.locationData,
          artistData: stats.artistData,
          insights,
          events: stats.concerts.map((concert: any) => ({
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
    } catch (error: any) {
      console.error('Error getting event statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get event statistics',
      });
    }
  },
};

export default EventStatisticsController;
