import { Body, Controller, Post } from '@nestjs/common';
import { ReplyWithContextService } from './reply-with-context.service';

@Controller('telegram-cursor')
export class TelegramCursorBridgeController {
  constructor(private readonly replyWithContext: ReplyWithContextService) {}

  /**
   * Manually get a reply from the local LLM (with optional chat history via MCP).
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
  ): Promise<{ reply: string }> {
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
