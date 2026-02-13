import fs from "node:fs";
import path from "node:path";
import type { Skill } from "./types.js";

/** Parse YAML frontmatter from markdown. Returns {meta, body}. */
export function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { meta, body: match[2] };
}

/** Load all .md skill files from a directory. */
export function loadSkills(skillsDir: string): Skill[] {
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir).filter((f) => f.endsWith(".md")).map((file) => {
    const raw = fs.readFileSync(path.join(skillsDir, file), "utf-8");
    const { meta, body } = parseFrontmatter(raw);
    return {
      name: meta.name || path.basename(file, ".md"),
      description: meta.description || "",
      body: body.trim(),
      filePath: path.join(skillsDir, file),
      always: meta.always === "true",
    };
  });
}

/** Read a file if it exists, return trimmed content or empty string. */
function readIfExists(p: string): string {
  return fs.existsSync(p) ? fs.readFileSync(p, "utf-8").trim() : "";
}

/** Build the full system prompt. `always` skills are fully injected; others show catalog only. */
export function buildSystemPrompt(skills: Skill[], projectRoot: string): string {
  const lines: string[] = [];

  // Persona (SOUL.md / USER.md)
  for (const name of ["SOUL.md", "USER.md"]) {
    const c = readIfExists(path.join(projectRoot, name));
    if (c) lines.push(c, "");
  }

  lines.push("You are a helpful personal assistant with access to tools.", "Use the bash tool to execute commands when needed.", "");

  // Skills
  const alwaysSkills = skills.filter((s) => s.always);
  const onDemandSkills = skills.filter((s) => !s.always);

  if (alwaysSkills.length > 0) {
    lines.push("## Core Skills\n");
    for (const s of alwaysSkills) lines.push(`### **${s.name}**${s.description ? ` — ${s.description}` : ""}\n\n${s.body}\n`);
  }
  if (onDemandSkills.length > 0) {
    lines.push("## Available Skills\n", "Read a skill before using it: `cat skills/<name>.md`\n");
    for (const s of onDemandSkills) lines.push(`- **${s.name}**${s.description ? ` — ${s.description}` : ""}`);
    lines.push("");
  }

  // Memory: MEMORY.md + today/yesterday daily logs
  const memParts: string[] = [];
  const mem = readIfExists(path.join(projectRoot, "MEMORY.md"));
  if (mem) memParts.push(mem);
  const memDir = path.join(projectRoot, "memory");
  if (fs.existsSync(memDir)) {
    for (let offset = 0; offset <= 1; offset++) {
      const d = new Date(); d.setDate(d.getDate() - offset);
      const dateStr = d.toISOString().slice(0, 10);
      const content = readIfExists(path.join(memDir, `${dateStr}.md`));
      if (content) memParts.push(`### ${offset === 0 ? "Today" : "Yesterday"} (${dateStr})\n${content}`);
    }
  }
  if (memParts.length) lines.push("## Your Memory\n", memParts.join("\n\n"), "");

  lines.push("## Guidelines", "- Execute commands via the bash tool; report results concisely.", "- Read a skill file (`cat skills/<name>.md`) before using unfamiliar skills.", "- Be concise and helpful.");
  return lines.join("\n");
}
