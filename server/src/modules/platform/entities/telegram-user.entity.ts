import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlatformUser } from './platform-user.entity';

@Entity('telegram_users')
export class TelegramUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', name: 'telegram_user_id', unique: true })
  telegramUserId: string;

  @Column({ name: 'platform_user_id', nullable: true })
  platformUserId: number | null;

  @ManyToOne(() => PlatformUser, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'platform_user_id' })
  platformUser: PlatformUser | null;

  @Column({ type: 'boolean', name: 'has_private_chat', default: false })
  hasPrivateChat: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
