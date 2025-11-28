import NotificationsModel, {
  CreateNotificationInput,
} from '../models/Notifications';
import PushService from './pushService';

const NotificationService = {
  listForUser(userId: number, unreadOnly = false) {
    return NotificationsModel.listByUserId(userId, unreadOnly, 100);
  },

  getUnreadCount(userId: number) {
    return NotificationsModel.unreadCount(userId);
  },

  markRead(userId: number, id: number, read: boolean) {
    return NotificationsModel.markRead(userId, id, read);
  },

  create(payload: CreateNotificationInput) {
    return NotificationsModel.create(payload);
  },

  async createAndPush(payload: CreateNotificationInput) {
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

  async notifyConcertToday(userId: number, concert: any) {
    const title = '🎵 Your concert is today!';
    const label = concert.title ?? concert.name ?? 'your concert';
    const venue = concert.venue ? ` at ${concert.venue}` : '';
    const city = concert.city ? ` (${concert.city})` : '';
    const message = `Don't forget: ${label}${venue}${city} is happening today.`;

    return NotificationService.createAndPush({
      userId,
      title,
      message,
      type: 'concert_today',
      concertId: concert.id,
    });
  },

  async notifyConcertThisWeek(userId: number, concert: any) {
    const title = '📅 Concert this week';
    const label = concert.title ?? concert.name ?? 'your concert';
    const venue = concert.venue ? ` at ${concert.venue}` : '';
    const city = concert.city ? ` (${concert.city})` : '';
    const message = `Heads up: ${label}${venue}${city} is coming up this week.`;

    return NotificationService.createAndPush({
      userId,
      title,
      message,
      type: 'concert_week',
      concertId: concert.id,
    });
  },

  async notifyConcertStatusChange(
    userId: number,
    concert: any,
    status: 'sold_out' | 'cancelled'
  ) {
    const label = concert.title ?? concert.name ?? 'your concert';

    const title =
      status === 'sold_out'
        ? '⚠ Concert is sold out'
        : '⚠ Concert was cancelled';
    const message =
      status === 'sold_out'
        ? `${label} is now sold out.`
        : `${label} has been cancelled.`;

    return NotificationService.createAndPush({
      userId,
      title,
      message,
      type: status === 'sold_out' ? 'concert_sold_out' : 'concert_cancelled',
      concertId: concert.id,
    });
  },

  async notifyNewConcertByPreferences(userId: number, concert: any) {
    const label = concert.title ?? concert.name ?? 'New concert';
    const artist = concert.artistName ? ` by ${concert.artistName}` : '';
    const city = concert.city ? ` in ${concert.city}` : '';
    const venue = concert.venue ? ` at ${concert.venue}` : '';

    const title = '✨ New concert you might like';
    const message = `${label}${artist}${venue}${city} matches your preferences.`;

    return NotificationService.createAndPush({
      userId,
      title,
      message,
      type: 'new_by_preferences',
      concertId: concert.id,
    });
  },
};

export default NotificationService;
