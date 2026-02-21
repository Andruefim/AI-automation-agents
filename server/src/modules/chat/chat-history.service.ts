import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { EmbeddingService } from '../vector-store/embedding.service';
import { QdrantService } from '../vector-store/qdrant.service';

const DEFAULT_CHUNK_SIZE = 8;

@Injectable()
export class ChatHistoryService {
  private readonly logger = new Logger(ChatHistoryService.name);
  private readonly enableRag: boolean;
  private readonly chunkSize: number;

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatRepo: Repository<ChatMessage>,
    private readonly embeddingService: EmbeddingService,
    private readonly qdrantService: QdrantService,
  ) {
    this.enableRag = process.env.ENABLE_RAG === 'true';
    this.chunkSize =
      parseInt(process.env.RAG_CHUNK_SIZE || String(DEFAULT_CHUNK_SIZE), 10) ||
      DEFAULT_CHUNK_SIZE;
  }

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

  async getRecentMessages(chatId: string | number, limit: number) {
    const messages = await this.chatRepo.find({
      where: { chat_id: String(chatId) },
      order: { created_at: 'DESC' },
      take: limit,
    });

    if (messages.length === 0) return [];

    return messages.reverse().map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      username: m.sender_username,
      created_at: m.created_at,
    }));
  }

  async getMessagesByIds(messageIds: number[]): Promise<
    Array<{
      id: number;
      role: 'assistant' | 'user';
      content: string;
      username: string | null;
      created_at: Date;
    }>
  > {
    if (messageIds.length === 0) {
      return [];
    }

    const messages = await this.chatRepo.find({
      where: { id: In(messageIds) },
      order: { created_at: 'ASC' },
    });

    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      username: m.sender_username,
      created_at: m.created_at,
    }));
  }

  async getRecentContextString(chatId: string | number, limit: number): Promise<string> {
    const history = await this.getRecentMessages(chatId, limit);
    return history
      .map((m) => `${m.username ?? (m.role === 'assistant' ? 'Бот' : 'User')}: ${m.content}`)
      .join('\n');
  }

  async createChunksFromRecentMessages(
    chatId: string | number,
    windowSize?: number,
  ): Promise<void> {
    if (!this.enableRag || !this.embeddingService.isConfigured()) {
      return;
    }

    const size = windowSize || this.chunkSize;
    const chatIdStr = String(chatId);

    try {
      const messages = await this.chatRepo.find({
        where: { chat_id: chatIdStr },
        order: { created_at: 'DESC' },
        take: size * 3,
      });

      if (messages.length === 0) {
        return;
      }

      messages.reverse();

      const chunks: ChatMessage[][] = [];
      for (let i = 0; i < messages.length; i += size) {
        const chunk = messages.slice(i, i + size);
        if (chunk.length > 0) {
          chunks.push(chunk);
        }
      }

      for (const chunk of chunks) {
        await this.processChunk(chatIdStr, chunk);
      }
    } catch (err) {
      this.logger.error(
        `Failed to create chunks for chat ${chatIdStr}:`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  private async processChunk(
    chatId: string,
    messages: ChatMessage[],
  ): Promise<void> {
    if (messages.length === 0) {
      return;
    }

    const chunkText = messages
      .map((m) => {
        const username =
          m.sender_username ?? (m.role === 'assistant' ? 'Бот' : 'User');
        return `${username}: ${m.content}`;
      })
      .join('\n');

    const messageIds = messages.map((m) => m.id);
    const usernames = [
      ...new Set(
        messages
          .map((m) => m.sender_username)
          .filter((u): u is string => u !== null),
      ),
    ];
    const createdAt = messages[messages.length - 1].created_at;

    try {
      const vector = await this.embeddingService.generateEmbedding(chunkText);

      await this.qdrantService.storeChunk(
        chatId,
        messageIds,
        chunkText,
        vector,
        {
          usernames,
          createdAt,
        },
      );

      this.logger.debug(
        `Processed chunk: ${chatId}, ${messageIds.length} messages`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to process chunk for chat ${chatId}:`,
        err instanceof Error ? err.message : String(err),
      );
      throw err;
    }
  }
}
