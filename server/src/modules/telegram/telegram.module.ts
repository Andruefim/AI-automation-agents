import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramController } from './telegram.controller';
import { ContextModule } from '../context/context.module';
import { GroupsModule } from '../groups/groups.module';
import { PlatformBot } from '../platform/entities/platform-bot.entity';

@Module({
  imports: [
    ContextModule,
    GroupsModule,
    TypeOrmModule.forFeature([PlatformBot]),
  ],
  controllers: [TelegramController],
  providers: [TelegramBotService],
})
export class TelegramModule {}
