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
   - `OLLAMA_BASE_URL` (default `http://localhost:11434`), `OLLAMA_MODEL` (e.g. `gemma3:4b`)
   - Optionally `TELEGRAM_MCP_PATH` – path to the telegram-mcp repo (app runs `uv --directory <path> run main.py`)
2. Optional: `TELEGRAM_TRIGGER_ON_MENTION=true` – only reply when the bot is @mentioned in groups.
3. Optional: `CHAT_HISTORY_LIMIT` – number of recent messages to pass to the model (default 40).
4. **Web tools (internet access for the model):** Set `ENABLE_WEB_TOOLS=true` and `OLLAMA_API_KEY` (free key at [ollama.com/settings/keys](https://ollama.com/settings/keys)) to enable `web_search` and `web_fetch` tools. Use a model that supports tool calling in Ollama, e.g. **qwen3:latest** or **qwen3:4b** (`ollama pull qwen3`). Gemma3 may not support tools and can return an error.
5. **RAG with semantic search (Advanced):** Set `ENABLE_RAG=true` to enable semantic search over chat history. This uses embeddings (`nomic-embed-text` via Ollama) and Qdrant vector database. Install Qdrant: `docker run -p 6333:6333 qdrant/qdrant`. Pull the embedding model: `ollama pull nomic-embed-text`. The bot will combine recent messages (temporal context) with semantically relevant chunks from history (vector search), allowing it to recall relevant conversations even if they're old.

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