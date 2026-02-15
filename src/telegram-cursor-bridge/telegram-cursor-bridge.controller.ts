import { Body, Controller, Post } from '@nestjs/common';
import { CursorAgentService } from './cursor-agent.service';

@Controller('telegram-cursor')
export class TelegramCursorBridgeController {
  constructor(private readonly cursorAgent: CursorAgentService) {}

  /**
   * Manually trigger a Cursor agent task to check Telegram Web and respond.
   * Optional body: { "messageContext": "From @user: hello", "chatInfo": "My Chat" }
   */
  @Post('trigger')
  async trigger(
    @Body() body?: { messageContext?: string; chatInfo?: string },
  ): Promise<{ ok: boolean; error?: string }> {
    const result = await this.cursorAgent.triggerTelegramReplyTask({
      messageContext:
        body?.messageContext ??
        'Check Telegram Web for new messages and reply if someone is addressing me.',
      chatInfo: body?.chatInfo,
    });
    return {
      ok: result.ok,
      error: result.error,
    };
  }
}
