import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramController } from './telegram.controller';
import { ContextModule } from '../context/context.module';

@Module({
  imports: [ContextModule],
  controllers: [TelegramController],
  providers: [TelegramBotService],
})
export class TelegramModule {}
