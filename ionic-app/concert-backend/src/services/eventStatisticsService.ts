// src/services/eventStatisticsService.ts
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
  return Math.round((count / sorted.length) * 100); // e.g. 92 = 92nd percentile
}

const EventStatisticsService = {
  async getUserConcertStatistics(userId: number, interval?: string) {
    const fromDate = fromDateFor(interval);
    const concerts = await EventsModel.getConcertStatistics(userId, fromDate);

    const genreData: Record<string, number> = {};
    const locationData: Record<string, number> = {};
    const artistData: Record<string, number> = {};
    let totalConcerts = 0;
    const now = new Date(); // ← add this
    concerts.forEach((concert: any) => {
      if (concert.cancelled) return;
      if (new Date(concert.date) > now) return; // ← exclude future shows

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

  // No SQL here — only uses EventsModel to fetch distributions
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

    // find user's top item by id/name/count
    const pickTop = <T extends { id: number; name: string }>(arr: T[]) => {
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
    };

    const allGenres = concerts.flatMap((c: any) => c.genres || []);
    const allArtists = concerts.flatMap((c: any) => c.artists || []);
    const allCities = concerts.map((c: any) => c.city).filter(Boolean);

    const topGenre = pickTop(allGenres);
    const topArtist = pickTop(allArtists);
    const topCity = pickTop(allCities);

    // distributions from the MODEL (SQL stays in the model)
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

    // user values
    const userTotal = totalConcerts;
    const userGenreCount = topGenre?.count ?? 0;
    const userArtistCount = topArtist?.count ?? 0;
    const userCityCount = topCity?.count ?? 0;

    // percentiles -> "top X%"
    const pctTotal = percentileRank(userTotal, userTotalsArray);
    const pctGenre = percentileRank(userGenreCount, genreUserCounts);
    const pctArtist = percentileRank(userArtistCount, artistUserCounts);
    const pctCity = percentileRank(userCityCount, cityUserCounts);

    const toTop = (p: number) => Math.max(1, 101 - p); // 92nd → top 9%

    const topTotal = toTop(pctTotal);
    const topGenreP = toTop(pctGenre);
    const topArtistP = toTop(pctArtist);
    const topCityP = toTop(pctCity);

    // fun, Wrapped-style, numbers-first, only personalized strings
    const slides: string[] = [
      topGenre
        ? `Genre unlocked: ${topGenre.name}. ${userGenreCount} ${
            topGenre.name
          } show${userGenreCount === 1 ? '' : 's'} — top ${topGenreP}% of ${
            topGenre.name
          } die-hards.`
        : `Eclectic energy: you didn’t let any one genre steal the spotlight.`,
      topArtist
        ? `Certified fan: ${
            topArtist.name
          }. You turned up ${userArtistCount} time${
            userArtistCount === 1 ? '' : 's'
          } — top ${topArtistP}% of listeners.`
        : `Artist hopper: you kept it fresh with no single favorite.`,
      topCity
        ? `${topCity.name} was your home base — ${userCityCount} show${
            userCityCount === 1 ? '' : 's'
          } there, more than ${topCityP}% of users.`
        : `World tour vibes: no single city dominated your map.`,
      userTotal > 0
        ? `Attendance mode: ${userTotal} show${
            userTotal === 1 ? '' : 's'
          } — top ${topTotal}% for concert-going energy.`
        : `Zero shows this time — next season is yours.`,
    ];

    return { slides };
  },
};

export default EventStatisticsService;
