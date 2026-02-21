
## Telegram + Local LLM bridge

This project runs a **Telegram bot** that replies using a **local LLM** (Ollama). It keeps **long-term memory** of conversations via **RAG** (retrieval-augmented generation): chat history is stored in a database, embedded with a local embedding model, and indexed in a vector store (Qdrant). The model receives both recent messages and semantically relevant past context, so it can recall and use older parts of the conversation.

### Flow

1. **Telegram bot** receives a message (DM or in a group).
2. The app loads **chat history** from its own store (recent messages + **RAG**: semantic search over past conversation chunks).
3. The app sends **history + new message** to **Ollama** (or compatible API).
4. The bot sends the model’s **reply** back to Telegram.

### Prerequisites

- **Telegram bot**: Create a bot with [@BotFather](https://t.me/BotFather), get `TELEGRAM_BOT_TOKEN`.
- **Ollama**: Install [Ollama](https://ollama.com/) and run a model (e.g. `ollama run llama3.2`). The app calls `OLLAMA_BASE_URL` (default `http://localhost:11434`) and `OLLAMA_MODEL`.

### Setup

1. Copy `.env.example` to `.env` and set:
   - `TELEGRAM_BOT_TOKEN` – from @BotFather
   - `OLLAMA_BASE_URL` (default `http://localhost:11434`), `OLLAMA_MODEL` (e.g. `gemma3:4b`)
2. Optional: `TELEGRAM_TRIGGER_ON_MENTION=true` – only reply when the bot is @mentioned in groups.
3. Optional: `CHAT_HISTORY_LIMIT` – number of recent messages to pass to the model (default 40).
4. **Web tools (internet access for the model):** Set `ENABLE_WEB_TOOLS=true` and `OLLAMA_API_KEY` (free key at [ollama.com/settings/keys](https://ollama.com/settings/keys)) to enable `web_search` and `web_fetch` tools. Use a model that supports tool calling in Ollama, e.g. **qwen3:latest** or **qwen3:4b** (`ollama pull qwen3`). Gemma3 may not support tools and can return an error.
5. **RAG long-term memory (recommended):** Set `ENABLE_RAG=true` to enable semantic search over chat history. The bot stores conversations in the DB, chunks them, and indexes them in **Qdrant** using embeddings from Ollama (`nomic-embed-text`). It then combines **recent messages** with **semantically relevant past chunks**, so the model can recall and use older parts of the conversation. Install Qdrant: `docker run -p 6333:6333 qdrant/qdrant`. Pull the embedding model: `ollama pull nomic-embed-text`.

### Run

```bash
npm install
npm run start:dev
```

- The Telegram bot starts with the app. When someone messages the bot (or mentions it), the app gets a reply from the local model and sends it back.
- **Manual trigger**: `POST http://localhost:3000/telegram/trigger` with body:  
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