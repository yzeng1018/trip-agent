# Trip Agent - Claude Working Guidelines

## Core Principles (from Boris Cherny's workflow)

### 1. Verification Loop
Give Claude a way to verify its own work. This 2-3x's the quality of the final result.
- For web code: connect Claude to a browser tool (e.g., Chrome extension / MCP)
- For server code: give Claude a way to start/restart the server and check output
- Don't just generate code — run it, see the result, iterate

### 2. Plan First, Execute Fast
Start longer tasks in Plan mode. Discuss and align on the plan before letting Claude execute.
- Use extended thinking for complex planning ("steer it less, better at tool use")
- A good plan saves more time than it costs
- The bottleneck is human correction time, not AI speed

### 3. This File is Living Memory
Any time Claude does something wrong, add a rule here so it won't happen again.
Every mistake becomes a lesson. The longer we work together, the smarter this gets.

---

## Project: Trip Agent

### Tech Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- AI: configurable provider (Qwen default, Claude optional) via `AI_PROVIDER` env var
- Streaming itinerary generation with progressive day rendering

### Known Gotchas
- Trim `AI_PROVIDER` env var — trailing whitespace causes provider mismatch
- Mobile layout: watch for overflow and background flash on route transitions

### Slash Commands to Use
- `/commit-push-pr` — commit, push, and open a PR in one step

---

## What NOT to Do
- Don't over-engineer the setup (skip unnecessary memory hacks, excessive skill files)
- Don't jump straight into coding without a plan for complex features
- Don't fix a bug silently — if it reveals a pattern, document it here
