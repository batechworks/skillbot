---
name: skill-creator
description: Create new skills or modify existing ones during conversation. Use when the user wants to add a new capability, automate a workflow, or package domain knowledge as a reusable skill.
platform: cross-platform
---

# Skill Creator

Create or modify skillbot skills — self-extending the bot's capabilities.

## Skill anatomy

Each skill is a single `.md` file in `skills/`:

```
skills/my-skill.md
```

### Required structure

```markdown
---
name: my-skill
description: What this skill does and when to use it. Be specific — this is the primary trigger.
always: false
---

# My Skill

Instructions, examples, and commands for the LLM to follow.
```

### Frontmatter fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Lowercase, hyphen-separated identifier |
| `description` | yes | What and when — this is how the bot decides to use the skill |
| `always` | no | If `true`, full body is injected into every prompt (use sparingly) |

## Creating a new skill

1. Understand the task with concrete examples
2. Write the skill file:

```bash
cat > skills/new-skill.md << 'SKILL'
---
name: new-skill
description: Describe what it does and when to trigger it
---

# New Skill

## Commands

\`\`\`bash
example-command --flag value
\`\`\`

## Tips
- Keep it concise — the context window is shared
- Prefer examples over verbose explanations
- Include error handling guidance
SKILL
```

3. Test it by asking the bot to use the new skill

## Design principles

- **Concise is key**: The context window is a shared resource. Only include what the LLM doesn't already know.
- **Examples over explanations**: Show, don't tell.
- **Progressive disclosure**: On-demand skills (default) only load when needed. Only use `always: true` for critical skills.
- **Self-contained**: Each skill should include all commands and patterns needed, no external dependencies.

## Modifying existing skills

```bash
# Read the current skill
cat skills/weather.md

# Edit it (use sed, or write the full file)
cat > skills/weather.md << 'SKILL'
... updated content ...
SKILL
```
