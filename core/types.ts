// === Skill (loaded from .md files) ===
export interface Skill {
  name: string;
  description: string;
  body: string; // markdown content after frontmatter
  filePath: string;
  always?: boolean; // if true, full body is injected into system prompt
}

// === Messages (OpenAI-compatible) ===
export type Role = "system" | "user" | "assistant" | "tool";

export interface Message {
  role: Role;
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

// === Session ===
export interface Session {
  id: string;
  history: Message[];
  createdAt: number;
}

// === Tool definition for LLM ===
export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<string>;
}
