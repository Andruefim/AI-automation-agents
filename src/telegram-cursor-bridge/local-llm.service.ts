import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { OllamaWebSearchService } from './ollama-web-search.service';

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'qwen3:latest';
const MAX_TOOL_ITERATIONS = 5;
const TOOL_RESULT_MAX_LENGTH = 10000;

export type ChatMessage = { role: string; content: string };

interface ToolCallFunction {
  name: string;
  arguments?: Record<string, unknown> | string;
}

interface ToolCall {
  function: ToolCallFunction;
}

interface OllamaMessage {
  role?: string;
  content?: string;
  tool_calls?: ToolCall[];
}

interface OllamaChatResponse {
  message?: OllamaMessage;
}

const WEB_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      description:
        'Search the web for current information. Use for recent events, facts, or when you need up-to-date data. ' +
        'IMPORTANT: Always write the query in English regardless of the language the user used. ' +
        'English queries return significantly more recent and accurate results. ' +
        'Example: if user asks "когда NAVI последний раз играли", use query "NAVI last match result 2026".',
      parameters: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            description: 'Search query. Must be in English for best results.',
          },
          max_results: { type: 'number', description: 'Max results (1-10)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'web_fetch',
      description: 'Fetch and extract main content from a single URL. Use when you have a specific link to read.',
      parameters: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', description: 'Full URL to fetch' },
        },
      },
    },
  },
];

/**
 * Injected before tool loop messages to reinforce English search behavior.
 * Small local models respond better to repeated, concrete instructions.
 */
const TOOL_SYSTEM_REMINDER =
  'When using web_search, always write queries in English. ' +
  'Do not answer questions about recent events from memory — ' +
  'use web_search first and base your answer strictly on the results returned. ' +
  'If search returns no results or results seem outdated, say so explicitly instead of guessing.';

/**
 * Calls a local Ollama (or compatible) API to generate a reply.
 * Uses POST /api/chat with model, prompt, and optional system prompt.
 */
@Injectable()
export class LocalLlmService {
  private readonly logger = new Logger(LocalLlmService.name);
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(private readonly ollamaWebSearch: OllamaWebSearchService) {
    this.baseUrl =
      process.env.OLLAMA_BASE_URL?.replace(/\/$/, '') || DEFAULT_BASE_URL;
    this.model = process.env.OLLAMA_MODEL || DEFAULT_MODEL;
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.model);
  }

  async generateChatReply(
    systemPrompt: string,
    messages: ChatMessage[],
  ): Promise<string> {
    const url = `${this.baseUrl}/api/chat`;
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: false,
      options: { temperature: 0.5 },
    };

    try {
      const { data } = await axios.post<OllamaChatResponse>(url, body, { timeout: 120000 });
      return data.message?.content?.trim() ?? '';
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Ollama Chat failed: ${msg}`);
    }
  }

  /**
   * Generates a reply with web_search and web_fetch tools (agent loop).
   * Stops when the model returns no tool_calls or after MAX_TOOL_ITERATIONS.
   */
  async generateChatReplyWithTools(
    systemPrompt: string,
    messages: ChatMessage[],
  ): Promise<string> {
    const url = `${this.baseUrl}/api/chat`;

    // Append tool behavior reminder to system prompt so it applies for the
    // whole conversation, not just the first turn.
    const enrichedSystemPrompt = `${systemPrompt}\n\n${TOOL_SYSTEM_REMINDER}`;

    const fullMessages: (ChatMessage & { tool_name?: string })[] = [
      { role: 'system', content: enrichedSystemPrompt },
      ...messages,
    ];
    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;
      const body = {
        model: this.model,
        messages: fullMessages,
        stream: false,
        tools: WEB_TOOLS,
        options: {
          temperature: 0.3, // Lower temperature for more reliable tool-calling JSON
          num_ctx: 12288,   // Force a 12k context window (uses about 1-2GB extra VRAM)
        },
      };

      let data: OllamaChatResponse;
      try {
        const res = await axios.post<OllamaChatResponse>(url, body, { timeout: 120000 });
        data = res.data;
        this.logger.debug(
          `Ollama Response (iteration ${iterations}): ${JSON.stringify({
            hasToolCalls: Boolean(data.message?.tool_calls?.length),
            toolCallsCount: data.message?.tool_calls?.length ?? 0,
            contentLength: data.message?.content?.length ?? 0,
          })}`,
        );
        if (data.message?.tool_calls?.length) {
          this.logger.debug(`Tool calls: ${JSON.stringify(data.message.tool_calls)}`);
        }
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string };
        const status = axiosErr?.response?.status;
        const bodyErr = axiosErr?.response?.data;
        const errMsg = axiosErr?.message || String(err);

        // If first iteration with system role gave 400, fall back to user role
        if (iterations === 1 && status === 400) {
          this.logger.warn(
            `Ollama rejected system role with tools, falling back to user role. Error: ${JSON.stringify(bodyErr)}`,
          );
          fullMessages[0] = { role: 'user', content: enrichedSystemPrompt };
          continue;
        }

        if (status === 400 && bodyErr != null) {
          this.logger.error(`Ollama 400 response: ${JSON.stringify(bodyErr)}`);
        } else if (status) {
          this.logger.error(`Ollama HTTP ${status} error: ${JSON.stringify(bodyErr)}`);
        } else {
          this.logger.error(`Ollama request error: ${errMsg}`);
        }
        throw err;
      }

      const message = data.message;
      if (!message) {
        return '';
      }

      const assistantMsg: Record<string, unknown> = {
        role: 'assistant',
        content: message.content ?? '',
      };
      if (message.tool_calls?.length) {
        assistantMsg.tool_calls = message.tool_calls;
      }
      fullMessages.push(assistantMsg as ChatMessage & { tool_name?: string });

      const toolCalls = message.tool_calls ?? [];
      if (toolCalls.length === 0) {
        this.logger.debug(
          `No tool_calls in iteration ${iterations}, returning content: ${(message.content ?? '').slice(0, 100)}`,
        );
        return (message.content ?? '').trim();
      }

      for (const call of toolCalls) {
        const name = call.function?.name;
        const rawArgs = call.function?.arguments;
        const args =
          typeof rawArgs === 'string'
            ? (() => {
                try {
                  return (JSON.parse(rawArgs) as Record<string, unknown>) ?? {};
                } catch {
                  return {};
                }
              })()
            : { ...(rawArgs ?? {}) };

        let content: string;
        if (name === 'web_search') {
          const query = String(args.query ?? '').trim() || 'general';
          const maxResults = typeof args.max_results === 'number' ? args.max_results : 5;
          // Log the actual query so we can verify English enforcement in debug
          this.logger.debug(`web_search called with query: "${query}"`);
          content = await this.ollamaWebSearch.webSearch(query, maxResults);
        } else if (name === 'web_fetch') {
          const urlArg = String(args.url ?? '').trim();
          content = urlArg
            ? await this.ollamaWebSearch.webFetch(urlArg)
            : 'Ошибка: не указан url для web_fetch.';
        } else {
          content = `Неизвестный инструмент: ${name}.`;
        }

        if (content.length > TOOL_RESULT_MAX_LENGTH) {
          content = content.slice(0, TOOL_RESULT_MAX_LENGTH) + '\n[... обрезано]';
        }
        fullMessages.push({
          role: 'tool',
          tool_name: name,
          content,
        });
      }
    }

    this.logger.warn(`Tool loop reached ${MAX_TOOL_ITERATIONS} iterations; returning last content.`);
    const lastAssistant = fullMessages
      .slice()
      .reverse()
      .find((m) => m.role === 'assistant');
    return (lastAssistant?.content ?? '').trim();
  }
}