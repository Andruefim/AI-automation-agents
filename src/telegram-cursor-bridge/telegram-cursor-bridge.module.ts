import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramCursorBridgeController } from './telegram-cursor-bridge.controller';
import { LocalLlmService } from './local-llm.service';
import { ReplyWithContextService } from './reply-with-context.service';
import { ChatHistoryService } from './chat-history.service';
import { OllamaWebSearchService } from './ollama-web-search.service';
import { ChatMessage } from './entities/chat-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage])],
  controllers: [TelegramCursorBridgeController],
  providers: [
    LocalLlmService,
    ChatHistoryService,
    ReplyWithContextService,
    TelegramBotService,
    OllamaWebSearchService,
  ],
})
export class TelegramCursorBridgeModule {}
