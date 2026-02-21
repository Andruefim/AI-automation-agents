import { Injectable, Logger } from '@nestjs/common';
import { LocalLlmService } from '../llm/local-llm.service';
import { ChatHistoryService } from '../chat/chat-history.service';
import { EmbeddingService } from '../vector-store/embedding.service';
import { QdrantService } from '../vector-store/qdrant.service';

const DEFAULT_HISTORY_LIMIT = 20;
const ENABLE_WEB_TOOLS = process.env.ENABLE_WEB_TOOLS === 'true';
const ENABLE_RAG = process.env.ENABLE_RAG === 'true';
const RAG_RECENT_MESSAGES = parseInt(
  process.env.RAG_RECENT_MESSAGES || '10',
  10,
);
const RAG_SIMILAR_LIMIT = parseInt(
  process.env.RAG_SIMILAR_LIMIT || '15',
  10,
);

export const SYSTEM_PROMPT = `Ты — бот-андроид по имени Дрон. 
Общайся со всеми на «ты». Ты находишься в групповом чате. Пиши кратко и по делу.`;

function getSystemContext(): string {
  const now = new Date();
  const currentDateISO = now.toISOString().split('T')[0];
  return `\n\nТЕКУЩАЯ ДАТА: ${currentDateISO}. Используй её для оценки свежести новостей.`;
}

const WEB_SEARCH_TRIGGERS = [
  /интернет/i, /поиск/i, /найди/i, /поищи/i, /узнай/i,
  /когда/i, /кто/i, /матч/i, /счет/i, /результат/i,
  /сегодня/i, /актуальн/i, /сейчас/i, /новости/i, /курсы/i
];

function wantsWebSearch(text: string): boolean {
  return WEB_SEARCH_TRIGGERS.some((re) => re.test(text));
}

@Injectable()
export class ReplyWithContextService {
  private readonly logger = new Logger(ReplyWithContextService.name);
  private readonly historyLimit: number;

  constructor(
    private readonly localLlm: LocalLlmService,
    private readonly chatHistory: ChatHistoryService,
    private readonly embeddingService: EmbeddingService,
    private readonly qdrantService: QdrantService,
  ) {
    const limit = process.env.CHAT_HISTORY_LIMIT;
    this.historyLimit = limit ? Math.max(1, parseInt(limit, 10)) : DEFAULT_HISTORY_LIMIT;
  }

  async saveIncomingMessage(chatId: string | number, text: string, username?: string): Promise<void> {
    await this.chatHistory.saveMessage(chatId, text, 'user', username);

    if (ENABLE_RAG && this.embeddingService.isConfigured()) {
      this.chatHistory
        .createChunksFromRecentMessages(chatId)
        .catch((err) => {
          this.logger.error('Failed to index incoming message for RAG:', err);
        });
    }
  }

  async getReplyForMessage(
    chatId: string | number,
    newMessageText: string,
    username?: string,
  ): Promise<string | null> {
    if (!this.localLlm.isConfigured()) return 'Ошибка: LLM не настроена.';

    const chatIdStr = String(chatId);

    let rawHistory: { role: "assistant" | "user"; content: string; username: string | null; }[] = [];

    if (ENABLE_RAG && this.embeddingService.isConfigured()) {
      try {
        rawHistory = await this.getHybridHistory(chatIdStr, newMessageText);
      } catch (err) {
        this.logger.error('Ошибка гибридного поиска истории, fallback на обычный:', err);
        rawHistory = await this.chatHistory.getRecentMessages(chatId, RAG_RECENT_MESSAGES);
      }
    } else {
      try {
        rawHistory = await this.chatHistory.getRecentMessages(chatId, this.historyLimit);
      } catch (err) {
        this.logger.error('Ошибка получения истории:', err);
      }
    }

    const messages = rawHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.username ? `${msg.username}: ${msg.content}` : msg.content,
    }));

    let lastUserContent = `${username ?? 'User'}: ${newMessageText}`;

    if (ENABLE_WEB_TOOLS && wantsWebSearch(newMessageText)) {
      lastUserContent += `\n\n[Примечание: Используй web_search для проверки актуальных данных]`;
    }

    messages.push({ role: 'user', content: lastUserContent });

    try {
      const systemPrompt = SYSTEM_PROMPT + (ENABLE_WEB_TOOLS ? getSystemContext() : '');

      const reply = ENABLE_WEB_TOOLS
        ? await this.localLlm.generateChatReplyWithTools(systemPrompt, messages)
        : await this.localLlm.generateChatReply(systemPrompt, messages);

      const output = reply?.trim() || '(Модель промолчала)';

      await this.chatHistory.saveMessage(chatId, newMessageText, 'user', username);
      await this.chatHistory.saveMessage(chatId, output, 'assistant');

      if (ENABLE_RAG && this.embeddingService.isConfigured()) {
        this.chatHistory
          .createChunksFromRecentMessages(chatId)
          .catch((err) => {
            this.logger.error('Failed to index messages for RAG:', err);
          });
      }

      return output;
    } catch (err) {
      this.logger.error('Ошибка генерации LLM:', err);
      return `Ошибка: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  private async getHybridHistory(
    chatId: string,
    queryText: string,
  ): Promise<
    Array<{ role: 'assistant' | 'user'; content: string; username: string | null }>
  > {
    const recentMessages = await this.chatHistory.getRecentMessages(
      chatId,
      RAG_RECENT_MESSAGES,
    );

    let relevantChunks: Array<{
      messageIds: number[];
      chunkText: string;
      usernames: string[];
      createdAt: Date;
      score: number;
    }> = [];

    try {
      const queryVector = await this.embeddingService.generateEmbedding(queryText);
      relevantChunks = await this.qdrantService.searchSimilar(
        chatId,
        queryVector,
        RAG_SIMILAR_LIMIT,
      );
    } catch (err) {
      this.logger.warn('Semantic search failed, using only recent messages:', err);
    }

    const recentMessageIds = new Set(
      recentMessages.map((m) => m.id).filter((id): id is number => id !== undefined),
    );

    const relevantMessageIds = new Set<number>();
    for (const chunk of relevantChunks) {
      for (const msgId of chunk.messageIds) {
        if (!recentMessageIds.has(msgId)) {
          relevantMessageIds.add(msgId);
        }
      }
    }

    const relevantMessagesData =
      relevantMessageIds.size > 0
        ? await this.chatHistory.getMessagesByIds(Array.from(relevantMessageIds))
        : [];

    const allMessages = [...recentMessages, ...relevantMessagesData];

    const seenIds = new Set<number>();
    const uniqueMessages = allMessages
      .filter((msg) => {
        const msgId = msg.id;
        if (msgId && seenIds.has(msgId)) {
          return false;
        }
        if (msgId) {
          seenIds.add(msgId);
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = a.created_at?.getTime() || 0;
        const timeB = b.created_at?.getTime() || 0;
        return timeA - timeB;
      });

    return uniqueMessages.map((m) => ({
      role: m.role,
      content: m.content,
      username: m.username,
    }));
  }
}
