import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { randomUUID } from 'crypto';

export interface TriggerTaskOptions {
  /** Short context: who wrote and what (for the agent prompt). */
  messageContext: string;
  /** Optional: chat/channel name or id for the agent to find the conversation. */
  chatInfo?: string;
}

const CURSOR_BASE_URL = 'https://cursor.com';
const CREATE_ENDPOINT = '/api/auth/startBackgroundComposerFromSnapshot';

/**
 * Triggers a Cursor Background Agent via Cursor's API.
 * Uses the same payload shape as cursor-background-agent-api.
 * Requires CURSOR_SESSION_TOKEN (or CURSOR_TOKEN) in the environment.
 */
@Injectable()
export class CursorAgentService {
  private readonly hasToken: boolean;

  constructor() {
    this.hasToken = Boolean(
      process.env.CURSOR_SESSION_TOKEN ?? process.env.CURSOR_TOKEN,
    );
  }

  /**
   * Create a background composer task that instructs the agent to
   * open Telegram Web and respond to the given message context.
   */
  async triggerTelegramReplyTask(options: TriggerTaskOptions): Promise<{
    ok: boolean;
    composerId?: string;
    error?: string;
  }> {
    if (!this.hasToken) {
      return {
        ok: false,
        error:
          'Missing CURSOR_SESSION_TOKEN (or CURSOR_TOKEN). Set it in .env or environment.',
      };
    }

    const taskDescription = this.buildTaskDescription(options);
    const repositoryUrl =
      process.env.CURSOR_REPOSITORY_URL ??
      'https://github.com/mjdierkes/cursor-background-agent-api.git';
    const branch = 'main';
    const model = 'claude-4-sonnet-thinking';

    const payload = this.buildComposerPayload({
      taskDescription,
      repositoryUrl,
      branch,
      model,
    });

    const token =
      process.env.CURSOR_SESSION_TOKEN ?? process.env.CURSOR_TOKEN;

    try {
      const { data } = await axios.post(
        CURSOR_BASE_URL + CREATE_ENDPOINT,
        payload,
        {
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/json',
            Cookie: `NEXT_LOCALE=en; WorkosCursorSessionToken=${token}`,
            Origin: CURSOR_BASE_URL,
            Referer: 'https://cursor.com/agents',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
          },
          timeout: 30000,
        },
      );

      const composerId = data?.composer?.bcId;
      return {
        ok: true,
        composerId,
      };
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message =
        axiosError.response?.data?.message ??
        axiosError.message ??
        'Unknown error';
      const status = axiosError.response?.status;
      return {
        ok: false,
        error: status ? `[${status}] ${message}` : message,
      };
    }
  }

  private buildTaskDescription(options: TriggerTaskOptions): string {
    const parts = [
      'A new Telegram message requires your response.',
      '',
      'Message context:',
      options.messageContext,
    ];
    if (options.chatInfo) {
      parts.push('', 'Chat/conversation: ' + options.chatInfo);
    }
    parts.push(
      '',
      'Instructions: Open Telegram Web in the browser (e.g. web.telegram.org) using the browser MCP tools. Take a snapshot, locate this conversation, and reply appropriately. Send the reply in the Telegram Web UI.',
    );
    return parts.join('\n');
  }

  private buildComposerPayload(options: {
    taskDescription: string;
    repositoryUrl: string;
    branch: string;
    model: string;
  }): Record<string, unknown> {
    const bcId = `bc-${randomUUID()}`;
    const cleanUrl = options.repositoryUrl
      .replace(/^https?:\/\//, '')
      .replace(/\.git$/, '');
    const devcontainerUrl = options.repositoryUrl.replace(/\.git$/, '');

    return {
      snapshotNameOrId: cleanUrl,
      devcontainerStartingPoint: {
        url: devcontainerUrl,
        ref: options.branch,
      },
      modelDetails: {
        modelName: options.model,
        maxMode: true,
      },
      repositoryInfo: {},
      snapshotWorkspaceRootPath: '/workspace',
      autoBranch: true,
      returnImmediately: true,
      repoUrl: cleanUrl,
      conversationHistory: [
        {
          text: options.taskDescription,
          type: 'MESSAGE_TYPE_HUMAN',
          richText: JSON.stringify({
            root: {
              children: [
                {
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: options.taskDescription,
                      type: 'text',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'paragraph',
                  version: 1,
                  textFormat: 0,
                  textStyle: '',
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          }),
        },
      ],
      source: 'BACKGROUND_COMPOSER_SOURCE_WEBSITE',
      bcId,
      addInitialMessageToResponses: true,
    };
  }

  isConfigured(): boolean {
    return this.hasToken;
  }
}
