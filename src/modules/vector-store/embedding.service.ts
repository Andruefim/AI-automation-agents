import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'nomic-embed-text';
const REQUEST_TIMEOUT_MS = 30000;

interface OllamaEmbeddingResponse {
  embeddings: number[][];
  model?: string;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.baseUrl =
      process.env.OLLAMA_BASE_URL?.replace(/\/$/, '') || DEFAULT_BASE_URL;
    this.model = process.env.OLLAMA_EMBEDDING_MODEL || DEFAULT_MODEL;
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.model);
  }

  /**
   * Generates embedding vector for a single text using Ollama.
   * Returns array of numbers (embedding vector).
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text?.trim()) {
      throw new Error('Text cannot be empty');
    }

    const url = `${this.baseUrl}/api/embed`;

    try {
      const { data } = await axios.post<OllamaEmbeddingResponse>(
        url,
        {
          model: this.model,
          input: text.trim(),
        },
        { timeout: REQUEST_TIMEOUT_MS },
      );

      const embeddings = data.embeddings;
      if (!embeddings || embeddings.length === 0) {
        throw new Error('Empty embeddings response from Ollama');
      }

      return embeddings[0];
    } catch (err) {
      const msg =
        err?.response?.data?.error ?? err?.message ?? String(err);
      this.logger.error(`Ollama embedding failed: ${msg}`);
      throw new Error(`Embedding generation failed: ${msg}`);
    }
  }

  /**
   * Generates embeddings for multiple texts in a single request (batching).
   * Returns array of embedding vectors.
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const url = `${this.baseUrl}/api/embed`;
    const trimmed = texts.map((t) => t.trim()).filter((t) => t.length > 0);

    if (trimmed.length === 0) {
      throw new Error('No valid texts to embed');
    }

    try {
      const { data } = await axios.post<OllamaEmbeddingResponse>(
        url,
        {
          model: this.model,
          input: trimmed.length === 1 ? trimmed[0] : trimmed,
        },
        { timeout: REQUEST_TIMEOUT_MS },
      );

      const embeddings = data.embeddings;
      if (!embeddings || embeddings.length !== trimmed.length) {
        throw new Error(
          `Expected ${trimmed.length} embeddings, got ${embeddings?.length ?? 0}`,
        );
      }

      return embeddings;
    } catch (err) {
      const msg =
        err?.response?.data?.error ?? err?.message ?? String(err);
      this.logger.error(`Ollama batch embedding failed: ${msg}`);
      throw new Error(`Batch embedding generation failed: ${msg}`);
    }
  }
}
