<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

---

## Telegram + Local LLM bridge (with optional Telegram MCP)

This project runs a **Telegram bot** that replies using a **local LLM** (Ollama). Optionally it uses a **Telegram MCP server** to fetch full chat history so the model has context of the conversation, not just the last message.

### Flow

1. **Telegram bot** receives a message (DM or in a group).
2. The app optionally fetches **chat history** via a Telegram MCP server (e.g. [chigwell/telegram-mcp](https://github.com/chigwell/telegram-mcp)).
3. The app sends **history + new message** to **Ollama** (or compatible API).
4. The bot sends the model’s **reply** back to Telegram.

### Prerequisites

- **Telegram bot**: Create a bot with [@BotFather](https://t.me/BotFather), get `TELEGRAM_BOT_TOKEN`.
- **Ollama**: Install [Ollama](https://ollama.com/) and run a model (e.g. `ollama run llama3.2`). The app calls `OLLAMA_BASE_URL` (default `http://localhost:11434`) and `OLLAMA_MODEL`.
- **Telegram MCP (optional)**: For chat history context, install and configure a Telegram MCP server that uses a **user** Telegram account (e.g. [chigwell/telegram-mcp](https://github.com/chigwell/telegram-mcp)): clone repo, run `uv sync`, generate session string (e.g. `uv run session_string_generator.py`), set `.env` with `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `TELEGRAM_SESSION_STRING`. The NestJS app **spawns** this MCP server as a subprocess (via `TELEGRAM_MCP_PATH` or `TELEGRAM_MCP_COMMAND` + `TELEGRAM_MCP_ARGS`); you do not need to run it manually. The user account must be in the same chats as the bot so `get_history(chat_id)` returns the right messages.

### Setup

1. Copy `.env.example` to `.env` and set:
   - `TELEGRAM_BOT_TOKEN` – from @BotFather
   - `OLLAMA_BASE_URL` (default `http://localhost:11434`), `OLLAMA_MODEL` (e.g. `llama3.2`)
   - Optionally `TELEGRAM_MCP_PATH` – path to the telegram-mcp repo (app runs `uv --directory <path> run main.py`)
2. Optional: `TELEGRAM_TRIGGER_ON_MENTION=true` – only reply when the bot is @mentioned in groups.
3. Optional: `CHAT_HISTORY_LIMIT` – number of recent messages to pass to the model (default 40).

### Run

```bash
npm install
npm run start:dev
```

- The Telegram bot starts with the app. When someone messages the bot (or mentions it), the app gets a reply from the local model and sends it back.
- **Manual trigger**: `POST http://localhost:3000/telegram-cursor/trigger` with body:  
  `{ "messageContext": "user message", "chatId"?: number, "username"?: string }`  
  Returns `{ "reply": "..." }`.

---

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
