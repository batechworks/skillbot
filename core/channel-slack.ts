/**
 * Slack channel — uses Slack Web API + Socket Mode (zero dependencies).
 * Requires: SLACK_BOT_TOKEN (xoxb-...) and SLACK_APP_TOKEN (xapp-...) for Socket Mode.
 * Set up at: https://api.slack.com/apps
 */
import type { Channel } from "./channel.js";
import { dbg } from "./debug.js";

export interface SlackOpts {
  botToken?: string;
  appToken?: string;
  allowFrom?: string[]; // Slack user IDs to accept
}

const WEB_API = "https://slack.com/api";

export function createSlackChannel(opts: SlackOpts = {}): Channel {
  const botToken = opts.botToken || process.env.SLACK_BOT_TOKEN;
  const appToken = opts.appToken || process.env.SLACK_APP_TOKEN;

  if (!botToken || !appToken) {
    console.error(
      "SLACK_BOT_TOKEN and SLACK_APP_TOKEN are required.\n" +
      "  1. Create app at https://api.slack.com/apps\n" +
      "  2. Enable Socket Mode → get xapp- token\n" +
      "  3. Install to workspace → get xoxb- token",
    );
    process.exit(1);
  }

  const allowFrom =
    opts.allowFrom ??
    process.env.SLACK_ALLOW_FROM?.split(",").map((s) => s.trim()).filter(Boolean) ??
    [];

  let ws: WebSocket | null = null;
  let replyChannel: string | null = null;
  let running = true;

  async function slackAPI(method: string, body?: Record<string, unknown>): Promise<any> {
    const res = await fetch(`${WEB_API}/${method}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${botToken}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json() as { ok: boolean; error?: string; [key: string]: unknown };
    if (!data.ok) throw new Error(`Slack ${method}: ${data.error}`);
    return data;
  }

  return {
    start(onMessage) {
      (async () => {
        // Get WebSocket URL via apps.connections.open
        const connRes = await fetch(`${WEB_API}/apps.connections.open`, {
          method: "POST",
          headers: { Authorization: `Bearer ${appToken}`, "Content-Type": "application/x-www-form-urlencoded" },
        });
        const connData = await connRes.json() as { ok: boolean; url?: string; error?: string };
        if (!connData.ok || !connData.url) {
          throw new Error(`Slack Socket Mode failed: ${connData.error}`);
        }

        const authRes = await slackAPI("auth.test");
        console.log(`\n💬 Slack bot @${authRes.user} ready (team: ${authRes.team})!`);
        if (allowFrom.length) console.log(`   Allowed users: ${allowFrom.join(", ")}`);
        else console.log("   ⚠️  No allowFrom filter — accepting messages from everyone.");
        console.log();

        const connect = (url: string) => {
          ws = new WebSocket(url);

          ws.onmessage = async (event) => {
            const data = JSON.parse(String(event.data));

            // Acknowledge envelope
            if (data.envelope_id) {
              ws?.send(JSON.stringify({ envelope_id: data.envelope_id }));
            }

            if (data.type === "events_api") {
              const evt = data.payload?.event;
              if (!evt || evt.type !== "message" || evt.subtype || evt.bot_id) return;

              const userId = evt.user;
              const channelId = evt.channel;
              const text = (evt.text || "").trim();
              if (!text) return;

              if (allowFrom.length && userId && !allowFrom.includes(userId)) {
                dbg("slack:blocked", `user=${userId}`);
                return;
              }

              replyChannel = channelId;
              dbg("slack:recv", `user=${userId} ch=${channelId} "${text}"`);
              await onMessage(text, `slack:${channelId}:${userId}`);
            }

            // Handle disconnect
            if (data.type === "disconnect") {
              dbg("slack:disconnect", data.reason);
              if (running) {
                // Reconnect: get a new URL
                const retry = await fetch(`${WEB_API}/apps.connections.open`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${appToken}`, "Content-Type": "application/x-www-form-urlencoded" },
                });
                const retryData = await retry.json() as { ok: boolean; url?: string };
                if (retryData.ok && retryData.url) connect(retryData.url);
              }
            }
          };

          ws.onclose = () => {
            dbg("slack:ws", "closed");
            if (running) setTimeout(async () => {
              try {
                const retry = await fetch(`${WEB_API}/apps.connections.open`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${appToken}`, "Content-Type": "application/x-www-form-urlencoded" },
                });
                const retryData = await retry.json() as { ok: boolean; url?: string };
                if (retryData.ok && retryData.url) connect(retryData.url);
              } catch (e) {
                console.error("Slack reconnect failed:", e instanceof Error ? e.message : e);
              }
            }, 5000);
          };

          ws.onerror = (err) => console.error("Slack WebSocket error:", err);
        };

        connect(connData.url);
      })().catch((err) => {
        console.error(`Slack init failed: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
      });
    },

    send(text) {
      if (!replyChannel) return;
      const channel = replyChannel;

      (async () => {
        // Split long messages (Slack limit: 40,000 chars but 4,000 recommended)
        const chunks: string[] = [];
        for (let i = 0; i < text.length; i += 4000) chunks.push(text.slice(i, i + 4000));

        for (const chunk of chunks) {
          await slackAPI("chat.postMessage", { channel, text: chunk }).catch((e) =>
            console.error("Slack send failed:", e instanceof Error ? e.message : e),
          );
        }
      })();
    },

    stop() {
      running = false;
      ws?.close();
      ws = null;
    },
  };
}
