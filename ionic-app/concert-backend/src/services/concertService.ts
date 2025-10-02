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
};

export default ConcertService;
