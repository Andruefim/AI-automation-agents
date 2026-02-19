import { Injectable, Logger } from '@nestjs/common';
import { LocalLlmService } from './local-llm.service';
import { ChatHistoryService } from './chat-history.service';

const DEFAULT_HISTORY_LIMIT = 20; // Уменьшено до 20, чтобы оставить место под результаты поиска в контексте 12GB VRAM
const USE_TELEGRAM_MCP = process.env.USE_TELEGRAM_MCP === 'true';
const ENABLE_WEB_TOOLS = process.env.ENABLE_WEB_TOOLS === 'true';

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
  ) {
    const limit = process.env.CHAT_HISTORY_LIMIT;
    this.historyLimit = limit ? Math.max(1, parseInt(limit, 10)) : DEFAULT_HISTORY_LIMIT;
  }

  async saveIncomingMessage(chatId: string | number, text: string, username?: string): Promise<void> {
    if (USE_TELEGRAM_MCP) return;
    await this.chatHistory.saveMessage(chatId, text, 'user', username);
  }

  async getReplyForMessage(
    chatId: string | number,
    newMessageText: string,
    username?: string,
  ): Promise<string | null> {
    if (!this.localLlm.isConfigured()) return 'Ошибка: LLM не настроена.';

    // 1. История
    let rawHistory: { role: "assistant" | "user"; content: string; username: string | null; }[] = [];
    try {
      rawHistory = await this.chatHistory.getRecentMessages(chatId, this.historyLimit);
    } catch (err) {
      this.logger.error('Ошибка получения истории:', err);
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
      }

      return output;
    } catch (err) {
      this.logger.error('Ошибка генерации LLM:', err);
      return `Ошибка: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
}