import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { CursorAgentService } from './cursor-agent.service';

const TRIGGER_ONLY_WHEN_MENTIONED = process.env.TELEGRAM_TRIGGER_ON_MENTION === 'true';

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf<Context> | null = null;

  constructor(private readonly cursorAgent: CursorAgentService) {}

  async onModuleInit(): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn(
        '[TelegramCursorBridge] TELEGRAM_BOT_TOKEN not set; Telegram bot will not start.',
      );
      return;
    }
    if (!this.cursorAgent.isConfigured()) {
      console.warn(
        '[TelegramCursorBridge] CURSOR_SESSION_TOKEN not set; agent trigger will fail.',
      );
    }

    this.bot = new Telegraf(token);

    this.bot.on('message', async (ctx) => {
      try {
        const text = 'text' in ctx.message ? ctx.message.text : undefined;
        if (!text || typeof text !== 'string') return;

        const from = ctx.from;
        const username = from?.username ? `@${from.username}` : from?.first_name ?? 'Unknown';
        const chat = ctx.chat;
        const chatTitle =
          chat && 'title' in chat ? chat.title : `Chat ${chat?.id ?? '?'}`;

        // In groups: if TELEGRAM_TRIGGER_ON_MENTION=true, only react when the bot is @mentioned.
        // In private chat: always react to every message.
        const isPrivate = chat?.type === 'private';
        if (!isPrivate && TRIGGER_ONLY_WHEN_MENTIONED) {
          const me = await ctx.telegram.getMe();
          const botUsername = me.username ? `@${me.username}` : '';
          const mentioned = botUsername && text.includes(botUsername);
          if (!mentioned) return;
        }

        const messageContext = `From ${username}: ${text}`;
        const chatInfo = `${chatTitle} (id: ${chat?.id})`;

        const result = await this.cursorAgent.triggerTelegramReplyTask({
          messageContext,
          chatInfo,
        });

        if (result.ok) {
          await ctx.reply('Cursor agent triggered. I’ll reply in Telegram Web shortly.').catch(() => {});
        } else {
          await ctx
            .reply(
              `Failed to trigger Cursor agent: ${result.error ?? 'unknown'}`,
            )
            .catch(() => {});
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[TelegramCursorBridge] Error handling message:', msg);
        await ctx.reply(`Error: ${msg}`).catch(() => {});
      }
    });

    // If a webhook was set (e.g. by another app), getUpdates won't get messages. Remove it.
    try {
      await this.bot.telegram.deleteWebhook({ drop_pending_updates: false });
      await this.bot.launch();
      console.log('[TelegramCursorBridge] Telegram bot started.');
    } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[TelegramCursorBridge] Failed to start bot:', msg);
    this.bot = null;
  }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.bot) {
      this.bot.stop('shutdown');
      this.bot = null;
      console.log('[TelegramCursorBridge] Telegram bot stopped.');
    }
  }
}
