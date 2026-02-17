import { Injectable } from '@nestjs/common';
import { TelegramMcpService } from './telegram-mcp.service';
import { LocalLlmService } from './local-llm.service';
import { ChatHistoryService } from './chat-history.service';

const DEFAULT_HISTORY_LIMIT = 20; // Уменьшено со 100 до 20 для лучшего фокуса локальной модели

const USE_TELEGRAM_MCP = process.env.USE_TELEGRAM_MCP === 'true';

/** Когда модель решает не отвечать, она должна вернуть только эту строку. */
export const SKIP_REPLY_MARKER = '[SKIP]';

export const SYSTEM_PROMPT = `Ты — Андроид (Дрон, Бот), цифровой клон Андрея (andruefim). У тебя есть кличка - Антон. 
Твой стиль: неформальный, прямой. Обращайся ко всем только на «ты».

ТЫ НАХОДИШЬСЯ В ГРУППОВОМ ЧАТЕ. Твоя главная задача — не спамить. 

ПРАВИЛА ОТВЕТА:
1. Если сообщение НЕ адресовано тебе лично (нет слов "андроид", "дрон", "бот", "антон") и НЕ является общим вопросом ко всем, ты ОБЯЗАН ответить только одной строкой: ${SKIP_REPLY_MARKER}
2. Отвечай, если:
   - Тебя позвали по имени (Бот/Дрон/Андроид/Антон).
   - Кто-то задал вопрос всему чату (н-р: "Пацаны, как погода?").
   - Пишет сама Таня — отвечай ей максимально нейтрально и коротко.
3. Краткость: пиши не больше 1-2 предложений.
4. Внимательно разделяй Блок Истории и Новое Сообщение. Отвечай только на Новое Сообщение, используя Историю исключительно для понимания темы разговора. Не пытайся отвечать на старые реплики из истории.

Если сомневаешься, уместно ли влезть в разговор — молчи и пиши ${SKIP_REPLY_MARKER}.`;

@Injectable()
export class ReplyWithContextService {
  private readonly historyLimit: number;

  constructor(
    private readonly telegramMcp: TelegramMcpService,
    private readonly localLlm: LocalLlmService,
    private readonly chatHistory: ChatHistoryService,
  ) {
    const limit = process.env.CHAT_HISTORY_LIMIT;
    this.historyLimit = limit ? Math.max(1, parseInt(limit, 10)) : DEFAULT_HISTORY_LIMIT;
  }

  /**
   * Builds context from chat history, then asks the local LLM for a reply.
   */
  async getReplyForMessage(
    chatId: string | number,
    newMessageText: string,
    username?: string,
  ): Promise<string | null> {
    if (!this.localLlm.isConfigured()) {
      return 'Локальная модель недоступна. Укажите OLLAMA_BASE_URL и OLLAMA_MODEL.';
    }

    let history = '';
    if (USE_TELEGRAM_MCP && this.telegramMcp.isConfigured()) {
      try {
        history = await this.telegramMcp.getChatHistory(chatId, this.historyLimit);
      } catch {
        history = '';
      }
    } else {
      history = await this.chatHistory.getRecentContext(chatId, this.historyLimit);
    }

    // Формируем структурированный промпт с явными разделителями
    const userPrompt = `### ПОСЛЕДНИЕ СООБЩЕНИЯ В ЧАТЕ (ДЛЯ КОНТЕКСТА):
${history || 'История пуста.'}

### НОВОЕ СООБЩЕНИЕ ОТ ${username?.toUpperCase() ?? 'ПОЛЬЗОВАТЕЛЯ'} (ОТВЕТЬ НА НЕГО):
${newMessageText}

Инструкция: Если сообщение не требует твоей реакции, ответь только: ${SKIP_REPLY_MARKER}. В противном случае напиши краткий ответ.
Ответ бота:`;

    try {
      const reply = await this.localLlm.generateReply(SYSTEM_PROMPT, userPrompt);
      const trimmed = reply?.trim() ?? '';

      // Логируем входящее сообщение, если не используем MCP
      if (!USE_TELEGRAM_MCP) {
        await this.chatHistory.saveMessage(chatId, newMessageText, 'user', username);
      }

      if (trimmed === SKIP_REPLY_MARKER || trimmed.includes(SKIP_REPLY_MARKER)) {
        return null;
      }

      const out = trimmed || '(Пустой ответ модели.)';

      // Логируем ответ бота, если не используем MCP
      if (!USE_TELEGRAM_MCP) {
        await this.chatHistory.saveMessage(chatId, out, 'assistant', null);
      }

      return out;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return `Ошибка модели: ${msg}`;
    }
  }
}