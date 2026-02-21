import { Body, Controller, Post } from '@nestjs/common';
import { ReplyWithContextService } from '../context/reply-with-context.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly replyWithContext: ReplyWithContextService) {}

  /**
   * Manually get a reply from the local LLM (with optional chat history).
   * Body: { "messageContext": "user message", "chatId"?: number, "username"?: string }
   */
  @Post('trigger')
  async trigger(
    @Body()
    body?: {
      messageContext?: string;
      chatId?: number;
      username?: string;
    },
  ): Promise<{ reply: string | null }> {
    const messageContext =
      body?.messageContext ??
      'Check Telegram for new messages and reply appropriately.';
    const chatId = body?.chatId ?? 0;
    const reply = await this.replyWithContext.getReplyForMessage(
      chatId,
      messageContext,
      body?.username,
    );
    return { reply };
  }
}
