import { Injectable } from '@nestjs/common';
import { TelegramMcpService } from './telegram-mcp.service';
import { LocalLlmService } from './local-llm.service';

const DEFAULT_HISTORY_LIMIT = 40;
const SYSTEM_PROMPT =
  'Ты бот в Telegram. Отвечай кратко и по делу. Не придумывай лишнего.';

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
   */
  async getReplyForMessage(
    chatId: string | number,
    newMessageText: string,
    username?: string,
  ): Promise<string> {
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
      return reply || '(Пустой ответ модели.)';
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return `Ошибка модели: ${msg}`;
    }
  }
}
