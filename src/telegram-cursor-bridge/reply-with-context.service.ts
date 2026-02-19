import { Injectable, Logger } from '@nestjs/common';
import { LocalLlmService } from './local-llm.service';
import { ChatHistoryService } from './chat-history.service';

const DEFAULT_HISTORY_LIMIT = 30; // Оптимально для 12GB VRAM и сохранения контекста
const USE_TELEGRAM_MCP = process.env.USE_TELEGRAM_MCP === 'true';
const ENABLE_WEB_TOOLS = process.env.ENABLE_WEB_TOOLS === 'true';

export const SKIP_REPLY_MARKER = '[SKIP]';

export const SYSTEM_PROMPT = `Ты — Андроид (клички: Дрон, Бот).
Обращайся ко всем только на «ты».

ТЫ НАХОДИШЬСЯ В ГРУППОВОМ ЧАТЕ.

ПРАВИЛА ОТВЕТА:
1. Если решаешь промолчать — ответь одной строкой: только ${SKIP_REPLY_MARKER}, без единого другого символа.
2. Если отвечаешь — пиши текст ответа сразу, никогда не начинай с ${SKIP_REPLY_MARKER} и не вставляй его в сообщение.`;

/** Возвращает системный промпт для веб-инструментов с текущей датой. */
function getSystemPromptWebTools(): string {
  const now = new Date();
  const currentDate = now.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const currentDateISO = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  return `
ИНСТРУМЕНТЫ: Тебе доступны 'web_search' и 'web_fetch'.
ТЕКУЩАЯ ДАТА: Сегодня ${currentDate} (${currentDateISO}). Когда пользователь просит "новости на сегодня", "сегодня", "актуальные новости" — используй эту дату в запросе web_search.
ТВОЯ ОБЯЗАННОСТЬ: 
1. Если вопрос касается событий после 2023 года, новостей, цен или погоды — ты ДОЛЖЕН сначала вызвать web_search.
2. При запросах "на сегодня" / "сегодня" / "актуальные" — обязательно включи текущую дату (${currentDateISO}) в запрос web_search.
3. Никогда не говори "я не могу проверить интернет". Ты МОЖЕШЬ, используя инструменты.
4. Если пользователь прислал ссылку — используй 'web_fetch', чтобы прочитать её.
5. Сначала выполни поиск, получи результат, и только потом отвечай пользователю.`;
}

/** Фразы, при которых в конец сообщения пользователя добавляется явный запрос на вызов web_search. */
const WEB_SEARCH_TRIGGERS = [
  /проверь в интернете/i,
  /найди в интернете/i,
  /поищи в интернете/i,
  /поиск(и|ать)?\s+(в интернете|в сети)/i,
  /\bнайди\b/i,
  /найди\s+(информацию|данные|когда|что)/i,
  /когда выйдет/i,
  /(на сегодня|сегодня)/i,
  /текущ(ая|ий|ие)/i,
  /актуальн/i,
  /у тебя есть доступ к интернету/i,
  /есть доступ к интернету/i,
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

  async getReplyForMessage(
    chatId: string | number,
    newMessageText: string,
    username?: string,
  ): Promise<string | null> {
    if (!this.localLlm.isConfigured()) {
      return 'Локальная модель не настроена.';
    }

    // 1. Получаем историю в виде массива объектов (из БД или MCP)
    type HistoryItem = { role: 'user' | 'assistant'; content: string; username: string | null };
    let rawHistory: HistoryItem[] = [];
    try {
      rawHistory = await this.chatHistory.getRecentMessages(chatId, this.historyLimit);
    } catch (err) {
      this.logger.error('Ошибка получения истории:', err);
    }

    // 2. Формируем массив сообщений для Chat API
    const messages = rawHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.username ? `${msg.username}: ${msg.content}` : msg.content,
    }));

    // 3. Добавляем текущее (новое) сообщение; при явном запросе поиска подсказываем модели вызвать web_search
    let lastUserContent = `${username ?? 'User'}: ${newMessageText}`;
    if (ENABLE_WEB_TOOLS && wantsWebSearch(newMessageText)) {
      const now = new Date();
      const currentDateISO = now.toISOString().split('T')[0];
      const hasTodayKeyword = /(на сегодня|сегодня|актуальн)/i.test(newMessageText);
      const hint = hasTodayKeyword
        ? `\n[Обязательно используй web_search с текущей датой ${currentDateISO} в запросе.]`
        : '\n[Обязательно используй инструмент web_search для ответа на этот запрос.]';
      lastUserContent += hint;
    }
    messages.push({
      role: 'user',
      content: lastUserContent,
    });

    try {
      const systemPrompt = ENABLE_WEB_TOOLS
        ? SYSTEM_PROMPT + getSystemPromptWebTools()
        : SYSTEM_PROMPT;
      if (ENABLE_WEB_TOOLS) {
        this.logger.debug(`Web tools enabled, using generateChatReplyWithTools`);
      }
      const reply = ENABLE_WEB_TOOLS
        ? await this.localLlm.generateChatReplyWithTools(systemPrompt, messages)
        : await this.localLlm.generateChatReply(systemPrompt, messages);
      const trimmed = reply?.trim() ?? '';

      // Сохраняем входящее сообщение в БД
      if (!USE_TELEGRAM_MCP) {
        await this.chatHistory.saveMessage(chatId, newMessageText, 'user', username);
      }

      // Пропуск только при точном совпадении с [SKIP]
      if (trimmed === SKIP_REPLY_MARKER) {
        return null;
      }

      // Убираем случайный [SKIP] в начале ответа (модель иногда лепит его по привычке)
      let output = trimmed
        .replace(/^\s*\[SKIP\]\s*-?\s*/i, '')
        .trim();
      output = output || '(Модель промолчала)';

      // Сохраняем ответ бота в БД
      if (!USE_TELEGRAM_MCP) {
        await this.chatHistory.saveMessage(chatId, output, 'assistant');
      }

      return output;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error('Ошибка генерации LLM:', msg);
      return `Ошибка: ${msg}`;
    }
  }
}
