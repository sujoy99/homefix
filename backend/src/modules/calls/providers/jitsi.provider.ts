import jwt from 'jsonwebtoken';
import { ICallProvider } from '../call.interface';
import { RoomConfig } from '../call.types';
import { env } from '@config/env';

/**
 * Jitsi Meet provider.
 *
 * Room creation is stateless — the backend never relays media.
 * Jitsi JVBs handle all audio/video traffic directly with clients.
 * To scale: point JITSI_SERVER_URL at a load balancer in front of
 * multiple JVB nodes (Jitsi Octo cascade).
 *
 * JWT auth: set JITSI_APP_ID + JITSI_APP_SECRET and configure your
 * Jitsi server with the same values. Tokens are scoped to the room
 * and expire in 2 h so stale links cannot be replayed.
 *
 * Dev / CI: omit JITSI_APP_SECRET to get tokenless rooms on meet.jit.si.
 */
export class JitsiProvider implements ICallProvider {
  async createRoom(jobId: string, userId: string): Promise<RoomConfig> {
    const roomName = `homefix-job-${jobId}`;
    const serverUrl = env.jitsiServerUrl;

    let token: string | undefined;
    if (env.jitsiAppId && env.jitsiAppSecret) {
      const host = new URL(serverUrl).hostname;
      token = jwt.sign(
        {
          context: { user: { id: userId } },
          aud: 'jitsi',
          iss: env.jitsiAppId,
          sub: host,
          room: roomName,
          nbf: Math.floor(Date.now() / 1000),
        },
        env.jitsiAppSecret,
        { expiresIn: '2h' },
      );
    }

    const config: RoomConfig = {
      provider: 'jitsi',
      roomName,
      serverUrl,
    };

    if (token !== undefined) config.token = token;

    return config;
  }
}
