import * as admin from 'firebase-admin';
import { IPushProvider } from '../notification.interface';
import { logger } from '@logger/logger';

export class FcmProvider implements IPushProvider {
  constructor() {
    if (!admin.apps.length) {
      const serviceAccountJson = process.env['FCM_SERVICE_ACCOUNT_JSON'];
      if (!serviceAccountJson) {
        throw new Error('FCM_SERVICE_ACCOUNT_JSON env var is required for FcmProvider');
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }

  async send(token: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    const message: admin.messaging.Message = {
      token,
      notification: { title, body },
      ...(data ? { data } : {}),
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    };

    const messageId = await admin.messaging().send(message);
    logger.debug(`FCM sent: ${messageId}`);
  }
}
