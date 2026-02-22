import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformBot } from '../platform/entities/platform-bot.entity';
import { ChatGroup } from '../platform/entities/chat-group.entity';
import { BotsService } from './bots.service';
import { BotsController } from './bots.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformBot, ChatGroup]),
  ],
  controllers: [BotsController],
  providers: [BotsService],
  exports: [BotsService],
})
export class BotsModule {}
