import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/qdrant-js';
import { randomUUID } from 'crypto';

const DEFAULT_QDRANT_URL = 'http://localhost:6333';
const DEFAULT_VECTOR_SIZE = 768; // nomic-embed-text default dimension

export const groupCollectionName = (chatGroupId: number) => `group_${chatGroupId}`;

export interface ChunkMetadata {
  message_ids: number[];
  chunk_text: string;
  created_at: string;
  usernames: string[];
}

export interface Chunk {
  messageIds: number[];
  chunkText: string;
  usernames: string[];
  createdAt: Date;
  score: number;
}

@Injectable()
export class QdrantService {
  private readonly logger = new Logger(QdrantService.name);
  private readonly client: QdrantClient;
  private readonly vectorSize: number;

  constructor() {
    const qdrantUrl = process.env.QDRANT_URL || DEFAULT_QDRANT_URL;
    this.vectorSize = parseInt(
      process.env.QDRANT_VECTOR_SIZE || String(DEFAULT_VECTOR_SIZE),
      10,
    );
    this.client = new QdrantClient({ url: qdrantUrl });
    this.logger.log(`Qdrant client initialized: ${qdrantUrl}`);
  }

  /**
   * Creates the collection if it doesn't exist (one collection per group).
   */
  async ensureCollection(collectionName: string): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some((c) => c.name === collectionName);
      if (!exists) {
        await this.client.createCollection(collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine',
          },
        });
        this.logger.log(`Created Qdrant collection: ${collectionName}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to ensure Qdrant collection ${collectionName}: ${msg}`);
      throw err;
    }
  }

  async storeChunk(
    collectionName: string,
    messageIds: number[],
    chunkText: string,
    vector: number[],
    metadata: { usernames: string[]; createdAt: Date },
  ): Promise<void> {
    if (vector.length !== this.vectorSize) {
      throw new Error(
        `Vector size mismatch: expected ${this.vectorSize}, got ${vector.length}`,
      );
    }
    await this.ensureCollection(collectionName);
    const pointId = randomUUID();
    try {
      await this.client.upsert(collectionName, {
        wait: true,
        points: [
          {
            id: pointId,
            vector,
            payload: {
              message_ids: messageIds,
              chunk_text: chunkText,
              created_at: metadata.createdAt.toISOString(),
              usernames: metadata.usernames,
            },
          },
        ],
      });
      this.logger.debug(`Stored chunk in ${collectionName}, ${messageIds.length} messages`);
    } catch (err) {
      let errorMsg = err instanceof Error ? err.message : String(err);
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as any).response;
        if (response?.data) errorMsg += ` | Response: ${JSON.stringify(response.data)}`;
        if (response?.status) errorMsg += ` | Status: ${response.status}`;
      }
      this.logger.error(`Qdrant upsert failed: ${errorMsg}`);
      throw new Error(`Qdrant upsert failed: ${errorMsg}`);
    }
  }

  async searchSimilar(
    collectionName: string,
    queryVector: number[],
    limit: number = 15,
  ): Promise<Chunk[]> {
    if (queryVector.length !== this.vectorSize) {
      throw new Error(
        `Query vector size mismatch: expected ${this.vectorSize}, got ${queryVector.length}`,
      );
    }
    try {
      const results = await this.client.search(collectionName, {
        vector: queryVector,
        limit,
        with_payload: true,
      });
      return results.map((r) => {
        const payload = r.payload as unknown as ChunkMetadata;
        return {
          messageIds: payload.message_ids,
          chunkText: payload.chunk_text,
          usernames: payload.usernames,
          createdAt: new Date(payload.created_at),
          score: r.score ?? 0,
        };
      });
    } catch (err) {
      let errorMsg = err instanceof Error ? err.message : String(err);
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as any).response;
        if (response?.data) errorMsg += ` | Response: ${JSON.stringify(response.data)}`;
        if (response?.status) errorMsg += ` | Status: ${response.status}`;
      }
      this.logger.error(`Qdrant search failed: ${errorMsg}`);
      throw new Error(`Qdrant search failed: ${errorMsg}`);
    }
  }

  async deleteChatChunks(collectionName: string): Promise<void> {
    try {
      await this.client.deleteCollection(collectionName);
      this.logger.log(`Deleted Qdrant collection: ${collectionName}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to delete collection ${collectionName}: ${msg}`);
      throw err;
    }
  }
}
