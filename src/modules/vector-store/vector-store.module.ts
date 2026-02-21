import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { QdrantService } from './qdrant.service';

@Module({
  providers: [EmbeddingService, QdrantService],
  exports: [EmbeddingService, QdrantService],
})
export class VectorStoreModule {}
