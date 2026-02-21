import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatHistoryService } from './chat-history.service';
import { VectorStoreModule } from '../vector-store/vector-store.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage]),
    VectorStoreModule,
  ],
  providers: [ChatHistoryService],
  exports: [ChatHistoryService],
})
export class ChatModule {}
