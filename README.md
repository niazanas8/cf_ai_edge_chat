---
Small chat app for Cloudflare’s optional AI assignment.
---
- **LLM:** Workers AI `@cf/meta/llama-3.1-8b-instruct`
- **Coordination:** Cloudflare Worker (routes: `/api/chat`, `/health`)
- **User input:** Minimal web chat UI (served by the Worker)
- **Memory/state:** Durable Object (SQLite) storing the last N turns per session

---

## Demo (deployed)
**https://cf-ai-edge-chat.niaznas8.workers.dev**

---

## Run (deployment only)

npm install
npm run deploy

## How it works
### API routes
- **POST `/api/chat`**  
  Loads prior turns from the Durable Object, builds a short history, calls Workers AI, saves the new turn, and returns `{ reply }`.

- **GET `/health`**  
  Simple health check (`ok`).

### Durable Object (internal RPC from the Worker)
- **POST `do:/load`** → returns:
  ```json
  { "messages": [ { "role": "user" | "assistant", "content": "..." } ] }

## Files

public/index.html # chat UI
src/index.ts # Worker (routes + AI call + session cookie)
src/memory.ts # Durable Object (chat memory, SQLite)
wrangler.toml # bindings + SQLite DO migration
PROMPTS.md # prompts used while building (required by assignment)

## Assignment checklist

- [x] LLM (Workers AI)
- [x] Workflow/coordination (Worker)
- [x] User input (chat UI)
- [x] Memory/state (Durable Object)
- [x] Repo prefix `cf_ai_`
- [x] README with deploy instructions + deployed link
- [x] PROMPTS.md
