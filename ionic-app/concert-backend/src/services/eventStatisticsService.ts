import EventsModel from '../models/eventStatistics';

const EventStatisticsService = {
  getUserConcertStatistics: async (userId: number, interval?: string) => {
    let fromDate: Date | undefined;
    const now = new Date();

    if (interval === '6months') {
      fromDate = new Date(now.setMonth(now.getMonth() - 6));
    } else if (interval === '1year') {
      fromDate = new Date(now.setFullYear(now.getFullYear() - 1));
    }

    const concerts = await EventsModel.getConcertStatistics(userId, fromDate);

    const genreData: Record<string, number> = {};
    const locationData: Record<string, number> = {};
    const artistData: Record<string, number> = {};
    let totalConcerts = 0;

    concerts.forEach((concert) => {
      if (concert.cancelled) return;

      totalConcerts++;

      concert.genres.forEach((genre) => {
        genreData[genre.name] = (genreData[genre.name] || 0) + 1;
      });

      locationData[concert.city.city] =
        (locationData[concert.city.city] || 0) + 1;

      concert.artists.forEach((artist) => {
        artistData[artist.name] = (artistData[artist.name] || 0) + 1;
      });
    });

    return {
      totalConcerts,
      genreData,
      locationData,
      artistData,
      concerts,
    };
  },

  getPersonalizedInsights: (stats: {
    genreData: Record<string, number>;
    locationData: Record<string, number>;
    artistData: Record<string, number>;
  }) => {},
};

export default EventStatisticsService;
