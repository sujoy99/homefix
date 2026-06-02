export type CallProviderType = 'jitsi' | 'agora';

export interface RoomConfig {
  provider: CallProviderType;
  roomName: string;
  serverUrl?: string;
  token?: string;
}
