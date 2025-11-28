import EventsModel from '../models/eventStatistics';

function fromDateFor(interval?: string) {
  const now = new Date();
  if (interval === '6months') {
    now.setMonth(now.getMonth() - 6);
    return now;
  }
  if (interval === '1year') {
    now.setFullYear(now.getFullYear() - 1);
    return now;
  }
  return undefined;
}

function percentileRank(userValue: number, values: number[]) {
  if (!values || values.length === 0) return 50;
  const sorted = values.slice().sort((a, b) => a - b);
  let count = 0;
  for (const v of sorted) if (v <= userValue) count++;
  return Math.round((count / sorted.length) * 100);
}

function pickTop<T extends { id: number; name: string }>(arr: T[]) {
  const counts = new Map<number, { name: string; count: number }>();
  for (const item of arr) {
    const cur = counts.get(item.id) || { name: item.name, count: 0 };
    cur.count++;
    counts.set(item.id, cur);
  }
  let best: { id: number; name: string; count: number } | undefined;
  for (const [id, v] of counts) {
    if (!best || v.count > best.count)
      best = { id, name: v.name, count: v.count };
  }
  return best;
}

const EventStatisticsService = {
  async getUserConcertStatistics(userId: number, interval?: string) {
    const fromDate = fromDateFor(interval);
    const concerts = await EventsModel.getConcertStatistics(userId, fromDate);

    const genreData: Record<string, number> = {};
    const locationData: Record<string, number> = {};
    const artistData: Record<string, number> = {};
    let totalConcerts = 0;

    const now = new Date();

    concerts.forEach((concert: any) => {
      if (concert.cancelled) return;
      if (new Date(concert.date) > now) return;

      totalConcerts++;

      (concert.genres || []).forEach((genre: { name: string }) => {
        if (!genre?.name) return;
        genreData[genre.name] = (genreData[genre.name] || 0) + 1;
      });

      const cityName = concert.city?.name;
      if (cityName) {
        locationData[cityName] = (locationData[cityName] || 0) + 1;
      }

      (concert.artists || []).forEach((artist: { name: string }) => {
        if (!artist?.name) return;
        artistData[artist.name] = (artistData[artist.name] || 0) + 1;
      });
    });

    return {
      totalConcerts,
      genreData,
      locationData,
      artistData,
      concerts,
      fromDate,
    };
  },

  async getPersonalizedInsights(
    userId: number,
    interval: string | undefined,
    stats: {
      totalConcerts: number;
      genreData: Record<string, number>;
      locationData: Record<string, number>;
      artistData: Record<string, number>;
      concerts: any[];
      fromDate?: Date;
    }
  ) {
    const { totalConcerts, concerts, fromDate } = stats;

    const now = new Date();
    const pastConcerts = concerts.filter(
      (c) => !c.cancelled && new Date(c.date) <= now
    );

    const allGenres = pastConcerts.flatMap((c) => c.genres || []);
    const allArtists = pastConcerts.flatMap((c) => c.artists || []);
    const allCities = pastConcerts.map((c) => c.city).filter(Boolean);

    const topGenre = pickTop(allGenres);
    const topArtist = pickTop(allArtists);
    const topCity = pickTop(allCities);

    const userTotalsRows = await EventsModel.getUserTotals(fromDate);
    const userTotalsArray = userTotalsRows.map((r: { cnt: number }) => r.cnt);

    let genreUserCounts: number[] = [];
    if (topGenre) {
      const rows = await EventsModel.getUserCountsByGenreId(
        topGenre.id,
        fromDate
      );
      genreUserCounts = rows.map((r: { cnt: number }) => r.cnt);
    }

    let artistUserCounts: number[] = [];
    if (topArtist) {
      const rows = await EventsModel.getUserCountsByArtistId(
        topArtist.id,
        fromDate
      );
      artistUserCounts = rows.map((r: { cnt: number }) => r.cnt);
    }

    let cityUserCounts: number[] = [];
    if (topCity) {
      const rows = await EventsModel.getUserCountsByCityId(
        topCity.id,
        fromDate
      );
      cityUserCounts = rows.map((r: { cnt: number }) => r.cnt);
    }

    const pctTotal = percentileRank(totalConcerts, userTotalsArray);
    const pctGenre = percentileRank(topGenre?.count ?? 0, genreUserCounts);
    const pctArtist = percentileRank(topArtist?.count ?? 0, artistUserCounts);
    const pctCity = percentileRank(topCity?.count ?? 0, cityUserCounts);

    const toTop = (p: number) => Math.max(1, 101 - p);

    return {
      slides: [
        topGenre
          ? `Genre unlocked: ${topGenre.name}. ${topGenre.count} ${
              topGenre.name
            } shows — top ${toTop(pctGenre)}%.`
          : `Eclectic energy.`,
        topArtist
          ? `Certified fan: ${topArtist.name}. ${
              topArtist.count
            } times — top ${toTop(pctArtist)}%.`
          : `Artist hopper.`,
        topCity
          ? `${topCity.name} was your home base — ${
              topCity.count
            } shows — top ${toTop(pctCity)}%.`
          : `World tour vibes.`,
        totalConcerts > 0
          ? `${totalConcerts} shows — top ${toTop(pctTotal)}%.`
          : `Zero shows this time.`,
      ],
    };
  },
};

export default EventStatisticsService;
