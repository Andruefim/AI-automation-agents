import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PlatformUser } from '../platform/entities/platform-user.entity';
import { TelegramUser } from '../platform/entities/telegram-user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
}

export interface RegisterDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(PlatformUser)
    private readonly userRepo: Repository<PlatformUser>,
    @InjectRepository(TelegramUser)
    private readonly telegramUserRepo: Repository<TelegramUser>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ access_token: string; user: { id: number; email: string } }> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new UnauthorizedException('Email already registered');
    }
    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash: hash,
    });
    await this.userRepo.save(user);
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email },
    };
  }

  async login(dto: LoginDto): Promise<{ access_token: string; user: { id: number; email: string } }> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email },
    };
  }

  async linkTelegram(platformUserId: number, telegramId: number): Promise<void> {
    const telegramIdStr = String(telegramId);
    let tu = await this.telegramUserRepo.findOne({
      where: { telegramUserId: telegramIdStr },
    });
    if (tu) {
      tu.platformUserId = platformUserId;
      await this.telegramUserRepo.save(tu);
    } else {
      tu = this.telegramUserRepo.create({
        telegramUserId: telegramIdStr,
        platformUserId,
        hasPrivateChat: false,
      });
      await this.telegramUserRepo.save(tu);
    }
  }
}
