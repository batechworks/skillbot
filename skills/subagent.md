---
name: subagent
description: Spawn background subagents for complex, time-consuming, or parallel tasks. Use when a task would take many tool rounds, when you want to do research while continuing the conversation, or when multiple independent tasks can run in parallel.
---

# Subagent

Use the `spawn` tool to delegate tasks to background subagents.

## When to use

- **Long-running tasks**: Code analysis, research, complex file transformations
- **Parallel work**: Multiple independent tasks that can run simultaneously
- **Non-blocking**: Tasks that shouldn't block the current conversation

## How to use

Call the `spawn` tool with a detailed task description:

```
spawn({ task: "Analyze all TypeScript files in src/ and list functions with more than 50 lines", label: "Code analysis" })
```

## Rules

1. Provide **detailed, self-contained** task descriptions — the subagent has no access to conversation history
2. Use descriptive `label` values for easy tracking
3. Results are announced back automatically when the subagent finishes
4. Subagents can use bash but cannot spawn other subagents or message users directly
5. Don't spawn subagents for simple tasks that can be done in one tool call

## Examples

- "Research the latest Node.js 22 features and summarize the top 5 changes"
- "Scan the project for security vulnerabilities: check dependencies, hardcoded secrets, and unsafe patterns"
- "Read all markdown files in docs/ and create a table of contents"
