/// <reference types="@cloudflare/workers-types" />

type Msg = { role: "user" | "assistant"; content: string };

export class ChatSession {
  private state: DurableObjectState;

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/load" && req.method === "POST") {
      const messages = (await this.state.storage.get("messages")) as Msg[] | undefined;
      return json({ messages: messages ?? [] });
    }

    if (url.pathname === "/save" && req.method === "POST") {
      const { user, assistant, cap } = (await req.json()) as {
        user?: string;
        assistant?: string;
        cap?: number;
      };
      if (!user || !assistant) return json({ error: "invalid body" }, 400);

      const current = (await this.state.storage.get("messages")) as Msg[] | undefined;
      const next: Msg[] = [
        ...(current ?? []),
        { role: "user", content: user },
        { role: "assistant", content: assistant }
      ];

      const limit = Math.max(1, cap ?? 20) * 2;
      const trimmed = next.slice(-limit);
      await this.state.storage.put("messages", trimmed);

      return json({ ok: true, size: trimmed.length });
    }

    return new Response("Not Found", { status: 404 });
  }
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" }
  });
}
