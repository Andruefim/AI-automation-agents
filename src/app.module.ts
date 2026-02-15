import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramCursorBridgeModule } from './telegram-cursor-bridge/telegram-cursor-bridge.module';

@Module({
  imports: [TelegramCursorBridgeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
