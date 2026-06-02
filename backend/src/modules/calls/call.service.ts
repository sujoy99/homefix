import { ICallProvider } from './call.interface';
import { RoomConfig } from './call.types';
import { JitsiProvider } from './providers/jitsi.provider';
import { JobService } from '@modules/jobs/job.service';
import { JobStatus } from '@modules/jobs/job.types';
import { ForbiddenError, BadRequestError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';
import { env } from '@config/env';

function resolveCallProvider(): ICallProvider {
  if (env.callProvider === 'agora') {
    // Phase 2: swap in AgoraProvider here; mobile reads the `provider` field
    // to select the right SDK — no mobile code change needed.
    throw new Error('Agora provider not yet implemented');
  }
  return new JitsiProvider();
}

const provider: ICallProvider = resolveCallProvider();

export class CallService {
  private static assertParticipant(
    callerId: string,
    residentId: string,
    providerId: string | null,
  ): void {
    if (callerId !== residentId && callerId !== providerId) {
      throw new ForbiddenError(ErrorCode.JOB_ACCESS_DENIED, 'Only job participants can start a call');
    }
  }

  static async createRoom(jobId: string, callerId: string): Promise<RoomConfig> {
    const job = await JobService.getById(jobId);

    CallService.assertParticipant(callerId, job.resident_id, job.provider_id);

    if (job.status !== JobStatus.ACTIVE) {
      throw new BadRequestError(
        ErrorCode.CALL_NOT_AVAILABLE,
        'Calls are only available for active jobs',
      );
    }

    return provider.createRoom(jobId, callerId);
  }
}
