import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformUser } from './entities/platform-user.entity';
import { PlatformBot } from './entities/platform-bot.entity';
import { ChatGroup } from './entities/chat-group.entity';
import { TelegramUser } from './entities/telegram-user.entity';
import { ChatMember } from './entities/chat-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlatformUser,
      PlatformBot,
      ChatGroup,
      TelegramUser,
      ChatMember,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class PlatformModule {}
