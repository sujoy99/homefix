import { apiClient } from '@/api/client';

export interface RoomConfig {
  provider: 'jitsi' | 'agora';
  roomName: string;
  serverUrl?: string;
  token?: string;
}

export const callService = {
  createRoom: async (jobId: string): Promise<RoomConfig> => {
    const res = await apiClient.post<{ status: string; body: RoomConfig }>(
      `/v2/jobs/${jobId}/call/room`,
    );
    return res.data.body;
  },

  buildCallUrl: (config: RoomConfig): string => {
    const base = config.serverUrl ?? 'https://meet.jit.si';
    const url = `${base}/${config.roomName}`;
    const withToken = config.token ? `${url}?jwt=${config.token}` : url;
    // Skip the Jitsi pre-join screen and lobby so both participants join instantly
    return `${withToken}#config.prejoinPageEnabled=false&config.lobby.enabled=false&config.startWithVideoMuted=true`;
  },
};
