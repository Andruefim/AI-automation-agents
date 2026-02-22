import { api } from './client';

export interface ChatGroup {
  id: number;
  botId: number;
  telegramChatId: string | null;
  title: string | null;
  createdAt: string;
  settingsJson: Record<string, unknown> | null;
  bot?: { id: number; botUsername: string };
}

export function listGroups(): Promise<ChatGroup[]> {
  return api<ChatGroup[]>('/groups');
}

export function getGroup(id: number): Promise<ChatGroup> {
  return api<ChatGroup>(`/groups/${id}`);
}

export function updateGroupSettings(
  id: number,
  settings: Record<string, unknown>,
): Promise<ChatGroup> {
  return api<ChatGroup>(`/groups/${id}/settings`, {
    method: 'POST',
    body: JSON.stringify(settings),
  });
}
