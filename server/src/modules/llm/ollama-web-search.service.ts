import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const OLLAMA_CLOUD_BASE = 'https://ollama.com/api';
const DEFAULT_MAX_TOOL_CONTENT_LENGTH = 4000;
const DEFAULT_MAX_SNIPPET_LENGTH = 600;
const DEFAULT_CACHE_TTL_SEC = 300;
const DEFAULT_MAX_CACHE_ENTRIES = 150;
const REQUEST_TIMEOUT_MS = 30000;

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
  'has', 'have', 'had', 'do', 'did', 'will', 'would', 'can', 'could',
  'that', 'this', 'it', 'its', 'as', 'up', 'out', 'if', 'about', 'into',
  'и', 'в', 'на', 'с', 'по', 'за', 'к', 'о', 'у', 'из', 'от', 'до',
  'не', 'что', 'как', 'но', 'а', 'или', 'же', 'ли', 'бы', 'то', 'это',
  'он', 'она', 'они', 'мы', 'вы', 'я', 'ты', 'его', 'её', 'их', 'нет',
]);

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

interface CacheEntry {
  value: string;
  expiresAt: number;
}

@Injectable()
export class OllamaWebSearchService {
  private readonly logger = new Logger(OllamaWebSearchService.name);
  private readonly apiKey: string | undefined;
  private readonly maxContentLength: number;
  private readonly maxSnippetLength: number;
  private readonly rerank: boolean;
  private readonly cacheTtlMs: number;
  private readonly maxCacheEntries: number;
  private readonly cache = new Map<string, CacheEntry>();

  constructor() {
    this.apiKey = process.env.OLLAMA_API_KEY?.trim() || undefined;

    const limit = process.env.OLLAMA_WEB_TOOL_MAX_LENGTH;
    this.maxContentLength = limit
      ? Math.max(500, parseInt(limit, 10))
      : DEFAULT_MAX_TOOL_CONTENT_LENGTH;

    const snippetLimit = process.env.OLLAMA_WEB_SNIPPET_MAX_LENGTH;
    this.maxSnippetLength = snippetLimit
      ? Math.max(100, parseInt(snippetLimit, 10))
      : DEFAULT_MAX_SNIPPET_LENGTH;

    this.rerank = process.env.RERANK_WEB_SEARCH !== 'false';

    const ttl = process.env.WEB_SEARCH_CACHE_TTL_SEC;
    this.cacheTtlMs =
      ttl !== undefined
        ? Math.max(0, parseInt(ttl, 10)) * 1000
        : DEFAULT_CACHE_TTL_SEC * 1000;

    this.maxCacheEntries = DEFAULT_MAX_CACHE_ENTRIES;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async webSearch(query: string, maxResults: number = 5): Promise<string> {
    if (!this.apiKey) {
      this.logger.warn('OLLAMA_API_KEY not set; web search skipped.');
      return 'Ошибка: веб-поиск недоступен (не задан OLLAMA_API_KEY).';
    }

    const normalizedQuery = this.normalizeQuery(query);
    const capped = Math.min(10, Math.max(1, maxResults));
    const cacheKey = `web_search:${normalizedQuery}:${capped}`;

    const cached = this.cacheGet(cacheKey);
    if (cached !== null) {
      this.logger.debug(`Cache hit for web_search: "${normalizedQuery}"`);
      return cached;
    }

    const url = `${OLLAMA_CLOUD_BASE}/web_search`;

    try {
      const { data } = await axios.post<WebSearchResponse>(
        url,
        { query: normalizedQuery, max_results: capped },
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          timeout: REQUEST_TIMEOUT_MS,
        },
      );

      const results = data.results ?? [];

      if (results.length === 0) {
        this.logger.warn(`Web search returned 0 results for: "${normalizedQuery}"`);
        const noResults =
          `No web results found for: "${normalizedQuery}". ` +
          `Do not answer from memory — tell the user the information is unavailable.`;
        this.cacheSet(cacheKey, noResults);
        return noResults;
      }

      const seen = new Set<string>();
      const unique = results.filter((r) => {
        const key = this.normalizeUrl(r.url);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const ranked = this.rerank ? this.rerankResults(unique, normalizedQuery) : unique;

      this.logger.debug(
        `Web search "${normalizedQuery}": ${results.length} results, ` +
        `${unique.length} after dedup, rerank=${this.rerank}`,
      );

      const searchDate = new Date().toISOString().split('T')[0];
      const header = `[Search date: ${searchDate}. Answer strictly from the results below.]\n\n`;
      const result = this.buildFromSnippets(ranked, header);

      this.cacheSet(cacheKey, result);
      return result;
    } catch (err) {
      const msg = (err as any)?.response?.data?.error ?? (err as any)?.message ?? String(err);
      this.logger.warn('Ollama web_search failed:', msg);
      return `Ошибка веб-поиска: ${msg}`;
    }
  }

  async webFetch(url: string): Promise<string> {
    if (!this.apiKey) {
      this.logger.warn('OLLAMA_API_KEY not set; web fetch skipped.');
      return 'Ошибка: загрузка страницы недоступна (не задан OLLAMA_API_KEY).';
    }

    const normalizedUrl = this.normalizeUrl(url);
    const cacheKey = `web_fetch:${normalizedUrl}`;

    const cached = this.cacheGet(cacheKey);
    if (cached !== null) {
      this.logger.debug(`Cache hit for web_fetch: "${normalizedUrl}"`);
      return cached;
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
      const result = this.truncate(raw || 'Содержимое страницы пусто.');

      this.cacheSet(cacheKey, result);
      return result;
    } catch (err) {
      const msg = (err as any)?.response?.data?.error ?? (err as any)?.message ?? String(err);
      this.logger.warn('Ollama web_fetch failed:', msg);
      return `Ошибка загрузки страницы: ${msg}`;
    }
  }

  private buildFromSnippets(results: WebSearchResult[], header: string): string {
    const budget = this.maxContentLength - header.length;
    const separator = '\n\n';
    let accumulated = '';
    let used = 0;
    let dropped = 0;

    for (const r of results) {
      const snippet = this.formatSnippet(r);
      const addition = (used === 0 ? '' : separator) + snippet;
      if (used + addition.length > budget) {
        dropped++;
        continue;
      }
      accumulated += addition;
      used += addition.length;
    }

    if (dropped > 0) {
      accumulated += `\n[... ${dropped} result(s) dropped due to length limit]`;
    }

    return header + accumulated;
  }

  private formatSnippet(r: WebSearchResult): string {
    const content = (r.content || '').trim();
    const capped =
      content.length > this.maxSnippetLength
        ? content.slice(0, this.maxSnippetLength) + '…'
        : content;
    return `[${r.title}](${r.url})\n${capped}`;
  }

  private rerankResults(results: WebSearchResult[], query: string): WebSearchResult[] {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));

    if (terms.length === 0) return results;

    const scored = results.map((r, i) => {
      const haystack = `${r.title} ${r.content}`.toLowerCase();
      const score = terms.reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0);
      return { r, score, i };
    });

    scored.sort((a, b) => b.score - a.score || a.i - b.i);
    return scored.map((s) => s.r);
  }

  private normalizeQuery(query: string): string {
    return query.trim().replace(/\s+/g, ' ');
  }

  private normalizeUrl(url: string): string {
    return url.trim().toLowerCase().replace(/\/+$/, '');
  }

  private truncate(text: string): string {
    if (text.length <= this.maxContentLength) return text;
    return text.slice(0, this.maxContentLength) + '\n[... обрезано]';
  }

  private cacheGet(key: string): string | null {
    if (this.cacheTtlMs === 0) return null;
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  private cacheSet(key: string, value: string): void {
    if (this.cacheTtlMs === 0) return;

    if (this.cache.size >= this.maxCacheEntries && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { value, expiresAt: Date.now() + this.cacheTtlMs });
  }
}
