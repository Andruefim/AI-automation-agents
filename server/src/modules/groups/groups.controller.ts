import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

function parseId(id: string): number {
  const n = parseInt(id, 10);
  if (Number.isNaN(n)) throw new BadRequestException('Invalid id');
  return n;
}

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async list(@CurrentUser() user: { id: number }) {
    return this.groupsService.listForUser(user.id);
  }

  @Get(':id')
  async getOne(
    @CurrentUser() user: { id: number },
    @Param('id') id: string,
  ) {
    return this.groupsService.getOne(parseId(id), user.id);
  }

  @Post(':id/settings')
  async updateSettings(
    @CurrentUser() user: { id: number },
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.groupsService.updateSettings(parseId(id), user.id, body);
  }
}
