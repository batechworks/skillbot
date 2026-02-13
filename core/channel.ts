import readline from "node:readline";
import { toggleDebug, isDebug } from "./debug.js";

export interface Channel {
  /** Start receiving messages. Calls onMessage for each user input. sessionKey is optional (for per-sender isolation). */
  start(onMessage: (text: string, sessionKey?: string) => Promise<void>): void;
  /** Send a reply to the user. */
  send(text: string): void;
  /** Stop the channel. */
  stop(): void;
}

/** CLI channel — reads from stdin, writes to stdout. */
export function createCLIChannel(): Channel {
  let rl: readline.Interface | null = null;

  return {
    start(onMessage) {
      rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      console.log("\n🤖 skillBots ready. Type a message (Ctrl+C to exit).\n");
      console.log("   Commands: /reset /debug /quit\n");

      const prompt = () => {
        rl!.question("you> ", async (input) => {
          const text = input.trim();
          if (!text) { prompt(); return; }
          if (text === "/quit" || text === "/exit") { this.stop(); return; }
          if (text === "/debug") {
            const on = toggleDebug();
            console.log(`\nDebug mode: ${on ? "ON" : "OFF"}\n`);
            prompt();
            return;
          }
          if (text === "/reset") {
            console.log("Session reset.\n");
            await onMessage("/reset");
            prompt();
            return;
          }
          await onMessage(text);
          prompt();
        });
      };

      rl.on("close", () => process.exit(0));
      prompt();
    },

    send(text) {
      console.log(`\nbot> ${text}\n`);
    },

    stop() {
      rl?.close();
      process.exit(0);
    },
  };
}
