import ConcertsModel from '../models/Concerts';

const ConcertService = {
  getTopPicks(userId: number) {
    return ConcertsModel.getTopPicks(userId);
  },

  getNearMe() {
    return ConcertsModel.getPopular();
  },

  getUpcoming() {
    return ConcertsModel.getUpcoming();
  },

  getUpcomingByUserId(userId: number) {
    return ConcertsModel.getUpcomingByUserId(userId);
  },

  getPastByUserId(userId: number) {
    return ConcertsModel.getPastByUserId(userId);
  },
};

export default ConcertService;
