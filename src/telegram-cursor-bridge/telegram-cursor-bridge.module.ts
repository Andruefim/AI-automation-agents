import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramCursorBridgeController } from './telegram-cursor-bridge.controller';
import { TelegramMcpService } from './telegram-mcp.service';
import { LocalLlmService } from './local-llm.service';
import { ReplyWithContextService } from './reply-with-context.service';

@Module({
  controllers: [TelegramCursorBridgeController],
  providers: [
    TelegramMcpService,
    LocalLlmService,
    ReplyWithContextService,
    TelegramBotService,
  ],
})
export class TelegramCursorBridgeModule {}
