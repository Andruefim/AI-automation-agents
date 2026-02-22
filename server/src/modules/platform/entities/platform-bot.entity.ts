import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PlatformUser } from './platform-user.entity';
import { ChatGroup } from './chat-group.entity';

@Entity('platform_bots')
export class PlatformBot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'platform_user_id' })
  platformUserId: number;

  @ManyToOne(() => PlatformUser, (u) => u.bots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'platform_user_id' })
  platformUser: PlatformUser;

  @Column({ type: 'varchar', length: 512, name: 'telegram_bot_token' })
  telegramBotToken: string;

  @Column({ type: 'varchar', length: 128, name: 'bot_username' })
  botUsername: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ChatGroup, (g) => g.bot)
  chatGroups: ChatGroup[];
}
