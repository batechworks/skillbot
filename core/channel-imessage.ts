import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import type { Channel } from "./channel.js";
import { dbg } from "./debug.js";

export interface IMessageOpts {
  cliPath?: string;
  dbPath?: string;
  allowFrom?: string[];
}

/**
 * iMessage channel — communicates via `imsg rpc` (JSON-RPC over stdio).
 * Install: `brew install steipete/tap/imsg`
 * Requires: macOS Messages signed in, Full Disk Access + Automation permissions.
 */
export function createIMessageChannel(opts: IMessageOpts = {}): Channel {
  const cliPath = opts.cliPath || process.env.IMSG_CLI_PATH || "imsg";
  const dbPath = opts.dbPath || process.env.IMSG_DB_PATH;
  const allowFrom =
    opts.allowFrom ??
    process.env.IMESSAGE_ALLOW_FROM?.split(",").map((s) => s.trim()).filter(Boolean) ??
    [];

  let child: ChildProcessWithoutNullStreams | null = null;
  let replyTarget: string | null = null;
  let nextId = 1;
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  /** Send a JSON-RPC request and wait for the response. */
  function request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      child!.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  }

  return {
    start(onMessage) {
      const args = ["rpc"];
      if (dbPath) args.push("--db", dbPath);

      child = spawn(cliPath, args, { stdio: ["pipe", "pipe", "pipe"] });
      child.stderr.on("data", (d) => dbg("imsg:stderr", d.toString().trim()));
      child.on("error", (err) => {
        console.error(`Failed to start imsg: ${err.message}\n  Install: brew install steipete/tap/imsg`);
        process.exit(1);
      });
      child.on("exit", (code) => {
        console.error(`imsg exited (code ${code})`);
        process.exit(1);
      });

      const rl = createInterface({ input: child.stdout });
      rl.on("line", (line) => {
        if (!line.trim()) return;
        try {
          const msg = JSON.parse(line);

          // JSON-RPC response → resolve pending promise
          if (msg.id != null && pending.has(msg.id)) {
            const p = pending.get(msg.id)!;
            pending.delete(msg.id);
            msg.error ? p.reject(new Error(msg.error.message ?? "RPC error")) : p.resolve(msg.result);
            return;
          }

          // JSON-RPC notification → new incoming message
          if (msg.method === "message") {
            const m = msg.params?.message;
            if (!m || m.is_from_me) return;
            const sender = (m.sender ?? "").trim();
            if (!sender) return;
            if (allowFrom.length > 0 && !allowFrom.some((a: string) => sender.includes(a))) {
              dbg("imsg:blocked", sender);
              return;
            }
            const text = (m.text ?? "").trim();
            if (!text) return;

            // Set reply target for send() — chat_id for groups, sender for DMs
            replyTarget = m.chat_id != null ? `chat:${m.chat_id}` : sender;
            dbg("imsg:recv", `from=${sender} → "${text}"`);

            // Pass session key per-sender so each person gets their own conversation
            onMessage(text, `imessage:${sender}`).catch((e) =>
              console.error("handler error:", e),
            );
          }
        } catch {
          /* ignore malformed JSON */
        }
      });

      // Async init: subscribe to new messages
      (async () => {
        console.log("🍎 Connecting to iMessage via imsg...");
        await request("watch.subscribe");
        console.log("🍎 iMessage channel ready. Listening for messages.");
        if (allowFrom.length) console.log(`   Allowed senders: ${allowFrom.join(", ")}`);
        else console.log("   ⚠️  No allowFrom filter — accepting messages from everyone.");
        console.log();
      })().catch((err) => {
        console.error(`imsg init failed: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
      });
    },

    send(text) {
      if (!child || !replyTarget) return;
      const params: Record<string, unknown> = { text, service: "auto" };
      if (replyTarget.startsWith("chat:")) params.chat_id = Number(replyTarget.slice(5));
      else params.to = replyTarget;
      dbg("imsg:send", `→ ${replyTarget}`);
      request("send", params).catch((e) =>
        console.error("imsg send failed:", e instanceof Error ? e.message : e),
      );
    },

    stop() {
      child?.kill();
      child = null;
    },
  };
}
