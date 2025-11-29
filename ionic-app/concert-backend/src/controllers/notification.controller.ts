import { Request, Response, NextFunction, RequestHandler } from 'express';
import NotificationService from '../services/notification.service';
import PushTokensModel from '../models/push-notification.model';

interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  gdpr: number;
  img_url?: string;
  register_date: string;
  last_login: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

const getUserId = (req: Request): number | null =>
  (req as AuthenticatedRequest).user?.id ?? null;

const NotificationController = {
  listForMe: (async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const unreadOnly = String(req.query.unreadOnly ?? 'false') === 'true';

    try {
      const data = await NotificationService.listForUser(userId, unreadOnly);
      res.status(200).json({ success: true, data });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch notifications' });
    }
  }) as RequestHandler,

  unreadCount: (async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    try {
      const count = await NotificationService.getUnreadCount(userId);
      res.status(200).json({ success: true, data: { count } });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch unread count' });
    }
  }) as RequestHandler,

  markRead: (async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const id = Number(req.params.id);
    const read = !!req.body?.read;

    try {
      const ok = await NotificationService.markRead(userId, id, read);
      if (!ok) {
        res
          .status(404)
          .json({ success: false, message: 'Notification not found' });
        return;
      }
      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to update notification' });
    }
  }) as RequestHandler,

  create: (async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const { userId, title, message, type, concertId } = req.body || {};
    if (!userId || !title || !message) {
      res
        .status(400)
        .json({ success: false, message: 'userId, title, message required' });
      return;
    }

    try {
      const id = await NotificationService.create({
        userId: Number(userId),
        title: String(title),
        message: String(message),
        type: type ? String(type) : null,
        concertId: concertId ? Number(concertId) : null,
      });
      res.status(201).json({ success: true, data: { id } });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: 'Failed to create notification' });
    }
  }) as RequestHandler,

  registerMyToken: (async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const { token, platform } = req.body || {};

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    if (!token || !platform) {
      res
        .status(400)
        .json({ success: false, message: 'token & platform required' });
      return;
    }

    await PushTokensModel.upsert(userId, token, platform);
    res.status(200).json({ success: true });
  }) as RequestHandler,

  revokeMyToken: (async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const token = req.params.token;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    if (!token) {
      res.status(400).json({ success: false, message: 'token required' });
      return;
    }

    await PushTokensModel.revoke(userId, token);
    res.status(200).json({ success: true });
  }) as RequestHandler,

  testMe: (async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { title, message, type, concertId } = req.body || {};

    const finalTitle = title || 'Test notification 🎧';
    const finalMessage = message || 'This is a test push + DB notification';
    const finalType = type ? String(type) : null;
    const finalConcertId =
      typeof concertId === 'number' || typeof concertId === 'string'
        ? Number(concertId)
        : null;

    try {
      const id = await NotificationService.createAndPush({
        userId,
        title: finalTitle,
        message: finalMessage,
        type: finalType,
        concertId: finalConcertId ?? undefined,
      });

      res.status(201).json({
        success: true,
        data: {
          id,
          title: finalTitle,
          message: finalMessage,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification',
      });
    }
  }) as RequestHandler,
};

export default NotificationController;
