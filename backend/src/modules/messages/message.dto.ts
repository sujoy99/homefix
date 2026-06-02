import type { Message } from './message.types';

export interface SendMessageDTO {
  content: string;
  type?: 'text' | 'image';
}

export interface MessageListDTO {
  items: Message[];
  next_cursor: string | null;
}
