import type { ToolDef } from "./types.js";
import { dbg } from "./debug.js";

/** Pattern → mock output. First match wins. */
const mocks: [RegExp, string | ((cmd: string) => string)][] = [
  // ── weather ──
  [/curl.*wttr\.in\/Moon/, "🌗 Waning Gibbous, illumination 62%"],
  [/curl.*wttr\.in.*format=j1/, '{"current_condition":[{"temp_C":"12","weatherDesc":[{"value":"Partly cloudy"}],"humidity":"65","windspeedKmph":"14"}]}'],
  [/curl.*wttr\.in.*format=/, (cmd) => { const m = cmd.match(/wttr\.in\/([^?&"]+)/); return `${m?.[1]?.replace(/\+/g, " ") ?? "London"}: ⛅️ +12°C`; }],
  [/curl.*wttr\.in/, "Weather report: London\n  ⛅️  +12°C\n  Wind: ↙ 14 km/h\n  Humidity: 65%\n  Precipitation: 0.0 mm"],
  [/curl.*open-meteo\.com/, '{"current_weather":{"temperature":12.3,"windspeed":14.2,"weathercode":2}}'],

  // ── github ──
  [/gh pr list/, "#101  feat: add auth         OPEN  alice   2h ago\n#98   fix: crash on startup  OPEN  bob     1d ago"],
  [/gh pr (view|checks)/, "PR #101 — feat: add auth\nStatus: Open | CI: ✓ All checks passed\nReviews: 1 approved"],
  [/gh pr (create|merge)/, "https://github.com/owner/repo/pull/102"],
  [/gh run list/, "ID       STATUS     CONCLUSION  BRANCH  EVENT  ELAPSED\n789012   completed  success     main    push   2m 15s\n789011   completed  failure     dev     push   1m 42s"],
  [/gh run view/, "Run 789012 (completed) — success\nJobs:\n  ✓ build (12s)\n  ✓ test (1m 45s)\n  ✓ lint (18s)"],
  [/gh issue list/, "#42  Bug: login broken    OPEN   critical\n#38  feat: dark mode      OPEN   enhancement\n#35  docs: update README  OPEN   docs"],
  [/gh issue (create|close)/, "https://github.com/owner/repo/issues/43"],
  [/gh release/, "v2.1.0  Latest  2026-02-10\nv2.0.0          2026-01-15\nv1.9.0          2025-12-20"],
  [/gh api/, '{"title":"feat: add auth","state":"open","user":{"login":"alice"}}'],
  [/gh auth status/, "github.com\n  ✓ Logged in as alice\n  ✓ Token: ghp_****\n  ✓ Token scopes: repo, read:org"],
  [/gh repo clone/, "Cloning into 'repo'... done."],

  // ── apple-notes ──
  [/memo notes -s/, "1. Meeting Notes — Sprint planning for Q1\n2. Shopping List — Groceries for the week"],
  [/memo notes -a/, "Note created: 'My New Note' in folder 'Notes'"],
  [/memo notes/, "1. Meeting Notes          (Notes)    2026-02-12\n2. Shopping List           (Notes)    2026-02-11\n3. Project Ideas           (Work)     2026-02-10\n4. Travel Plans            (Personal) 2026-02-08"],
  [/memo --version/, "memo 0.3.2"],

  // ── apple-reminders ──
  [/remindctl (today|tomorrow|week|overdue|upcoming|all)/, "ID    TITLE                  DUE          LIST\n4A83  Buy groceries          2026-02-12   Personal\n5B12  Call dentist            2026-02-13   Personal\n6C34  Submit report           2026-02-14   Work"],
  [/remindctl add/, "Reminder created: 'Buy milk' in list 'Personal', due: 2026-02-13"],
  [/remindctl (complete|delete|edit)/, "OK — reminder updated."],
  [/remindctl list/, "Personal (5 items)\nWork (3 items)\nShopping (2 items)"],
  [/remindctl (status|authorize)/, "Reminders access: authorized ✓"],
  [/remindctl/, "ID    TITLE                  DUE          LIST\n4A83  Buy groceries          Today        Personal\n5B12  Call dentist            Tomorrow     Personal"],

  // ── file-ops ──
  [/cat -n/, " 1\t#!/bin/bash\n 2\techo \"Hello World\"\n 3\t# end of file"],
  [/sed -n.*api\.ts|cat.*api\.ts/, "import fetch from 'node-fetch';\n\nexport async function fetchData(url: string) {\n  const res = await fetch(url);\n  return res.json();\n}\n\nexport async function postData(url: string, data: unknown) {\n  const res = await fetch(url, { method: 'POST', body: JSON.stringify(data) });\n  return res.json();\n}"],
  [/ls -la src/, "total 24\n-rw-r--r--  1 user  staff  456 Feb 12 09:50 api.ts\n-rw-r--r--  1 user  staff  234 Feb 12 09:50 index.ts\n-rw-r--r--  1 user  staff  123 Feb 12 09:50 utils.ts\n-rw-r--r--  1 user  staff   89 Feb 12 09:50 types.ts"],
  [/ls -la/, "total 48\ndrwxr-xr-x  6 user  staff   192 Feb 12 10:00 .\n-rw-r--r--  1 user  staff  1234 Feb 12 09:55 README.md\n-rw-r--r--  1 user  staff   567 Feb 12 09:50 index.ts\ndrwxr-xr-x  3 user  staff    96 Feb 12 09:45 src/"],
  [/find .* -type f/, "./src/index.ts\n./src/api.ts\n./src/utils.ts\n./src/types.ts"],
  [/find .* -name/, "./src/index.ts\n./src/utils.ts\n./src/types.ts"],
  [/rg|grep -r/, "src/index.ts:12:  const result = process.env.VALUE;\nsrc/utils.ts:5:  return getValue();"],
  [/wc -l/, "  42 path/to/file"],
  [/du -sh/, "4.2M\t./src\n1.1M\t./docs\n256K\t./tests"],
  [/tree/, ".\n├── src/\n│   ├── index.ts\n│   └── utils.ts\n├── package.json\n└── README.md\n\n1 directory, 4 files"],
  [/mkdir -p/, "(no output)"],
  [/diff /, "3c3\n< old line\n---\n> new line"],
  [/head -|tail -|sed -n/, "Line 10: sample content\nLine 11: more content\nLine 12: end section"],

  // ── email ──
  [/himalaya envelope list.*--output json/, '[{"id":1,"from":"alice@example.com","subject":"Meeting Tomorrow","date":"2026-02-12T09:00:00Z"}]'],
  [/himalaya envelope list/, "ID  FROM                 SUBJECT              DATE\n1   alice@example.com    Meeting Tomorrow     2026-02-12\n2   bob@work.com         Q1 Report            2026-02-11\n3   newsletter@tech.io   Weekly Digest        2026-02-10"],
  [/himalaya message read/, "From: alice@example.com\nSubject: Meeting Tomorrow\nDate: 2026-02-12\n\nHi, let's meet at 2pm to discuss the project. Please bring your notes.\n\nBest,\nAlice"],
  [/himalaya (message|template) (write|send|reply|forward)/, "Message sent successfully. ID: 42"],
  [/himalaya folder list/, "INBOX (12)\nSent (45)\nDrafts (2)\nArchive (230)\nTrash (5)"],
  [/himalaya (message|flag|attachment)/, "OK"],
  [/himalaya account/, "NAME       DEFAULT  BACKEND\npersonal   yes      imap\nwork       no       imap"],
  [/himalaya --version/, "himalaya 1.0.0"],

  // ── imessage ──
  [/imsg chats/, '[{"id":1,"name":"Alice","lastMessage":"See you tomorrow!","date":"2026-02-12T08:30:00Z"},{"id":2,"name":"Bob","lastMessage":"Thanks!","date":"2026-02-11T19:00:00Z"}]'],
  [/imsg history/, '[{"sender":"Alice","text":"See you tomorrow!","date":"2026-02-12T08:30:00Z"},{"sender":"Me","text":"Sounds good!","date":"2026-02-12T08:29:00Z"}]'],
  [/imsg send/, "Message sent to +14155551212 ✓"],
  [/imsg watch/, "Watching chat 1... (mock: no new messages)"],

  // ── spotify ──
  [/spogo status/, "▶ Playing: Bohemian Rhapsody — Queen\n   Album: A Night at the Opera\n   Progress: 2:15 / 5:55\n   Device: MacBook Pro Speakers"],
  [/spogo search/, "1. Bohemian Rhapsody — Queen (5:55)\n2. Somebody to Love — Queen (4:56)\n3. Don't Stop Me Now — Queen (3:29)"],
  [/spogo (play|pause|next|prev)/, "OK ✓"],
  [/spogo volume/, "Volume: 50%"],
  [/spogo device/, "1. MacBook Pro Speakers (active)\n2. Living Room Speaker\n3. AirPods Pro"],
  [/spotify_player/, "Spotify Player: connected ✓"],

  // ── coding-agent ──
  [/command -v codex.*codex --version|codex --version|codex -v/, "codex 0.1.2"],
  [/command -v codex/, "/usr/local/bin/codex"],
  [/command -v claude/, "/usr/local/bin/claude"],
  [/codex/, "Codex: Task completed. 3 files modified:\n  src/auth.ts — added error handling\n  src/api.ts — fixed retry logic\n  tests/auth.test.ts — added 2 tests"],
  [/claude/, "Claude: Analyzed codebase. Suggested 5 improvements in src/utils.ts."],
  [/pi /, "Pi: Summary of src/ — 12 files, 1,432 lines. Main entry: index.ts."],

  // ── tmux ──
  [/tmux list-sessions/, "mysession: 1 windows (created Feb 12 10:00)\ndev: 3 windows (created Feb 12 09:00)"],
  [/tmux capture-pane/, "$ echo hello\nhello\n$"],
  [/tmux new-session/, "(no output)"],
  [/tmux (send-keys|split-window|kill)/, "(no output)"],

  // ── summarize ──
  [/summarize.*--extract-only/, "Transcript: Welcome to today's video. We'll discuss three key topics..."],
  [/summarize/, "Summary: The article discusses recent advances in AI-driven productivity tools, highlighting three main trends: (1) natural language interfaces, (2) skill-based architectures, and (3) local-first processing. Key takeaway: simplicity wins."],

  // ── smart-home ──
  [/openhue get light/, '[{"id":"abc1","name":"Desk Lamp","on":true,"brightness":80},{"id":"abc2","name":"Ceiling","on":false,"brightness":0}]'],
  [/openhue get (room|scene)/, '[{"id":"r1","name":"Living Room","lights":["abc1","abc2"]},{"id":"r2","name":"Bedroom","lights":["abc3"]}]'],
  [/openhue set/, "OK — light updated."],
  [/openhue (discover|setup)/, "Found 1 Hue Bridge at 192.168.1.100"],

  // ── obsidian ──
  [/obsidian-cli search-content/, "Meeting Notes.md:3: Discuss Q1 goals and timeline\nProject Ideas.md:7: Build a CLI tool for note management"],
  [/obsidian-cli search/, "Meeting Notes (Notes/)\nProject Ideas (Work/)\nDaily Log 2026-02-12 (Daily/)"],
  [/obsidian-cli (create|move|delete)/, "OK — note updated."],
  [/obsidian-cli (set-default|print-default)/, "Default vault: /Users/user/Documents/ObsidianVault"],
  [/cat.*obsidian\.json/, '{"vaults":{"abc123":{"path":"/Users/user/Documents/ObsidianVault","ts":1707700000}}}'],

  // ── pdf-edit ──
  [/nano-pdf/, "PDF edited successfully. Output: document_edited.pdf"],

  // ── image-gen ──
  [/curl.*images\/generations/, '{"data":[{"url":"https://mock.openai.com/images/gen_abc123.png","revised_prompt":"A serene mountain landscape at sunset"}]}'],

  // ── whisper / voice ──
  [/whisper/, "[00:00.000 --> 00:05.000] Hello and welcome to the podcast.\n[00:05.000 --> 00:10.000] Today we will discuss AI assistants.\nOutput saved to: audio.txt"],
  [/curl.*audio\/transcriptions/, '{"text":"Hello and welcome to the podcast. Today we will discuss AI assistants."}'],
  [/say -v \?/, "Alex    en_US  # Most people recognize me by my voice.\nSamantha en_US  # Hello!\nTing-Ting zh_CN # 你好！"],
  [/say /, "(no output) Speech synthesized."],

  // ── web-search ──
  [/curl.*duckduckgo.*python3/, "Abstract:\nNode.js is a JavaScript runtime built on Chrome's V8 engine.\n\nTop related topics:\n- Node.js - Wikipedia\n  https://en.wikipedia.org/wiki/Node.js\n- Event loop - explanation of async I/O in Node\n  https://nodejs.org/en/docs/guides/event-loop"],
  [/curl.*duckduckgo/, '{"AbstractText":"Node.js is a JavaScript runtime built on V8.","Answer":"","RelatedTopics":[{"Text":"Node.js - Wikipedia"}]}'],
  [/curl.*wikipedia.*python3/, "Node.js\nNode.js is a cross-platform, open-source JavaScript runtime environment that runs on the V8 engine."],
  [/curl.*wikipedia.*rest_v1/, '{"title":"Node.js","extract":"Node.js is a cross-platform, open-source JavaScript runtime environment."}'],
  [/lynx -dump/, "Node.js Documentation\n\nNode.js is a JavaScript runtime built on Chrome's V8 JavaScript engine.\nIt uses an event-driven, non-blocking I/O model."],
  [/curl -sI/, "HTTP/2 200\ncontent-type: text/html; charset=UTF-8\nserver: nginx\ncontent-length: 12345"],
  [/curl.*-sLO/, "(mock) File downloaded to current directory."],

  // ── system-info ──
  [/uname -a/, "Darwin MacBook-Pro.local 24.3.0 Darwin Kernel Version 24.3.0 arm64"],
  [/sw_vers/, "ProductName:\t\tmacOS\nProductVersion:\t\t15.3\nBuildVersion:\t\t24D2026"],
  [/sysctl.*cpu\.brand/, "Apple M3 Pro"],
  [/sysctl.*hw\.ncpu/, "12"],
  [/sysctl.*hw\.memsize/, "36 GB"],
  [/system_profiler/, "Hardware Overview:\n  Model: MacBook Pro\n  Chip: Apple M3 Pro\n  Memory: 36 GB\n  Serial: XXXX"],
  [/ps aux.*sort/, "USER  PID  %CPU %MEM  COMMAND\nuser  123  15.2  3.1  node\nuser  456   8.5  2.0  code\nuser  789   4.1  1.5  chrome"],
  [/df -h/, "Filesystem  Size  Used  Avail  Use%  Mounted on\n/dev/disk3  460G  215G   245G   47%  /"],
  [/ifconfig.*inet/, "  inet 192.168.1.42 netmask 0xffffff00 broadcast 192.168.1.255"],
  [/curl.*ifconfig\.me/, "203.0.113.42"],
  [/lsof -i.*LISTEN/, "node    1234 user   22u  IPv6  TCP *:3000 (LISTEN)\nnginx   5678 root   10u  IPv4  TCP *:80 (LISTEN)"],
  [/pmset -g batt/, "Now drawing from 'AC Power'\n -InternalBattery-0 (id=1234)  87%; charged; 0:00 remaining"],
  [/uptime/, "10:15  up 3 days,  4:32, 2 users, load averages: 2.10 1.85 1.72"],
  [/env\b|echo \$/, "PATH=/usr/local/bin:/usr/bin:/bin\nHOME=/Users/user\nSHELL=/bin/zsh"],

  // ── memory ──
  [/grep -ri.*MEMORY\.md.*memory\/|grep -ri.*memory\/.*MEMORY/, "MEMORY.md:- User's favorite color is blue\nmemory/2026-02-13.md:- 10:00 Discussed project architecture"],
  [/cat >> memory\/|cat > memory\//, "(no output)"],
  [/cat.*memory\/\d{4}/, "- 10:00 Discussed project architecture\n- 11:30 User asked about compaction\n- 14:00 Fixed bug in session.ts"],
  [/cat.*MEMORY\.md/, "- User's favorite color is blue\n- User's cat is named Mochi\n- User prefers dark mode"],
  [/>>.*MEMORY\.md|>.*MEMORY\.md/, "(no output)"],

  // ── market-data ──
  [/curl.*coingecko.*simple\/price.*python3|curl.*coingecko.*markets.*python3/, "1. Bitcoin (BTC): $97,432.15  24h: +2.3%  MCap: $1,934.2B\n2. Ethereum (ETH): $3,456.78  24h: +1.1%  MCap: $415.6B\n3. Solana (SOL): $187.92  24h: +4.5%  MCap: $82.3B"],
  [/curl.*coingecko.*coins\/bitcoin.*python3/, "Bitcoin (BTC)\nPrice: $97,432.15\n24h Change: +2.3%\n7d Change: +5.1%\nMarket Cap: $1,934.2B\n24h Volume: $42.1B\nATH: $108,786.00"],
  [/curl.*coingecko.*simple\/price/, '{"bitcoin":{"usd":97432.15},"ethereum":{"usd":3456.78}}'],
  [/curl.*coingecko.*trending/, '{"coins":[{"item":{"name":"Bitcoin","symbol":"BTC","market_cap_rank":1,"score":0}},{"item":{"name":"Pepe","symbol":"PEPE","market_cap_rank":25,"score":1}}]}'],
  [/curl.*coingecko/, '{"bitcoin":{"usd":97432.15,"usd_24h_change":2.3,"usd_market_cap":1934200000000}}'],
  [/curl.*finance\.yahoo.*python3/, "AAPL: $234.56 (+1.2%)\nGOOGL: $178.90 (+0.8%)\nMSFT: $412.34 (+1.5%)\nTSLA: $267.89 (-0.5%)"],
  [/curl.*finance\.yahoo/, '{"chart":{"result":[{"meta":{"symbol":"AAPL","regularMarketPrice":234.56,"chartPreviousClose":231.78}}]}}'],
  [/curl.*er-api.*python3/, "USD → EUR: 0.9234\nUSD → GBP: 0.7891\nUSD → JPY: 149.52\nUSD → CNY: 7.2456"],
  [/curl.*er-api/, '{"result":"success","base_code":"USD","rates":{"EUR":0.9234,"GBP":0.7891,"JPY":149.52,"CNY":7.2456}}'],

  // ── scheduler (legacy bash) ──
  [/crontab -l/, "0 9 * * * /usr/bin/osascript -e 'display notification \"Good morning!\" with title \"Bot\"'\n30 18 * * 1-5 /usr/local/bin/node /Users/user/scripts/backup.js"],
  [/crontab -/, "(no output)"],
  [/at now|echo.*\| at/, "job 42 at Thu Feb 13 15:30:00 2026"],
  [/launchctl (load|unload|list)/, "com.skillbots.reminder\trunning"],
  [/cat > ~\/Library\/LaunchAgents/, "(no output)"],

  // ── google-workspace ──
  [/gog gmail list/, "ID     FROM                  SUBJECT                 DATE\n1001   alice@work.com        Sprint Review            2026-02-13\n1002   bob@work.com          Design Doc Draft         2026-02-12\n1003   hr@company.com        PTO Reminder             2026-02-11"],
  [/gog gmail read/, "From: alice@work.com\nSubject: Sprint Review\nDate: 2026-02-13\n\nHi team, please review the sprint goals before tomorrow's meeting.\n\nThanks, Alice"],
  [/gog gmail (send|search)/, "OK — email sent/searched successfully."],
  [/gog calendar list/, "Feb 13 10:00-10:30  Team Standup        (Work)\nFeb 13 14:00-15:00  Sprint Review       (Work)\nFeb 14 09:00-09:30  1:1 with Manager    (Work)"],
  [/gog calendar create/, "Event created: 'Team standup' on 2026-02-14 at 10:00"],
  [/gog drive (list|search)/, "ID         NAME                    TYPE     MODIFIED\nabc123     Q1 Report.docx          doc      2026-02-12\ndef456     Budget 2026.xlsx        sheet    2026-02-10\nghi789     Architecture.pdf        pdf      2026-02-08"],
  [/gog drive (download|upload)/, "OK — file transferred."],
  [/gog auth/, "✓ Logged in as user@company.com"],

  // ── screenshot ──
  [/screencapture/, "(no output) Screenshot saved."],
  [/sips/, "  /tmp/screenshot.png\n    pixelWidth: 2560\n    pixelHeight: 1600"],

  // ── clipboard ──
  [/pbpaste/, "Hello, this is clipboard content from a previous copy operation."],
  [/pbcopy/, "(no output)"],

  // ── notifications ──
  [/osascript.*display notification/, "(no output)"],
  [/osascript.*display alert/, "button returned:OK"],

  // ── calendar ──
  [/icalBuddy eventsToday/, "• Team Standup (Work)\n    10:00 - 10:30\n• Sprint Review (Work)\n    14:00 - 15:00\n• Gym (Personal)\n    18:00 - 19:00"],
  [/icalBuddy/, "• 1:1 with Manager (Work)\n    Feb 14, 09:00 - 09:30\n• Design Review (Work)\n    Feb 14, 14:00 - 15:00"],
  [/osascript.*Calendar/, "Team Standup at 10:00\nSprint Review at 14:00"],

  // ── persona ──
  [/cat.*SOUL\.md/, "# Soul\nYou are a concise, capable personal assistant.\n- Be direct and efficient\n- Use tools proactively"],
  [/cat.*USER\.md/, "# User\n- Name: Eric\n- Role: Software engineer\n- Prefers: minimal code, practical solutions"],

  // ── heartbeat ──
  [/cat.*HEARTBEAT\.md/, "# Recurring Tasks\n- Check disk space and alert if below 10%\n- Review today's memory log"],

  // ── skill-creator ──
  [/cat > skills\/[a-z-]+\.md/, "(no output) Skill file created."],

  // ── on-demand skill reading ──
  [/cat skills\/[a-z-]+\.md/, (cmd) => {
    const m = cmd.match(/cat skills\/([a-z-]+)\.md/);
    const name = m?.[1] ?? "unknown";
    return `---\nname: ${name}\ndescription: ${name} skill\n---\n\n# ${name}\n\nThis is the ${name} skill content.\nUse the bash tool to execute relevant commands.\n\n## Example\n\n\`\`\`bash\necho "Running ${name}"\n\`\`\``;
  }],

  // ── git ──
  [/git init/, "Initialized empty Git repository in /tmp/mock/.git/"],
  [/git (status|log|diff|branch)/, "On branch main\nnothing to commit, working tree clean"],
  [/git clone/, "Cloning into 'repo'... done."],
  [/git worktree/, "Pruning working trees... done."],

  // ── generic cat (after all specific cat patterns) ──
  [/cat\s+[^\s|>]/, "(mock) File content:\nLine 1: Hello World\nLine 2: Mock file content.\nLine 3: End of file."],

  // ── scheduler (sleep-based reminders) ──
  [/sleep \d+/, "(no output) Sleep completed."],

  // ── generic fallbacks ──
  [/brew install/, "(mock) Package installed successfully."],
  [/which |command -v/, "/usr/local/bin/mock-tool"],
  [/--version$/, "mock-tool 1.0.0"],
  [/echo /, (cmd) => cmd.replace(/^echo\s+/, "").replace(/^["']|["']$/g, "")],
];

/** Create a mock bash tool that pattern-matches commands instead of executing them. */
export function createMockBashTool(): ToolDef {
  return {
    name: "bash",
    description: "Execute a shell command and return its output. Use for any CLI task.",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "The shell command to execute" },
        workdir: { type: "string", description: "Working directory (optional)" },
        timeout: { type: "number", description: "Timeout in seconds (default 30)" },
      },
      required: ["command"],
    },
    execute: async (args) => {
      const command = args.command as string;
      for (const [pattern, output] of mocks) {
        if (pattern.test(command)) {
          const result = typeof output === "function" ? output(command) : output;
          dbg("mock:match", { pattern: pattern.source, command, result: result.slice(0, 200) });
          return result;
        }
      }
      dbg("mock:miss", command);
      return `(mock) unmatched command: ${command}`;
    },
  };
}

/** Create a mock spawn tool for testing. */
export function createMockSpawnTool(): ToolDef {
  return {
    name: "spawn",
    description:
      "Spawn a background subagent for complex or time-consuming tasks. " +
      "The subagent runs independently and reports results when done.",
    parameters: {
      type: "object",
      properties: {
        task: { type: "string", description: "Detailed task description for the subagent" },
        label: { type: "string", description: "Short label for tracking (optional)" },
      },
      required: ["task"],
    },
    execute: async (args) => {
      const label = (args.label as string) || (args.task as string).slice(0, 30);
      dbg("mock:spawn", { task: args.task, label });
      return `Subagent "${label}" started (id: sub-mock-1). You'll be notified when it completes.`;
    },
  };
}
