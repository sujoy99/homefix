import { MessageRepository } from './message.repository';
import { Message, MessageListQuery } from './message.types';
import { MessageListDTO } from './message.dto';
import { JobService } from '@modules/jobs/job.service';
import { JobStatus } from '@modules/jobs/job.types';
import { notificationService } from '@modules/notifications/notification.service';
import { NotificationType } from '@modules/notifications/notification.types';
import { emitToJob } from '@lib/socket';
import { ForbiddenError, BadRequestError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';
import { logger } from '@logger/logger';

export class MessageService {
  private static assertParticipant(
    callerId: string,
    residentId: string,
    providerId: string | null
  ): void {
    if (callerId !== residentId && callerId !== providerId) {
      throw new ForbiddenError(ErrorCode.JOB_ACCESS_DENIED, 'Only job participants can message');
    }
  }

  static async send(
    jobId: string,
    senderId: string,
    content: string,
    type: 'text' | 'image' = 'text'
  ): Promise<Message> {
    const job = await JobService.getById(jobId);

    MessageService.assertParticipant(senderId, job.resident_id, job.provider_id);

    if (job.status !== JobStatus.ACTIVE) {
      throw new BadRequestError(
        ErrorCode.MESSAGING_NOT_AVAILABLE,
        'Messaging is only available for active jobs'
      );
    }

    const message = await MessageRepository.create({
      job_id: jobId,
      sender_id: senderId,
      content,
      type,
    });

    emitToJob(jobId, 'message', message);

    // Push to the other participant — fire-and-forget
    const recipientId =
      senderId === job.resident_id ? job.provider_id : job.resident_id;

    if (recipientId) {
      notificationService
        .send({
          userId: recipientId,
          type: NotificationType.NEW_MESSAGE,
          title: { en: 'New message', bn: 'নতুন বার্তা' },
          body: { en: content.slice(0, 100), bn: content.slice(0, 100) },
          data: { jobId, messageId: message.id },
        })
        .catch((err: unknown) => {
          logger.warn(`[MessageService] push failed: ${String(err)}`);
        });
    }

    return message;
  }

  static async list(
    jobId: string,
    callerId: string,
    query: MessageListQuery
  ): Promise<MessageListDTO> {
    const job = await JobService.getById(jobId);

    MessageService.assertParticipant(callerId, job.resident_id, job.provider_id);

    if (job.status !== JobStatus.ACTIVE) {
      throw new BadRequestError(
        ErrorCode.MESSAGING_NOT_AVAILABLE,
        'Messaging is only available for active jobs'
      );
    }

    const items = await MessageRepository.list(jobId, query);

    const next_cursor =
      items.length === query.limit ? (items[items.length - 1]?.id ?? null) : null;

    return { items, next_cursor };
  }
}
