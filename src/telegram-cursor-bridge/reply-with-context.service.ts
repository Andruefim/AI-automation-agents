import { Injectable, Logger } from '@nestjs/common';
import { LocalLlmService } from './local-llm.service';
import { ChatHistoryService } from './chat-history.service';
import { EmbeddingService } from './embedding.service';
import { QdrantService } from './qdrant.service';

const DEFAULT_HISTORY_LIMIT = 20; // Уменьшено до 20, чтобы оставить место под результаты поиска в контексте 12GB VRAM
const USE_TELEGRAM_MCP = process.env.USE_TELEGRAM_MCP === 'true';
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

/** * Возвращает только факты о дате. 
 * Инструкции по использованию функций Ollama добавит сама автоматически.
 */
function getSystemContext(): string {
  const now = new Date();
  const currentDateISO = now.toISOString().split('T')[0];
  return `\n\nТЕКУЩАЯ ДАТА: ${currentDateISO}. Используй её для оценки свежести новостей.`;
}

/** Расширенные триггеры для поиска (включая спорт и киберспорт) */
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
    if (USE_TELEGRAM_MCP) return;
    await this.chatHistory.saveMessage(chatId, text, 'user', username);
    
    // Индексация для RAG (асинхронно, не блокируем ответ)
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

    // 1. Получить историю: гибридный подход (свежее + релевантное) если RAG включен
    let rawHistory: { role: "assistant" | "user"; content: string; username: string | null; }[] = [];
    
    if (ENABLE_RAG && this.embeddingService.isConfigured()) {
      try {
        // Гибридный поиск: свежее + семантически релевантное
        rawHistory = await this.getHybridHistory(chatIdStr, newMessageText);
      } catch (err) {
        this.logger.error('Ошибка гибридного поиска истории, fallback на обычный:', err);
        // Fallback на обычный поиск
        rawHistory = await this.chatHistory.getRecentMessages(chatId, RAG_RECENT_MESSAGES);
      }
    } else {
      // Обычный поиск по времени
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

    // 2. Текущее сообщение
    let lastUserContent = `${username ?? 'User'}: ${newMessageText}`;
    
    // Мягкая подсказка (hint) остается — она помогает 8b моделям "решиться" на вызов инструмента
    if (ENABLE_WEB_TOOLS && wantsWebSearch(newMessageText)) {
      lastUserContent += `\n\n[Примечание: Используй web_search для проверки актуальных данных за 2026 год]`;
    }

    messages.push({ role: 'user', content: lastUserContent });

    try {
      // Собираем промпт: Личность + Дата
      const systemPrompt = SYSTEM_PROMPT + (ENABLE_WEB_TOOLS ? getSystemContext() : '');

      const reply = ENABLE_WEB_TOOLS
        ? await this.localLlm.generateChatReplyWithTools(systemPrompt, messages)
        : await this.localLlm.generateChatReply(systemPrompt, messages);

      const output = reply?.trim() || '(Модель промолчала)';

      // 3. Сохранение
      if (!USE_TELEGRAM_MCP) {
        await this.chatHistory.saveMessage(chatId, newMessageText, 'user', username);
        await this.chatHistory.saveMessage(chatId, output, 'assistant');
        
        // Индексация для RAG (асинхронно, не блокируем ответ)
        if (ENABLE_RAG && this.embeddingService.isConfigured()) {
          this.chatHistory
            .createChunksFromRecentMessages(chatId)
            .catch((err) => {
              this.logger.error('Failed to index messages for RAG:', err);
            });
        }
      }

      return output;
    } catch (err) {
      this.logger.error('Ошибка генерации LLM:', err);
      return `Ошибка: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  /**
   * Гибридный поиск: объединяет свежие сообщения с семантически релевантными из истории.
   * Возвращает дедуплицированный список сообщений.
   */
  private async getHybridHistory(
    chatId: string,
    queryText: string,
  ): Promise<
    Array<{ role: 'assistant' | 'user'; content: string; username: string | null }>
  > {
    // 1. Получить свежие сообщения (для контекста)
    const recentMessages = await this.chatHistory.getRecentMessages(
      chatId,
      RAG_RECENT_MESSAGES,
    );

    // 2. Семантический поиск релевантных чанков
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

    // 3. Дедупликация: собрать все message_ids из свежих
    const recentMessageIds = new Set(
      recentMessages.map((m) => m.id).filter((id): id is number => id !== undefined),
    );

    // 4. Получить полные сообщения из релевантных чанков (исключая дубликаты)
    const relevantMessageIds = new Set<number>();
    for (const chunk of relevantChunks) {
      for (const msgId of chunk.messageIds) {
        if (!recentMessageIds.has(msgId)) {
          relevantMessageIds.add(msgId);
        }
      }
    }

    // 5. Загрузить сообщения по IDs из БД
    const relevantMessagesData =
      relevantMessageIds.size > 0
        ? await this.chatHistory.getMessagesByIds(Array.from(relevantMessageIds))
        : [];

    // 6. Объединить: сначала свежие, потом релевантные (отсортированные по времени)
    const allMessages = [...recentMessages, ...relevantMessagesData];

    // 7. Дедупликация по ID и сортировка по времени
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