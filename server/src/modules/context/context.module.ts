import { Module } from '@nestjs/common';
import { ReplyWithContextService } from './reply-with-context.service';
import { LlmModule } from '../llm/llm.module';
import { ChatModule } from '../chat/chat.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';

@Module({
  imports: [LlmModule, ChatModule, VectorStoreModule],
  providers: [ReplyWithContextService],
  exports: [ReplyWithContextService],
})
export class ContextModule {}
