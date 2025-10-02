import EventsModel from '../models/Concerts';

const ConcertService = {
  getTopPicks: async (userId: number) => {
    return await EventsModel.getTopPicks(userId);
  },

  getNearMe: async () => {
    return await EventsModel.getPopular();
  },
  getUpcoming: async () => {
    return await EventsModel.getUpcoming();
  },
  getUpcomingByUserId: async (userId: number) => {
    return await EventsModel.getUpcomingByUserId(userId);
  },
  getPastByUserId: async (userId: number) => {
    return await EventsModel.getPastByUserId(userId);
  },
};

export default ConcertService;
