import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService, LoginDto, RegisterDto } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('link-telegram')
  @UseGuards(JwtAuthGuard)
  async linkTelegram(
    @CurrentUser() user: { id: number },
    @Body() body: { telegram_id: number },
  ) {
    await this.authService.linkTelegram(user.id, body.telegram_id);
    return { ok: true };
  }
}
