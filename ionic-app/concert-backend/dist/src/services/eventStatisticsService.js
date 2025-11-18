"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const eventStatistics_1 = __importDefault(require("../models/eventStatistics"));
function fromDateFor(interval) {
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
function percentileRank(userValue, values) {
    if (!values || values.length === 0)
        return 50;
    const sorted = values.slice().sort((a, b) => a - b);
    let count = 0;
    for (const v of sorted)
        if (v <= userValue)
            count++;
    return Math.round((count / sorted.length) * 100);
}
const EventStatisticsService = {
    async getUserConcertStatistics(userId, interval) {
        const fromDate = fromDateFor(interval);
        const concerts = await eventStatistics_1.default.getConcertStatistics(userId, fromDate);
        const genreData = {};
        const locationData = {};
        const artistData = {};
        let totalConcerts = 0;
        const now = new Date();
        concerts.forEach((concert) => {
            if (concert.cancelled)
                return;
            if (new Date(concert.date) > now)
                return;
            totalConcerts++;
            (concert.genres || []).forEach((genre) => {
                if (!genre?.name)
                    return;
                genreData[genre.name] = (genreData[genre.name] || 0) + 1;
            });
            const cityName = concert.city?.name;
            if (cityName) {
                locationData[cityName] = (locationData[cityName] || 0) + 1;
            }
            (concert.artists || []).forEach((artist) => {
                if (!artist?.name)
                    return;
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
    async getPersonalizedInsights(userId, interval, stats) {
        const { totalConcerts, concerts, fromDate } = stats;
        const now = new Date();
        const pastConcerts = concerts.filter((c) => !c.cancelled && new Date(c.date) <= now);
        const pickTop = (arr) => {
            const counts = new Map();
            for (const item of arr) {
                const cur = counts.get(item.id) || { name: item.name, count: 0 };
                cur.count++;
                counts.set(item.id, cur);
            }
            let best;
            for (const [id, v] of counts) {
                if (!best || v.count > best.count)
                    best = { id, name: v.name, count: v.count };
            }
            return best;
        };
        const allGenres = pastConcerts.flatMap((c) => c.genres || []);
        const allArtists = pastConcerts.flatMap((c) => c.artists || []);
        const allCities = pastConcerts.map((c) => c.city).filter(Boolean);
        const topGenre = pickTop(allGenres);
        const topArtist = pickTop(allArtists);
        const topCity = pickTop(allCities);
        const userTotalsRows = await eventStatistics_1.default.getUserTotals(fromDate);
        const userTotalsArray = userTotalsRows.map((r) => r.cnt);
        let genreUserCounts = [];
        if (topGenre) {
            const rows = await eventStatistics_1.default.getUserCountsByGenreId(topGenre.id, fromDate);
            genreUserCounts = rows.map((r) => r.cnt);
        }
        let artistUserCounts = [];
        if (topArtist) {
            const rows = await eventStatistics_1.default.getUserCountsByArtistId(topArtist.id, fromDate);
            artistUserCounts = rows.map((r) => r.cnt);
        }
        let cityUserCounts = [];
        if (topCity) {
            const rows = await eventStatistics_1.default.getUserCountsByCityId(topCity.id, fromDate);
            cityUserCounts = rows.map((r) => r.cnt);
        }
        const userTotal = totalConcerts;
        const userGenreCount = topGenre?.count ?? 0;
        const userArtistCount = topArtist?.count ?? 0;
        const userCityCount = topCity?.count ?? 0;
        const pctTotal = percentileRank(userTotal, userTotalsArray);
        const pctGenre = percentileRank(userGenreCount, genreUserCounts);
        const pctArtist = percentileRank(userArtistCount, artistUserCounts);
        const pctCity = percentileRank(userCityCount, cityUserCounts);
        const toTop = (p) => Math.max(1, 101 - p);
        const topTotal = toTop(pctTotal);
        const topGenreP = toTop(pctGenre);
        const topArtistP = toTop(pctArtist);
        const topCityP = toTop(pctCity);
        const slides = [
            topGenre
                ? `Genre unlocked: ${topGenre.name}. ${userGenreCount} ${topGenre.name} show${userGenreCount === 1 ? '' : 's'} — top ${topGenreP}% of ${topGenre.name} die-hards.`
                : `Eclectic energy: you didn’t let any one genre steal the spotlight.`,
            topArtist
                ? `Certified fan: ${topArtist.name}. You turned up ${userArtistCount} time${userArtistCount === 1 ? '' : 's'} — top ${topArtistP}% of listeners.`
                : `Artist hopper: you kept it fresh with no single favorite.`,
            topCity
                ? `${topCity.name} was your home base — ${userCityCount} show${userCityCount === 1 ? '' : 's'} there — top ${topCityP}% of clubber in that city.`
                : `World tour vibes: no single city dominated your map.`,
            userTotal > 0
                ? `Attendance mode: ${userTotal} show${userTotal === 1 ? '' : 's'} — top ${topTotal}% for concert-going energy.`
                : `Zero shows this time — next season is yours.`,
        ];
        return { slides };
    },
};
exports.default = EventStatisticsService;
