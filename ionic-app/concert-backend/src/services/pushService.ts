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
    if (!tokens.length) {
      console.log('⚠ No active tokens for user', userId);
      return;
    }

    console.log('🚀 Sending push to tokens:', tokens);

    const resp = await messaging().sendEachForMulticast({
      tokens,
      // **IMPORTANT**: data-only message
      data: {
        title: payload.title,
        body: payload.body,
        type: payload.type ?? '',
        linkUrl: payload.linkUrl ?? '',
        metadata: JSON.stringify(payload.metadata ?? {}),
      },
    });

    console.log(
      '📦 FCM sendEachForMulticast result:',
      'success:',
      resp.successCount,
      'failure:',
      resp.failureCount
    );

    resp.responses.forEach((r, i) => {
      if (!r.success) {
        console.error(
          '❌ FCM send error for token',
          tokens[i],
          r.error?.code,
          r.error?.message
        );
      }
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
      console.log('🧹 Pruning invalid tokens:', bad);
      await PushTokensModel.pruneInvalid(bad);
    }
  },
};

export default PushService;
