import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryFailedError } from 'typeorm';
import { ChatGroup } from '../platform/entities/chat-group.entity';
import { PlatformBot } from '../platform/entities/platform-bot.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(ChatGroup)
    private readonly groupRepo: Repository<ChatGroup>,
    @InjectRepository(PlatformBot)
    private readonly botRepo: Repository<PlatformBot>,
  ) {}

  async listForUser(platformUserId: number): Promise<ChatGroup[]> {
    const bots = await this.botRepo.find({
      where: { platformUserId },
      select: ['id'],
    });
    const botIds = bots.map((b) => b.id);
    if (botIds.length === 0) return [];
    return this.groupRepo.find({
      where: botIds.map((botId) => ({ botId })),
      relations: ['bot'],
      order: { createdAt: 'DESC' },
    });
  }

  async getOne(id: number, platformUserId: number): Promise<ChatGroup> {
    const group = await this.groupRepo.findOne({
      where: { id },
      relations: ['bot'],
    });
    if (!group) throw new NotFoundException('Group not found');
    if (group.bot.platformUserId !== platformUserId) {
      throw new ForbiddenException('Access denied');
    }
    return group;
  }

  async updateSettings(
    id: number,
    platformUserId: number,
    settings: Record<string, unknown>,
  ): Promise<ChatGroup> {
    const group = await this.getOne(id, platformUserId);
    group.settingsJson = { ...(group.settingsJson || {}), ...settings };
    await this.groupRepo.save(group);
    return group;
  }

  async findOrCreateGroup(
    botId: number,
    telegramChatId: string,
    title: string | null,
    ownerPlatformUserId: number,
  ): Promise<ChatGroup> {
    let group = await this.groupRepo.findOne({
      where: { botId, telegramChatId },
    });
    if (group) {
      if (title !== null && group.title !== title) {
        group.title = title;
        await this.groupRepo.save(group);
      }
      return group;
    }
    try {
      group = this.groupRepo.create({
        botId,
        telegramChatId,
        title,
        ownerPlatformUserId,
      });
      await this.groupRepo.save(group);
      return group;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Duplicate entry')) {
        const existing = await this.groupRepo.findOne({
          where: { botId, telegramChatId },
        });
        if (existing) {
          if (title !== null && existing.title !== title) {
            existing.title = title;
            await this.groupRepo.save(existing);
          }
          return existing;
        }
      }
      throw err;
    }
  }
}
