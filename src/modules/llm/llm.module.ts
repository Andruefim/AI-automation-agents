import { Module } from '@nestjs/common';
import { LocalLlmService } from './local-llm.service';
import { OllamaWebSearchService } from './ollama-web-search.service';

@Module({
  providers: [LocalLlmService, OllamaWebSearchService],
  exports: [LocalLlmService],
})
export class LlmModule {}
