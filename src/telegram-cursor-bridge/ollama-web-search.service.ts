import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const OLLAMA_CLOUD_BASE = 'https://ollama.com/api';
const DEFAULT_MAX_TOOL_CONTENT_LENGTH = 4000;
const REQUEST_TIMEOUT_MS = 30000;

interface WebSearchResult {
  title: string;
  url: string;
  content: string;
}

interface WebSearchResponse {
  results?: WebSearchResult[];
}

interface WebFetchResponse {
  title?: string;
  content?: string;
  links?: string[];
}

@Injectable()
export class OllamaWebSearchService {
  private readonly logger = new Logger(OllamaWebSearchService.name);
  private readonly apiKey: string | undefined;
  private readonly maxContentLength: number;

  constructor() {
    this.apiKey = process.env.OLLAMA_API_KEY?.trim() || undefined;
    const limit = process.env.OLLAMA_WEB_TOOL_MAX_LENGTH;
    this.maxContentLength = limit
      ? Math.max(500, parseInt(limit, 10))
      : DEFAULT_MAX_TOOL_CONTENT_LENGTH;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Performs a web search via Ollama Cloud API.
   * Returns formatted string for tool message content (truncated to max length).
   */
  async webSearch(
    query: string,
    maxResults: number = 5,
  ): Promise<string> {
    if (!this.apiKey) {
      this.logger.warn('OLLAMA_API_KEY not set; web search skipped.');
      return 'Ошибка: веб-поиск недоступен (не задан OLLAMA_API_KEY).';
    }

    const capped = Math.min(10, Math.max(1, maxResults));
    const url = `${OLLAMA_CLOUD_BASE}/web_search`;

    try {
      const { data } = await axios.post<WebSearchResponse>(
        url,
        { query, max_results: capped },
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          timeout: REQUEST_TIMEOUT_MS,
        },
      );

      const results = data.results ?? [];
      const parts = results.map(
        (r) => `[${r.title}](${r.url})\n${(r.content || '').trim()}`,
      );
      const raw = parts.join('\n\n');
      return this.truncate(raw);
    } catch (err) {
      const msg = err?.response?.data?.error ?? err?.message ?? String(err);
      this.logger.warn('Ollama web_search failed:', msg);
      return `Ошибка веб-поиска: ${msg}`;
    }
  }

  /**
   * Fetches a single page via Ollama Cloud API.
   * Returns title + content as string (truncated).
   */
  async webFetch(url: string): Promise<string> {
    if (!this.apiKey) {
      this.logger.warn('OLLAMA_API_KEY not set; web fetch skipped.');
      return 'Ошибка: загрузка страницы недоступна (не задан OLLAMA_API_KEY).';
    }

    const fetchUrl = `${OLLAMA_CLOUD_BASE}/web_fetch`;

    try {
      const { data } = await axios.post<WebFetchResponse>(
        fetchUrl,
        { url },
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          timeout: REQUEST_TIMEOUT_MS,
        },
      );

      const title = data.title ? `${data.title}\n\n` : '';
      const content = (data.content ?? '').trim();
      const raw = title + content;
      return this.truncate(raw || 'Содержимое страницы пусто.');
    } catch (err) {
      const msg = err?.response?.data?.error ?? err?.message ?? String(err);
      this.logger.warn('Ollama web_fetch failed:', msg);
      return `Ошибка загрузки страницы: ${msg}`;
    }
  }

  private truncate(text: string): string {
    if (text.length <= this.maxContentLength) return text;
    return text.slice(0, this.maxContentLength) + '\n[... обрезано]';
  }
}
