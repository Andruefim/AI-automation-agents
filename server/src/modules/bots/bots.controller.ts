import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BotsService } from './bots.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('bots')
@UseGuards(JwtAuthGuard)
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Post()
  async create(
    @CurrentUser() user: { id: number },
    @Body() body: { token: string },
  ) {
    return this.botsService.createBot(body.token, user.id);
  }

  @Get()
  async list(@CurrentUser() user: { id: number }) {
    return this.botsService.getBotsForUser(user.id);
  }

  @Get(':id/status')
  async status(
    @CurrentUser() user: { id: number },
    @Param('id') id: string,
  ) {
    const botId = parseInt(id, 10);
    if (Number.isNaN(botId)) {
      return { connected: false, groups: [] };
    }
    return this.botsService.getBotStatus(botId, user.id);
  }
}
