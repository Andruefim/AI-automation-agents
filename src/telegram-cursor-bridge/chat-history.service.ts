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
   * Сохраняет сообщение в БД.
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
   * Возвращает последние сообщения в виде массива объектов.
   * Это именно то, что нужно для Chat API (messages: []).
   */
  async getRecentMessages(chatId: string | number, limit: number) {
    const messages = await this.chatRepo.find({
      where: { chat_id: String(chatId) },
      order: { created_at: 'DESC' }, // Берем самые свежие
      take: limit,
    });

    if (messages.length === 0) return [];

    // Разворачиваем, чтобы история шла от старых к новым (хронологически)
    return messages.reverse().map((m) => ({
      role: m.role, // 'user' или 'assistant'
      content: m.content,
      username: m.sender_username, // Передаем имя, чтобы ReplyService мог его склеить с текстом
    }));
  }

  /**
   * Старый метод для обратной совместимости (если где-то еще нужен текст строкой)
   */
  async getRecentContextString(chatId: string | number, limit: number): Promise<string> {
    const history = await this.getRecentMessages(chatId, limit);
    return history
      .map((m) => `${m.username ?? (m.role === 'assistant' ? 'Бот' : 'User')}: ${m.content}`)
      .join('\n');
  }
}