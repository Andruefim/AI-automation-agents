import { api } from './client';

export interface CreateBotResponse {
  botId: number;
  botUsername: string;
}

export interface BotStatusResponse {
  connected: boolean;
  groups: Array<{ id: number; title: string | null; telegramChatId: string | null }>;
}

export function createBot(token: string): Promise<CreateBotResponse> {
  return api<CreateBotResponse>('/bots', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export function getBotStatus(botId: number): Promise<BotStatusResponse> {
  return api<BotStatusResponse>(`/bots/${botId}/status`);
}
