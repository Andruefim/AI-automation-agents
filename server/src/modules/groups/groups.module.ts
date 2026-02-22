import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGroup } from '../platform/entities/chat-group.entity';
import { PlatformBot } from '../platform/entities/platform-bot.entity';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatGroup, PlatformBot]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
