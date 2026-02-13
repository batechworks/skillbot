/**
 * Discord channel — zero dependencies, uses Discord Gateway WebSocket + REST API.
 * Get a token from https://discord.com/developers/applications
 * Required bot permissions: Send Messages, Read Message History, Message Content Intent
 */
import type { Channel } from "./channel.js";
import { dbg } from "./debug.js";

export interface DiscordOpts {
  token?: string;
  allowFrom?: string[]; // Discord user IDs to accept (empty = accept all)
}

const API = "https://discord.com/api/v10";
const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";

export function createDiscordChannel(opts: DiscordOpts = {}): Channel {
  const token = opts.token || process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.error("DISCORD_BOT_TOKEN is required.\n  Get one: https://discord.com/developers/applications");
    process.exit(1);
  }

  const allowFrom =
    opts.allowFrom ??
    process.env.DISCORD_ALLOW_FROM?.split(",").map((s) => s.trim()).filter(Boolean) ??
    [];

  let ws: WebSocket | null = null;
  let replyChanId: string | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  let lastSequence: number | null = null;
  let running = true;

  async function apiCall(method: string, path: string, body?: Record<string, unknown>): Promise<any> {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord ${method} ${path}: ${res.status} ${text}`);
    }
    return res.json();
  }

  return {
    start(onMessage) {
      const connect = () => {
        ws = new WebSocket(GATEWAY_URL);

        ws.onopen = () => dbg("discord:ws", "connected");

        ws.onmessage = async (event) => {
          const data = JSON.parse(String(event.data));
          const { op, d, s, t } = data;
          if (s) lastSequence = s;

          // Op 10: Hello — start heartbeat
          if (op === 10) {
            const interval = d.heartbeat_interval;
            heartbeatInterval = setInterval(() => {
              ws?.send(JSON.stringify({ op: 1, d: lastSequence }));
            }, interval);

            // Identify
            ws?.send(JSON.stringify({
              op: 2,
              d: {
                token,
                intents: 33281, // GUILDS | GUILD_MESSAGES | MESSAGE_CONTENT | DIRECT_MESSAGES
                properties: { os: "linux", browser: "skillbots", device: "skillbots" },
              },
            }));
          }

          // Op 11: Heartbeat ACK
          if (op === 11) dbg("discord:heartbeat", "ack");

          // Dispatch events
          if (op === 0 && t === "READY") {
            const user = d.user;
            console.log(`\n🎮 Discord bot ${user.username}#${user.discriminator} ready!`);
            if (allowFrom.length) console.log(`   Allowed users: ${allowFrom.join(", ")}`);
            else console.log("   ⚠️  No allowFrom filter — accepting messages from everyone.");
            console.log();
          }

          if (op === 0 && t === "MESSAGE_CREATE") {
            // Ignore own messages
            if (d.author?.bot) return;

            const userId = d.author?.id;
            const channelId = d.channel_id;
            const content = d.content?.trim();
            if (!content) return;

            if (allowFrom.length && userId && !allowFrom.includes(userId)) {
              dbg("discord:blocked", `user=${userId}`);
              return;
            }

            replyChanId = channelId;
            dbg("discord:recv", `user=${userId} ch=${channelId} "${content}"`);
            await onMessage(content, `discord:${channelId}:${userId}`);
          }
        };

        ws.onclose = (event) => {
          dbg("discord:ws", `closed: ${event.code}`);
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          if (running) {
            console.error("Discord WebSocket closed, reconnecting in 5s...");
            setTimeout(connect, 5000);
          }
        };

        ws.onerror = (err) => {
          console.error("Discord WebSocket error:", err);
        };
      };

      connect();
    },

    send(text) {
      if (!replyChanId) return;
      const channelId = replyChanId;
      // Discord limit: 2000 chars per message
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += 2000) chunks.push(text.slice(i, i + 2000));

      (async () => {
        for (const chunk of chunks) {
          await apiCall("POST", `/channels/${channelId}/messages`, { content: chunk }).catch((e) =>
            console.error("Discord send failed:", e instanceof Error ? e.message : e),
          );
        }
      })();
    },

    stop() {
      running = false;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      ws?.close();
      ws = null;
    },
  };
}
