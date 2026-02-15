import { Injectable } from '@nestjs/common';
import { TelegramMcpService } from './telegram-mcp.service';
import { LocalLlmService } from './local-llm.service';

const DEFAULT_HISTORY_LIMIT = 40;

/** Когда модель решает не отвечать, она должна вернуть только эту строку. */
export const SKIP_REPLY_MARKER = '[SKIP]';

const SYSTEM_PROMPT = `Ты умный ассистент пользователя andruefim, его цифровой клон. Реальное имя пользователя — Андрей, а твое - Андроид (или кратко Дрон или Бот)

Правила:
1. Говори в первую очередь по-русски.
2. Отвечай, когда считаешь, что есть смысл ответить; или когда к тебе напрямую обращаются как «андроид», «дрон», «бот»; или когда обращаются к пользователю «andruefim» — тогда отвечай от его имени (Андрей).
3. Всегда отвечай на вопросы, которые не обращены конкретному пользователю (общие вопросы в чате).
4. Отвечай кратко и по делу.

Если в данном сообщении тебе не нужно отвечать (нет обращения к тебе, к Андрею/andruefim, и нет общего вопроса или тебя просят не отвечать ), напиши ровно одну строку без кавычек: ${SKIP_REPLY_MARKER}
В остальных случаях напиши свой ответ. Если после того как тебя просили не отвечать, к тебе снова обратились напрямую, то отвечай.`;

@Injectable()
export class ReplyWithContextService {
  private readonly historyLimit: number;

  constructor(
    private readonly telegramMcp: TelegramMcpService,
    private readonly localLlm: LocalLlmService,
  ) {
    const limit = process.env.CHAT_HISTORY_LIMIT;
    this.historyLimit = limit ? Math.max(1, parseInt(limit, 10)) : DEFAULT_HISTORY_LIMIT;
  }

  /**
   * Builds context from chat history (via MCP), then asks the local LLM for a reply.
   * If MCP is unavailable, uses only the new message (no history).
   * Returns null when the model decided not to reply (output [SKIP]).
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
    if (this.telegramMcp.isConfigured()) {
      try {
        history = await this.telegramMcp.getChatHistory(chatId, this.historyLimit);
      } catch {
        history = '';
      }
    }

    const userPrompt = history
      ? `История чата:\n${history}\n\nНовое сообщение от ${username ?? 'пользователя'}: ${newMessageText}\n\nОтвет бота:`
      : `Новое сообщение от ${username ?? 'пользователя'}: ${newMessageText}\n\nОтвет бота:`;

    try {
      const reply = await this.localLlm.generateReply(SYSTEM_PROMPT, userPrompt);
      const trimmed = reply?.trim() ?? '';
      if (trimmed === SKIP_REPLY_MARKER) return null;
      return trimmed || '(Пустой ответ модели.)';
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return `Ошибка модели: ${msg}`;
    }
  }
}
