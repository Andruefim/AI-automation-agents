import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ChatGroup } from './chat-group.entity';
import { TelegramUser } from './telegram-user.entity';

@Entity('chat_members')
@Unique(['telegramUserId', 'chatGroupId'])
export class ChatMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'telegram_user_id' })
  telegramUserId: number;

  @ManyToOne(() => TelegramUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'telegram_user_id' })
  telegramUser: TelegramUser;

  @Column({ name: 'chat_group_id' })
  chatGroupId: number;

  @ManyToOne(() => ChatGroup, (g) => g.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_group_id' })
  chatGroup: ChatGroup;

  @Column({ name: 'joined_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;
}
