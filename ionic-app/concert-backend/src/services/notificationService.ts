import NotificationsModel, {
  CreateNotificationInput,
} from '../models/Notifications';

const NotificationService = {
  listForUser: async (userId: number, unreadOnly = false) => {
    return await NotificationsModel.listByUserId(userId, unreadOnly, 100);
  },

  getUnreadCount: async (userId: number) => {
    return await NotificationsModel.unreadCount(userId);
  },

  markRead: async (userId: number, id: number, read: boolean) => {
    return await NotificationsModel.markRead(userId, id, read);
  },

  create: async (payload: CreateNotificationInput) => {
    return await NotificationsModel.create(payload);
  },
};

export default NotificationService;
