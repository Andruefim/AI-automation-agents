import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class ChatHistoryService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatRepo: Repository<ChatMessage>,
  ) {}

  /**
   * Saves a message to the chat history (no limit on total stored; limit only when reading context).
   */
  async saveMessage(
    chatId: string | number,
    content: string,
    role: 'user' | 'assistant',
    senderUsername?: string | null,
  ): Promise<void> {
    const msg = this.chatRepo.create({
      chat_id: String(chatId),
      role,
      content,
      sender_username: senderUsername ?? null,
    });
    await this.chatRepo.save(msg);
  }

  /**
   * Returns the last `limit` messages for the chat, formatted as a single string for the LLM prompt.
   * Messages are ordered chronologically (oldest first) in the string.
   */
  async getRecentContext(chatId: string | number, limit: number): Promise<string> {
    const messages = await this.chatRepo.find({
      where: { chat_id: String(chatId) },
      order: { created_at: 'DESC' },
      take: limit,
    });
    if (messages.length === 0) return '';

    const chronological = messages.reverse();
    return chronological
      .map((m) => {
        const time = m.created_at ? `[${m.created_at.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}] ` : '';
        const from = m.role === 'assistant' ? 'Бот' : (m.sender_username ?? 'пользователь');
        return `${time}${from}: ${m.content}`;
      })
      .join('\n');
  }
}
