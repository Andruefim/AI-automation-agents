import { Injectable, OnModuleDestroy } from '@nestjs/common';

// MCP SDK uses package exports; use require so runtime resolves subpaths
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Client } = require('@modelcontextprotocol/sdk/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio');

/**
 * Connects to a Telegram MCP server (e.g. chigwell/telegram-mcp) via stdio
 * and exposes get_history(chat_id, limit) for chat context.
 */
@Injectable()
export class TelegramMcpService implements OnModuleDestroy {
  private client: InstanceType<typeof Client> | null = null;
  private transport: InstanceType<typeof StdioClientTransport> | null = null;
  private readonly configured: boolean;
  private readonly command: string;
  private readonly args: string[];
  private connectPromise: Promise<void> | null = null;

  constructor() {
    const path = process.env.TELEGRAM_MCP_PATH;
    const cmd = process.env.TELEGRAM_MCP_COMMAND;
    const argsStr = process.env.TELEGRAM_MCP_ARGS;

    if (path) {
      this.command = 'uv';
      this.args = ['--directory', path, 'run', 'main.py'];
      this.configured = true;
    } else if (cmd) {
      this.command = cmd;
      this.args = argsStr ? argsStr.split(',').map((s) => s.trim()) : [];
      this.configured = true;
    } else {
      this.command = '';
      this.args = [];
      this.configured = false;
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Ensures the MCP client is connected (lazy connect on first use).
   */
  private async ensureConnected(): Promise<void> {
    if (this.client) return;
    if (!this.configured) {
      throw new Error(
        'Telegram MCP is not configured. Set TELEGRAM_MCP_PATH or TELEGRAM_MCP_COMMAND (and optionally TELEGRAM_MCP_ARGS) in .env',
      );
    }
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = (async () => {
      this.transport = new StdioClientTransport({
        command: this.command,
        args: this.args,
      });
      this.client = new Client(
        { name: 'telegram-bridge', version: '1.0.0' },
        { capabilities: {} },
      );
      await this.client.connect(this.transport);
    })();

    await this.connectPromise;
  }

  /**
   * Returns the last N messages in the chat (from Telegram MCP get_history).
   * chatId must be the same as the bot's chat id (e.g. ctx.chat.id).
   */
  async getChatHistory(
    chatId: string | number,
    limit: number,
  ): Promise<string> {
    try {
      await this.ensureConnected();
      if (!this.client) throw new Error('MCP client not initialized');

      const result = await this.client.callTool({
        name: 'get_history',
        arguments: {
          chat_id: typeof chatId === 'number' ? chatId : String(chatId),
          limit,
        },
      });

      const content = result.content;
      if (!Array.isArray(content) || content.length === 0) return '';
      const textPart = content.find((c: { type?: string; text?: string }) => c.type === 'text');
      return textPart && typeof textPart.text === 'string' ? textPart.text : '';
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Telegram MCP get_history failed: ${msg}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    this.connectPromise = null;
  }
}
