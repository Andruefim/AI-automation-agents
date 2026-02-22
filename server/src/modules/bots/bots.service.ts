import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { PlatformBot } from '../platform/entities/platform-bot.entity';
import { ChatGroup } from '../platform/entities/chat-group.entity';

interface TelegramGetMeResponse {
  ok: boolean;
  result?: { id: number; is_bot: boolean; first_name: string; username?: string };
}

@Injectable()
export class BotsService {
  constructor(
    @InjectRepository(PlatformBot)
    private readonly botRepo: Repository<PlatformBot>,
    @InjectRepository(ChatGroup)
    private readonly groupRepo: Repository<ChatGroup>,
  ) {}

  async createBot(token: string, platformUserId: number): Promise<{ botId: number; botUsername: string }> {
    const trimmed = token.trim();
    if (!trimmed) {
      throw new BadRequestException('Token is required');
    }
    const res = await axios
      .get<TelegramGetMeResponse>(`https://api.telegram.org/bot${trimmed}/getMe`, { timeout: 10000 })
      .catch(() => null);
    if (!res?.data?.ok || !res.data.result?.username) {
      throw new BadRequestException('Invalid bot token');
    }
    const botUsername = res.data.result.username;
    const existing = await this.botRepo.findOne({
      where: { platformUserId, telegramBotToken: trimmed },
    });
    if (existing) {
      return { botId: existing.id, botUsername: existing.botUsername };
    }
    const bot = this.botRepo.create({
      platformUserId,
      telegramBotToken: trimmed,
      botUsername,
    });
    await this.botRepo.save(bot);
    return { botId: bot.id, botUsername: bot.botUsername };
  }

  async getBotStatus(
    botId: number,
    platformUserId: number,
  ): Promise<{ connected: boolean; groups: Array<{ id: number; title: string | null; telegramChatId: string | null }> }> {
    const bot = await this.botRepo.findOne({
      where: { id: botId, platformUserId },
      relations: ['chatGroups'],
    });
    if (!bot) {
      throw new ForbiddenException('Bot not found');
    }
    const groups = (bot.chatGroups || []).map((g) => ({
      id: g.id,
      title: g.title,
      telegramChatId: g.telegramChatId,
    }));
    const connected = groups.length > 0;
    return { connected, groups };
  }

  async findBotByToken(token: string): Promise<PlatformBot | null> {
    return this.botRepo.findOne({ where: { telegramBotToken: token } });
  }

  async getBotsForUser(platformUserId: number): Promise<PlatformBot[]> {
    return this.botRepo.find({
      where: { platformUserId },
      order: { createdAt: 'DESC' },
    });
  }
}
