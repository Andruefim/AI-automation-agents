import { Module } from '@nestjs/common';
import { CursorAgentService } from './cursor-agent.service';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramCursorBridgeController } from './telegram-cursor-bridge.controller';

@Module({
  controllers: [TelegramCursorBridgeController],
  providers: [CursorAgentService, TelegramBotService],
})
export class TelegramCursorBridgeModule {}
