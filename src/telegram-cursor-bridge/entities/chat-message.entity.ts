import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('chat_message')
@Index(['chat_id', 'created_at'])
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64 })
  chat_id: string;

  @Column({ type: 'varchar', length: 16 })
  role: 'user' | 'assistant';

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sender_username: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
