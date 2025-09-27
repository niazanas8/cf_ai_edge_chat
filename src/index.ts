/// <reference types="@cloudflare/workers-types" />

export interface Env {
  AI: any;                               // Workers AI binding
  CHAT_SESSIONS: DurableObjectNamespace; // Durable Object namespace
}

const MODEL = "@cf/meta/llama-3.1-8b-instruct";
const MAX_TURNS = 20;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    if (req.method === "POST" && url.pathname === "/api/chat") {
      const { sid, setCookieHeader } = getOrCreateSessionId(req);

      let body: any = {};
      try { body = await req.json(); } catch {}
      const message = (body?.message ?? "").toString().trim();
      if (!message) return json({ error: "message is required" }, 400);

      // load memory
      const stub = env.CHAT_SESSIONS.get(env.CHAT_SESSIONS.idFromName(sid));
      const loadRes = await stub.fetch("https://do/load", { method: "POST" });
      const { messages } = (await loadRes.json()) as {
        messages: { role: "user" | "assistant"; content: string }[];
      };

      // build prompt
      const historyText = (messages || [])
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");
      const userPrompt = [historyText, `USER: ${message}`].filter(Boolean).join("\n");

      // call Workers AI
      let reply: string;
      try {
        const raw = (await env.AI.run(MODEL, {
          messages: [
            { role: "system", content: "You are a concise, friendly assistant." },
            { role: "user", content: userPrompt }
          ]
        })) as any;

        reply = typeof raw === "string" ? raw : (raw?.response ?? JSON.stringify(raw));
      } catch (err) {
        console.error("AI.run error:", err);
        return json({ error: "ai_failed" }, 500, setCookieHeader);
      }

      // save memory
      await stub.fetch("https://do/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user: message, assistant: reply, cap: MAX_TURNS })
      });

      return json({ reply }, 200, setCookieHeader);
    }

    return new Response("Not found", { status: 404 });
  }
};

function json(obj: unknown, status = 200, cookie?: string) {
  const headers = new Headers({ "content-type": "application/json" });
  if (cookie) headers.append("set-cookie", cookie);
  return new Response(JSON.stringify(obj), { status, headers });
}

function getOrCreateSessionId(req: Request): { sid: string; setCookieHeader?: string } {
  const cookie = req.headers.get("cookie") || "";
  const m = /(?:^|;)\s*sid=([^;]+)/.exec(cookie);
  if (m) return { sid: m[1] };
  const sid = crypto.randomUUID();
  const setCookieHeader = `sid=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
  return { sid, setCookieHeader };
}

// re-export for Durable Object binding
export { ChatSession } from "./memory";
