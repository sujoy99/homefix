import { JobMessage } from './message.model';
import { CreateMessageInput, Message, MessageListQuery } from './message.types';

export class MessageRepository {
  static async create(data: CreateMessageInput): Promise<Message> {
    const message = await JobMessage.query().insertAndFetch({
      job_id: data.job_id,
      sender_id: data.sender_id,
      content: data.content,
      type: data.type ?? 'text',
    });
    return message as unknown as Message;
  }

  static async list(jobId: string, query: MessageListQuery): Promise<Message[]> {
    let q = JobMessage.knex()
      .select('*')
      .from('job_messages')
      .where('job_id', jobId)
      .orderBy('created_at', 'desc')
      .limit(query.limit);

    if (query.before) {
      const cursor = await JobMessage.query().findById(query.before);
      if (cursor) {
        q = q.where('created_at', '<', cursor.created_at);
      }
    }

    return q as unknown as Message[];
  }
}
