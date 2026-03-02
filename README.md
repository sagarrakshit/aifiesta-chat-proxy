# aifiesta-chat-proxy

OpenAI-compatible proxy for AI Fiesta chat completions.

This server accepts OpenAI-style chat requests and forwards them to AI Fiesta's
`/api/chats/v3/completions` endpoint.

Built with Node.js + Express (JavaScript).

## Features

- OpenAI-compatible endpoints:
  - `POST /v1/chat/completions`
- AI Fiesta stream parsing (`chat:stream`, `chat:done`, `chat:finish`)
- Supports both:
  - New chats (no `chatId`)
  - Continuation chats (send existing `chatId`)
- Returns resolved chat id in:
  - Response JSON field: `chatId`
  - Response header: `x-chat-id`

## Project Structure

- `proxy.js` - minimal entry point
- `src/server.js` - server bootstrap
- `src/app.js` - Express app setup
- `src/routes.js` - route registration
- `src/handlers/proxyHandler.js` - request handling and upstream calls
- `src/parsers/streamParser.js` - AI Fiesta stream/event parsing
- `src/responses/openai.js` - OpenAI-style response builders
- `src/config.js` - env and runtime config
- `src/utils/*` - helper utilities

## Tech Stack

- Node.js
- Express
- JavaScript

## Requirements

- Node.js 18+
- Valid AI Fiesta bearer token

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure `.env` with your own token:

```env
AIFIESTA_TOKEN=your_token_here
AIFIESTA_API_URL=https://api.aifiesta.ai
PORT=3000
```

3. Start server:

```bash
npm start
```

For development:

```bash
npm run dev
```

## Endpoints

- `POST /v1/chat/completions`
- `GET /health`
- `GET /debug`

## Usage

### 1) New chat

Do not send `chatId`.

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4",
    "messages": [
      {"role": "user", "content": "Give me a 4-week plan to learn Kafka with Node.js microservices."}
    ]
  }'
```

### 2) Continuation chat

Use the `chatId` returned from step 1.

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "f7340132-bcc5-48a3-aa02-178219d77a19",
    "model": "claude-sonnet-4",
    "messages": [
      {"role": "user", "content": "Great. Now show a sample project structure and first milestone."}
    ]
  }'
```

## Chat ID Input Options

The proxy accepts continuation chat id from any one of:

- `body.chatId`
- `body.metadata.chatId`
- header `x-chat-id`
- query param `chatId`

## Response Notes

- Response is OpenAI-style JSON (`choices[0].message.content`, etc.).
- `chatId` is included when available.
- `x-chat-id` response header is set when available.

## Security

- Use your own `AIFIESTA_TOKEN` in `.env`.
- Rotate token immediately if exposed.
