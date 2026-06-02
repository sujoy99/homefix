export type MessageType = 'text' | 'image';

export interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  type: MessageType;
  created_at: string;
}

export interface CreateMessageInput {
  job_id: string;
  sender_id: string;
  content: string;
  type?: MessageType;
}

export interface MessageListQuery {
  limit: number;
  before?: string; // message UUID cursor — returns messages older than this one
}
