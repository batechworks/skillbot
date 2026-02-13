import type { Channel } from "./channel.js";
import { dbg } from "./debug.js";

export interface TelegramOpts {
  token?: string;
  allowFrom?: number[]; // Telegram user IDs to accept (empty = accept all)
}

const API = "https://api.telegram.org/bot";

/**
 * Telegram Bot channel — zero dependencies, uses fetch + long polling.
 * Get a token from @BotFather on Telegram.
 */
export function createTelegramChannel(opts: TelegramOpts = {}): Channel {
  const token = opts.token || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is required.\n  Get one: open Telegram → @BotFather → /newbot");
    process.exit(1);
  }

  const allowFrom =
    opts.allowFrom ??
    process.env.TELEGRAM_ALLOW_FROM?.split(",").map((s) => Number(s.trim())).filter(Boolean) ??
    [];

  const base = `${API}${token}`;
  let offset = 0;
  let running = true;
  let replyChatId: number | null = null;

  /** Call Telegram Bot API. */
  async function api(method: string, body?: Record<string, unknown>): Promise<any> {
    const res = await fetch(`${base}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json()) as { ok: boolean; result?: any; description?: string };
    if (!data.ok) throw new Error(`Telegram ${method}: ${data.description}`);
    return data.result;
  }

  return {
    start(onMessage) {
      (async () => {
        const me = await api("getMe");
        console.log(`\n🤖 Telegram bot @${me.username} ready. Send it a message!`);
        if (allowFrom.length) console.log(`   Allowed users: ${allowFrom.join(", ")}`);
        else console.log("   ⚠️  No allowFrom filter — accepting messages from everyone.");
        console.log();

        // Long-polling loop
        while (running) {
          try {
            const updates = await api("getUpdates", { offset, timeout: 30 });
            for (const u of updates) {
              offset = u.update_id + 1;
              const msg = u.message;
              if (!msg?.text) continue;

              const chatId = msg.chat.id;
              const userId = msg.from?.id;
              if (allowFrom.length && userId && !allowFrom.includes(userId)) {
                dbg("tg:blocked", `user=${userId}`);
                continue;
              }

              replyChatId = chatId;
              dbg("tg:recv", `user=${userId} chat=${chatId} "${msg.text}"`);
              await onMessage(msg.text, `telegram:${chatId}`);
            }
          } catch (err) {
            if (!running) break;
            console.error("Telegram poll error:", err instanceof Error ? err.message : err);
            await new Promise((r) => setTimeout(r, 3000)); // retry after 3s
          }
        }
      })().catch((err) => {
        console.error(`Telegram init failed: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
      });
    },

    send(text) {
      if (!replyChatId) return;
      const chatId = replyChatId;
      // Telegram limit: 4096 chars per message
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += 4096) chunks.push(text.slice(i, i + 4096));

      (async () => {
        for (const chunk of chunks) {
          await api("sendMessage", { chat_id: chatId, text: chunk }).catch((e) =>
            console.error("tg send failed:", e instanceof Error ? e.message : e),
          );
        }
      })();
    },

    stop() {
      running = false;
    },
  };
}
