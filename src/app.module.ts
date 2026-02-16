import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramCursorBridgeModule } from './telegram-cursor-bridge/telegram-cursor-bridge.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST ?? 'localhost',
      port: parseInt(process.env.MYSQL_PORT ?? '3306', 10),
      username: process.env.MYSQL_USER ?? 'root',
      password: process.env.MYSQL_PASSWORD ?? '',
      database: process.env.MYSQL_DATABASE ?? 'telegram_bot',
      autoLoadEntities: true,
      synchronize: true,
    }),
    TelegramCursorBridgeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
