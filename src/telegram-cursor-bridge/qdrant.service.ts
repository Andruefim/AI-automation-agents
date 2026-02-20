import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/qdrant-js';
import { randomUUID } from 'crypto';

const DEFAULT_QDRANT_URL = 'http://localhost:6333';
const DEFAULT_COLLECTION_NAME = 'chat_chunks';
const DEFAULT_VECTOR_SIZE = 768; // nomic-embed-text default dimension

export interface ChunkMetadata {
  chat_id: string;
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
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private readonly client: QdrantClient;
  private readonly collectionName: string;
  private readonly vectorSize: number;

  constructor() {
    const qdrantUrl = process.env.QDRANT_URL || DEFAULT_QDRANT_URL;
    this.collectionName =
      process.env.QDRANT_COLLECTION_NAME || DEFAULT_COLLECTION_NAME;
    this.vectorSize = parseInt(
      process.env.QDRANT_VECTOR_SIZE || String(DEFAULT_VECTOR_SIZE),
      10,
    );

    this.client = new QdrantClient({ url: qdrantUrl });
    this.logger.log(`Qdrant client initialized: ${qdrantUrl}`);
  }

  async onModuleInit(): Promise<void> {
    await this.ensureCollection();
  }

  /**
   * Creates the collection if it doesn't exist.
   */
  private async ensureCollection(): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName,
      );

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine',
          },
        });
        this.logger.log(`Created Qdrant collection: ${this.collectionName}`);
      } else {
        this.logger.debug(`Qdrant collection exists: ${this.collectionName}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to ensure Qdrant collection: ${msg}`);
      throw err;
    }
  }

  /**
   * Stores a chunk with its embedding vector in Qdrant.
   */
  async storeChunk(
    chatId: string,
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

    // Generate point ID: use UUID for better compatibility
    const pointId = randomUUID();

    try {
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: [
          {
            id: pointId,
            vector,
            payload: {
              chat_id: chatId,
              message_ids: messageIds,
              chunk_text: chunkText,
              created_at: metadata.createdAt.toISOString(),
              usernames: metadata.usernames,
            },
          },
        ],
      });
      this.logger.debug(
        `Stored chunk in Qdrant: ${chatId}, ${messageIds.length} messages, ID: ${pointId}`,
      );
    } catch (err) {
      // Enhanced error logging to see Qdrant's response details
      let errorMsg = err instanceof Error ? err.message : String(err);
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as any).response;
        if (response?.data) {
          errorMsg += ` | Response: ${JSON.stringify(response.data)}`;
        }
        if (response?.status) {
          errorMsg += ` | Status: ${response.status}`;
        }
      }
      this.logger.error(`Failed to store chunk in Qdrant: ${errorMsg}`);
      this.logger.debug(`Payload: ${JSON.stringify({ chat_id: chatId, message_ids: messageIds, chunk_text_length: chunkText.length })}`);
      throw new Error(`Qdrant upsert failed: ${errorMsg}`);
    }
  }

  /**
   * Searches for similar chunks by embedding vector.
   * Returns chunks sorted by relevance (score descending).
   */
  async searchSimilar(
    chatId: string,
    queryVector: number[],
    limit: number = 15,
  ): Promise<Chunk[]> {
    if (queryVector.length !== this.vectorSize) {
      throw new Error(
        `Query vector size mismatch: expected ${this.vectorSize}, got ${queryVector.length}`,
      );
    }

    try {
      const results = await this.client.search(this.collectionName, {
        vector: queryVector,
        filter: {
          must: [
            {
              key: 'chat_id',
              match: { value: chatId },
            },
          ],
        },
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
      // Enhanced error logging
      let errorMsg = err instanceof Error ? err.message : String(err);
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as any).response;
        if (response?.data) {
          errorMsg += ` | Response: ${JSON.stringify(response.data)}`;
        }
        if (response?.status) {
          errorMsg += ` | Status: ${response.status}`;
        }
      }
      this.logger.error(`Qdrant search failed: ${errorMsg}`);
      throw new Error(`Qdrant search failed: ${errorMsg}`);
    }
  }

  /**
   * Deletes chunks for a specific chat (useful for cleanup).
   */
  async deleteChatChunks(chatId: string): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        filter: {
          must: [
            {
              key: 'chat_id',
              match: { value: chatId },
            },
          ],
        },
      });
      this.logger.log(`Deleted chunks for chat: ${chatId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to delete chat chunks: ${msg}`);
      throw err;
    }
  }
}
