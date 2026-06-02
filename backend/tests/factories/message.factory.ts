import { getTestDb } from '../helpers/db';

export interface FactoryMessageResult {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  type: string;
  created_at: string;
}

export async function createMessage(opts: {
  job_id: string;
  sender_id: string;
  content?: string;
  type?: string;
}): Promise<FactoryMessageResult> {
  const db = getTestDb();
  const [row] = await db('job_messages')
    .insert({
      job_id: opts.job_id,
      sender_id: opts.sender_id,
      content: opts.content ?? 'Test message content',
      type: opts.type ?? 'text',
    })
    .returning(['id', 'job_id', 'sender_id', 'content', 'type', 'created_at']);
  return row as FactoryMessageResult;
}
