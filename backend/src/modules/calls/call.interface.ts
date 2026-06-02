import { RoomConfig } from './call.types';

export interface ICallProvider {
  createRoom(jobId: string, userId: string): Promise<RoomConfig>;
}
