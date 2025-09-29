import EventsModel from '../models/Concerts';

const ConcertService = {
  getTopPicks: async (userId: number) => {
    return await EventsModel.getTopPicks(userId);
  },

  getNearMe: async (city: string) => {
    return await EventsModel.getNearMe(city);
  },
};

export default ConcertService;
