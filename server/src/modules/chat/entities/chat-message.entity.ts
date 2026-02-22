import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChatGroup } from '../../platform/entities/chat-group.entity';

@Entity('chat_message')
@Index(['chatGroupId', 'created_at'])
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'chat_group_id' })
  chatGroupId: number;

  @ManyToOne(() => ChatGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_group_id' })
  chatGroup: ChatGroup;

  @Column({ type: 'varchar', length: 16 })
  role: 'user' | 'assistant';

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'sender_username' })
  senderUsername: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
