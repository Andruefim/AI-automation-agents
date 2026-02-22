import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PlatformModule } from '../platform/platform.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformUser } from '../platform/entities/platform-user.entity';
import { TelegramUser } from '../platform/entities/telegram-user.entity';

@Module({
  imports: [
    PlatformModule,
    TypeOrmModule.forFeature([PlatformUser, TelegramUser]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-me-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
