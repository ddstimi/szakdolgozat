import { messaging } from '../push/admin';
import PushTokensModel from '../models/PushNotification';

export type PushPayload = {
  title: string;
  body: string;
  linkUrl?: string;
  type?: string;
  metadata?: Record<string, any>;
};

const PushService = {
  async sendToUser(userId: number, payload: PushPayload): Promise<void> {
    const tokens = await PushTokensModel.listActiveTokensByUserId(userId);
    if (!tokens.length) return;

    const resp = await messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        title: payload.title,
        body: payload.body,
        type: payload.type ?? '',
        linkUrl: payload.linkUrl ?? '',
        metadata: JSON.stringify(payload.metadata ?? {}),
      },
    });

    const bad: string[] = [];

    resp.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code || '';
        if (
          code.includes('registration-token-not-registered') ||
          code.includes('invalid-argument')
        ) {
          bad.push(tokens[i]);
        }
      }
    });

    if (bad.length) {
      await PushTokensModel.pruneInvalid(bad);
    }
  },
};

export default PushService;
