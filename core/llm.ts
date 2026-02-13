import OpenAI from "openai";
import type { Message, ToolCall, ToolDef } from "./types.js";
import { toolsToOpenAI } from "./tools.js";
import { getModelConfig } from "./models.js";
import { dbg } from "./debug.js";

export interface LLMOptions {
  provider?: string;
  model?: string;
  systemPrompt: string;
  tools: ToolDef[];
  maxToolRounds?: number;
}

/** Run a full LLM conversation turn: send messages, execute tool calls in a loop, return final reply. */
export async function chat(history: Message[], opts: LLMOptions): Promise<Message[]> {
  const config = getModelConfig(opts.provider);
  const client = config.client;
  const model = opts.model || config.model;
  const maxRounds = opts.maxToolRounds ?? 10;
  const openaiTools = toolsToOpenAI(opts.tools);
  const toolMap = new Map(opts.tools.map((t) => [t.name, t]));

  // Build messages for API
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: opts.systemPrompt },
    ...history.map(msgToOpenAI),
  ];

  dbg("llm:request", { model, provider: config.name, msgCount: messages.length, promptLen: opts.systemPrompt.length });

  const newMessages: Message[] = [];

  for (let round = 0; round < maxRounds; round++) {
    dbg("llm:round", `${round + 1}/${maxRounds}`);
    const t0 = Date.now();

    const response = await client.chat.completions.create({
      model,
      messages,
      tools: openaiTools.length > 0 ? openaiTools : undefined,
    });

    const elapsed = Date.now() - t0;
    const choice = response.choices[0];
    if (!choice) break;

    dbg("llm:response", {
      elapsed: `${elapsed}ms`,
      finishReason: choice.finish_reason,
      usage: response.usage,
    });

    const assistantMsg = choice.message;

    // Collect tool calls if any
    const toolCalls: ToolCall[] | undefined = assistantMsg.tool_calls?.map((tc) => ({
      id: tc.id,
      type: "function",
      function: { name: tc.function.name, arguments: tc.function.arguments },
    }));

    const msg: Message = {
      role: "assistant",
      content: assistantMsg.content || "",
      tool_calls: toolCalls,
    };
    newMessages.push(msg);
    messages.push(assistantMsg as OpenAI.ChatCompletionMessageParam);

    // If no tool calls, we're done
    if (!toolCalls || toolCalls.length === 0) break;

    // Execute each tool call
    for (const tc of toolCalls) {
      dbg("tool:call", { name: tc.function.name, args: tc.function.arguments });
      const tool = toolMap.get(tc.function.name);
      let result: string;
      if (!tool) {
        result = `Unknown tool: ${tc.function.name}`;
      } else {
        try {
          const t1 = Date.now();
          const args = JSON.parse(tc.function.arguments);
          result = await tool.execute(args);
          dbg("tool:result", { name: tc.function.name, elapsed: `${Date.now() - t1}ms`, output: result });
        } catch (err) {
          result = `Tool error: ${err instanceof Error ? err.message : String(err)}`;
          dbg("tool:error", result);
        }
      }
      const toolMsg: Message = { role: "tool", content: result, tool_call_id: tc.id };
      newMessages.push(toolMsg);
      messages.push({ role: "tool", content: result, tool_call_id: tc.id });
    }

    // ── Interleaved reflection (borrowed from nanobot) ──
    // After tool execution, inject a brief reflection prompt so the LLM
    // pauses to evaluate results before rushing into the next action.
    if (round < maxRounds - 1 && toolCalls.length > 0) {
      const reflectMsg: OpenAI.ChatCompletionMessageParam = {
        role: "user",
        content: "Reflect on the tool results above and decide your next step.",
      };
      messages.push(reflectMsg);
    }
  }

  return newMessages;
}

/** Convert our Message type to OpenAI format. */
function msgToOpenAI(msg: Message): OpenAI.ChatCompletionMessageParam {
  if (msg.role === "tool") {
    return { role: "tool", content: msg.content, tool_call_id: msg.tool_call_id! };
  }
  if (msg.role === "assistant" && msg.tool_calls?.length) {
    return {
      role: "assistant",
      content: msg.content || null,
      tool_calls: msg.tool_calls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
    };
  }
  return { role: msg.role as "user" | "assistant" | "system", content: msg.content };
}
