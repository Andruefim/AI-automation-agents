import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2';

/**
 * Calls a local Ollama (or compatible) API to generate a reply.
 * Uses POST /api/generate with model, prompt, and optional system prompt.
 */
@Injectable()
export class LocalLlmService {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.baseUrl =
      process.env.OLLAMA_BASE_URL?.replace(/\/$/, '') || DEFAULT_BASE_URL;
    this.model = process.env.OLLAMA_MODEL || DEFAULT_MODEL;
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.model);
  }

  /**
   * Generate a single reply. Waits for the full response (no streaming).
   */
  async generateReply(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const url = `${this.baseUrl}/api/generate`;
    const body: Record<string, unknown> = {
      model: this.model,
      prompt: userPrompt,
      stream: false,
      options: {
        temperature: 0.5,
      }
    };
    if (systemPrompt) {
      body.system = systemPrompt;
    }

    try {
      const { data } = await axios.post(url, body, {
        timeout: 120000,
        responseType: 'json',
      });
      if (data.response && typeof data.response === 'string') {
        return data.response.trim();
      }
      return '';
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      const message =
        axiosError.response?.data?.error ??
        axiosError.message ??
        'Unknown error';
      throw new Error(`Ollama request failed: ${message}`);
    }
  }
}
