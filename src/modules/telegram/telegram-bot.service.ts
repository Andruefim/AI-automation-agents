import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { ReplyWithContextService } from '../context/reply-with-context.service';

const TRIGGER_ONLY_WHEN_MENTIONED = process.env.TELEGRAM_TRIGGER_ON_MENTION === 'true';

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf<Context> | null = null;

  constructor(private readonly replyWithContext: ReplyWithContextService) {}

  async onModuleInit(): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn(
        '[Telegram] TELEGRAM_BOT_TOKEN not set; Telegram bot will not start.',
      );
      return;
    }
    this.bot = new Telegraf(token);

    this.bot.on('message', async (ctx) => {
      try {
        const text = 'text' in ctx.message ? ctx.message.text : undefined;
        if (!text || typeof text !== 'string') return;

        const from = ctx.from;
        const username = from?.username ? `@${from.username}` : from?.first_name ?? 'Unknown';
        const chat = ctx.chat;

        const isPrivate = chat?.type === 'private';
        if (!isPrivate && TRIGGER_ONLY_WHEN_MENTIONED) {
          const me = await ctx.telegram.getMe();
          const botUsername = me.username ? `@${me.username}` : '';
          const mentioned = botUsername && text.includes(botUsername);
          const hasTriggerWord = /(андроид|дрон|антон)/i.test(text);
          if (!mentioned && !hasTriggerWord) {
            await this.replyWithContext.saveIncomingMessage(chat?.id ?? 0, text, username).catch(() => {});
            return;
          }
        }

        const replyText = await this.replyWithContext.getReplyForMessage(
          chat?.id ?? 0,
          text,
          username,
        );
        if (replyText !== null) {
          await ctx.reply(replyText).catch(() => {});
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Telegram] Error handling message:', msg);
        await ctx.reply(`Error: ${msg}`).catch(() => {});
      }
    });

    try {
      await this.bot.telegram.deleteWebhook({ drop_pending_updates: false });
      await this.bot.launch();
      console.log('[Telegram] Telegram bot started.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Telegram] Failed to start bot:', msg);
      this.bot = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.bot) {
      this.bot.stop('shutdown');
      this.bot = null;
      console.log('[Telegram] Telegram bot stopped.');
    }
  }
}
