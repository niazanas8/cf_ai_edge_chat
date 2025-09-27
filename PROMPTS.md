# PROMPTS

Prompts used during development:

1) **Project setup**
   - *Prompt:* Minimal Workers app with chat UI, Workers AI call, and Durable Object; include `wrangler.toml` bindings.
   - *Used:* Created `public/index.html`, `src/index.ts`, `src/memory.ts`, and DO binding in `wrangler.toml`.

2) **Durable Object memory**
   - *Prompt:* DO with `POST /load` → `{ messages }` and `POST /save` (body `{ user, assistant, cap }`) trimming to last N turns.
   - *Used:* Implemented `load/save` in `src/memory.ts` with SQLite storage (Free plan).

3) **Worker route + AI call**
   - *Prompt:* `POST /api/chat` loads prior turns from DO, builds short history, calls Workers AI (`@cf/meta/llama-3.1-8b-instruct`) via `messages`, saves turn, returns `{ reply }`.
   - *Used:* Implemented in `src/index.ts` with cookie `sid` + `idFromName(sid)`.

4) **Types & toolchain**
   - *Prompt:* Fix VS Code types for Workers (`DurableObjectState`, `DurableObjectNamespace`).
   - *Used:* Installed `@cloudflare/workers-types`, added the `/// <reference types="..." />` line, and a minimal `tsconfig.json`.

5) **Wrangler + migrations (Free plan)**
   - *Prompt:* Correct migrations format; Free plan requires SQLite DOs.
   - *Used:* In `wrangler.toml`:
     ```toml
     [[migrations]]
     tag = "v1"
     new_sqlite_classes = ["ChatSession"]
     ```

6) **UI polish**
   - *Prompt:* Plain HTML chat that POSTs to `/api/chat`, disables input while waiting, shows “typing…”.
   - *Used:* Vanilla JS in `public/index.html`.

7) **Debugging**
   - *Prompt:* Remote dev sometimes shows an internal error—how to verify?
   - *Used:* Test on deployed workers.dev URL and tail logs:
     ```bash
     npx wrangler tail cf_ai_edge_chat --format=pretty
     ```
