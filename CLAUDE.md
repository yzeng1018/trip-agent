# Trip Agent - Claude Working Guidelines

## Core Principles

### 1. Verification Loop
Give Claude a way to verify its own work. This 2-3x's the quality of the final result.
- For web code: connect Claude to a browser tool (e.g., Chrome extension / MCP)
- For server code: give Claude a way to start/restart the server and check output
- Don't just generate code — run it, see the result, iterate

### 2. Plan First, Execute Fast
Start longer tasks in Plan mode. Discuss and align on the plan before letting Claude execute.
- A good plan saves more time than it costs
- The bottleneck is human correction time, not AI speed
- Skip planning only for single-file, clearly-scoped changes

### 3. Manage Context Aggressively
- `/clear` between unrelated tasks — stale context degrades performance
- If the same mistake is corrected more than twice: `/clear` and restart with a better prompt
- Use subagents to explore the codebase so exploration doesn't pollute the main context

### 4. This File is Living Memory
Any time Claude does something wrong, add a rule here so it won't happen again.
Every mistake becomes a lesson. Keep this file SHORT — if a rule is obvious, delete it.

---

## Project: Trip Agent

### Platform Priority
- **以手机端为主** — 产品设计、UI 布局、交互逻辑优先考虑移动端体验
- 当前以手机浏览器网页为主，未来会上线 iOS、Android、微信小程序
- 写 CSS/布局时默认 mobile-first，不要默认宽屏布局

### Tech Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS v4 (uses oklch colors — affects image libraries)
- AI: configurable provider via `AI_PROVIDER` env var, default is Qwen (DashScope)
- Streaming itinerary generation with progressive day rendering
- Deployed on Vercel at https://asktabi.com

### Deploy
```bash
vercel --prod
git push origin main
```

---

## Known Gotchas

### Environment Variables (Vercel)
- NEVER use `echo "value" | vercel env add` — `echo` appends `\n`, causing `'qwen\n' !== 'qwen'`
- Always use: `printf "value" | vercel env add VAR_NAME production`
- Always add `.trim()` in code: `(process.env.AI_PROVIDER || 'qwen').trim()`

### Image Libraries
- **html2canvas breaks with Tailwind v4** — it can't parse oklch/lab CSS colors
- Use `html-to-image` instead (supports modern CSS color functions)

### Client-side Canvas / CORS
- Browser canvas `getImageData()` throws SecurityError on cross-origin images
- Do NOT rely on client-side canvas for image analysis — CORS will silently fail
- Use **server-side `sharp`** instead (already available as Next.js transitive dependency)
- `sharp` usage: `await sharp(buf).resize(50, 50).raw().toBuffer()`

### Image Analysis: Use Median, Not Mean Brightness
- Night city photos have a few bright pixels (lights) that skew mean brightness high
- Use **median** brightness to correctly identify dark images
- Thresholds that work: `median >= 55 && colorBuckets >= 25`

### Background Slideshow Crossfade
- Never fade both layers simultaneously — creates black gap when both are at low opacity
- Correct pattern: bottom layer always opacity:1, top layer fades 0→1 then gets promoted
- Use `transitionActiveRef` guard to prevent overlapping transitions
- Cache filtered photo list in `localStorage` to avoid black screen on page refresh

### React StrictMode Double-fetch
- useEffect runs twice in dev — two concurrent fetches write to same ref → corrupted data
- Fix: AbortController + `active` flag
```ts
let active = true
return () => { active = false; abortController.abort() }
```

### Streaming JSON Parsing
- AI output may contain control characters → use `sanitizeJson()` before parsing
- Use `/\{\s*"/` regex to find true JSON start (skip AI preamble text)
- Use `jsonrepair` as fallback when `JSON.parse` fails

---

## Subagents

三个 subagent 在 `.claude/agents/` 目录下，用法：直接告诉 Claude "用 subagent 做XX"。

| Subagent | 用途 | 示例指令 |
|----------|------|----------|
| `code-reviewer` | 实现完成后审查代码，查 bug 和一致性 | "用 subagent 审查一下这次改动" |
| `deploy` | commit → push → vercel 一键发布 | "用 subagent 部署" |
| `explorer` | 在独立 context 里探索代码库，不污染主对话 | "用 subagent 找一下 XX 是怎么实现的" |

**什么时候用 subagent：**
- 探索代码库（会读很多文件，容易撑爆主 context）
- 实现完一个功能后做代码审查
- 准备发布时一键 deploy

---

## What NOT to Do
- Don't use `echo` to set Vercel env vars (use `printf`)
- Don't use client-side canvas for cross-origin image analysis (use server-side sharp)
- Don't use mean brightness to detect dark images (use median)
- Don't fade both slideshow layers simultaneously (keep bottom always visible)
- Don't jump straight into coding without a plan for complex/multi-file features
- Don't let CLAUDE.md get too long — bloated files cause rules to be ignored
