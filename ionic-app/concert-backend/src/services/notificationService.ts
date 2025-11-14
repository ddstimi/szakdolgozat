import NotificationsModel, {
  CreateNotificationInput,
} from '../models/Notifications';
import PushService from './pushService';

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

  createAndPush: async (payload: CreateNotificationInput) => {
    const id = await NotificationsModel.create(payload);
    const linkUrl = payload.concertId
      ? `${process.env.APP_BASE_URL || ''}/tabs/concerts/${payload.concertId}`
      : undefined;

    await PushService.sendToUser(payload.userId, {
      title: payload.title,
      body: payload.message,
      type: payload.type || undefined,
      linkUrl,
      metadata: { notificationId: id, concertId: payload.concertId ?? '' },
    });

    return id;
  },
};

export default NotificationService;
