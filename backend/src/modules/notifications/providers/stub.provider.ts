import { IPushProvider } from '../notification.interface';
import { logger } from '@logger/logger';

/** No-op push provider for development and test environments. */
export class StubPushProvider implements IPushProvider {
  async send(token: string, title: string, body: string): Promise<void> {
    logger.debug(`[StubPush] token=${token} title="${title}" body="${body}"`);
  }
}
