import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Telegraf, Context } from 'telegraf';
import { ReplyWithContextService } from '../context/reply-with-context.service';
import { GroupsService } from '../groups/groups.service';
import { PlatformBot } from '../platform/entities/platform-bot.entity';

const TRIGGER_ONLY_WHEN_MENTIONED = process.env.TELEGRAM_TRIGGER_ON_MENTION === 'true';

interface BotContext extends Context {
  platformBot?: PlatformBot;
}

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private instances: Map<number, Telegraf<BotContext>> = new Map();

  constructor(
    private readonly replyWithContext: ReplyWithContextService,
    private readonly groupsService: GroupsService,
    @InjectRepository(PlatformBot)
    private readonly botRepo: Repository<PlatformBot>,
  ) {}

  async onModuleInit(): Promise<void> {
    const bots = await this.botRepo.find({});
    for (const platformBot of bots) {
      try {
        const bot = new Telegraf<BotContext>(platformBot.telegramBotToken);
        bot.use((ctx, next) => {
          (ctx as BotContext).platformBot = platformBot;
          return next();
        });
        bot.on('message', (ctx) => this.handleMessage(ctx));
        await bot.telegram.deleteWebhook({ drop_pending_updates: false }).catch(() => {});
        await bot.launch();
        this.instances.set(platformBot.id, bot);
        console.log(`[Telegram] Bot @${platformBot.botUsername} (id=${platformBot.id}) started.`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Telegram] Failed to start bot ${platformBot.botUsername}:`, msg);
      }
    }
    if (this.instances.size === 0) {
      console.warn('[Telegram] No bots started (add a bot via the dashboard).');
    }
  }

  private async handleMessage(ctx: BotContext): Promise<void> {
    try {
      const msg = ctx.message;
      const text = msg && 'text' in msg ? msg.text : undefined;
      if (!text || typeof text !== 'string') return;

      const platformBot = ctx.platformBot;
      if (!platformBot) return;

      const from = ctx.from;
      const username = from?.username ? `@${from.username}` : from?.first_name ?? 'Unknown';
      const chat = ctx.chat;
      const isPrivate = chat?.type === 'private';

      if (isPrivate) {
        await ctx.reply('Add me to a group to start. Then send a message in the group.').catch(() => {});
        return;
      }
      if (!chat) return;

      const telegramChatId = String(chat.id);
      const group = await this.groupsService.findOrCreateGroup(
        platformBot.id,
        telegramChatId,
        'title' in chat ? (chat as { title?: string }).title ?? null : null,
        platformBot.platformUserId,
      );
      const chatGroupId = group.id;

      if (TRIGGER_ONLY_WHEN_MENTIONED) {
        const me = await ctx.telegram.getMe();
        const botUsername = me.username ? `@${me.username}` : '';
        const mentioned = botUsername && text.includes(botUsername);
        const hasTriggerWord = /(андроид|дрон|антон)/i.test(text);
        if (!mentioned && !hasTriggerWord) {
          await this.replyWithContext.saveIncomingMessage(chatGroupId, text, username).catch(() => {});
          return;
        }
      }

      const replyText = await this.replyWithContext.getReplyForMessage(
        chatGroupId,
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
  }

  async onModuleDestroy(): Promise<void> {
    for (const [id, bot] of this.instances) {
      bot.stop('shutdown');
      console.log(`[Telegram] Bot id=${id} stopped.`);
    }
    this.instances.clear();
  }
}
