import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { PlatformBot } from './platform-bot.entity';
import { PlatformUser } from './platform-user.entity';
import { ChatMember } from './chat-member.entity';

@Entity('chat_groups')
@Index(['botId', 'telegramChatId'], { unique: true })
export class ChatGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'bot_id' })
  botId: number;

  @ManyToOne(() => PlatformBot, (b) => b.chatGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bot_id' })
  bot: PlatformBot;

  @Column({ type: 'bigint', name: 'telegram_chat_id', nullable: true })
  telegramChatId: string | null;

  @Column({ name: 'owner_platform_user_id' })
  ownerPlatformUserId: number;

  @ManyToOne(() => PlatformUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_platform_user_id' })
  ownerPlatformUser: PlatformUser;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'json', name: 'settings_json', nullable: true })
  settingsJson: Record<string, unknown> | null;

  @OneToMany(() => ChatMember, (m) => m.chatGroup)
  members: ChatMember[];
}
