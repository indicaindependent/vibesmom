<div align="center">

# 🤖 VibesMom

**AI-powered Bluesky presence for support, kindness, and engagement — warm, human, never robotic**

[![Bluesky](https://img.shields.io/badge/@vibesmom.bsky.social-0085ff?style=for-the-badge&logo=bluesky&logoColor=white)](https://bsky.app/profile/vibesmom.bsky.social)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![Llama on Workers AI](https://img.shields.io/badge/llama--3.3--70b-7C3AED?style=for-the-badge)](https://developers.cloudflare.com/workers-ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## What Is This

VibesMom is an autonomous Bluesky presence built on Cloudflare Workers + Workers AI. She handles:

- **Distress reply loop** — searches Bluesky for people in emotional distress, composes warm, post-specific replies (under 270 chars)
- **Kindness engine** — finds humans helping other humans, likes their posts, auto-follows after 2 likes from same account
- **LoveBomb** — manual feed-targeted positivity bombs (queues warm replies to a selected feed)
- **FeedReply** — manual feed-targeted engagement on news/OSINT feeds with sharp commentary
- **Notification loop (v4.1+)** — reads incoming replies/mentions, posts 1 followup per thread, detects bot-callouts and flags them for human review

She runs every cron tick, 7AM–11PM UTC. Daily caps: 12 distress replies, 20 kindness likes.

She is designed to **feel like a warm community member**, not a corporate wellness bot. No clichés. No hollow positivity. Real talk.

---

## Architecture

```
Cloudflare Cron (every tick, 7AM–11PM UTC)
        │
        ▼
vibesmom-bsky Worker
        ├── runDistressReplyLoop()   → search distress posts → compose reply → post
        ├── runKindnessEngine()      → find helpers → like → follow at threshold
        ├── runNotificationLoop()    → read inbox → followup composer / callout detector
        ├── fireDueLBReplies()       → fire scheduled LoveBomb queue
        └── fireDueFRReplies()       → fire scheduled FeedReply queue

Workers AI bindings:
  - LLAMA_FAST  = @cf/meta/llama-3.1-8b-instruct
  - LLAMA_SMART = @cf/meta/llama-3.3-70b-instruct-fp8-fast
  - RERANKER    = @cf/baai/bge-reranker-base

Storage:
  - D1 (post history, callouts, sessions, replied tracking)
  - KV (session cache, dedup keys, daily counters)

Channels:
  - Telegram bot for human-in-the-loop alerts (bot-callouts)
```

---

## Routes

| Path | Auth | Purpose |
|------|------|---------|
| `/` | none | Dashboard (login UI) |
| `/health` | none | Health check |
| `/run-distress` | X-Auth | Manual distress loop trigger |
| `/run-kindness` | X-Auth | Manual kindness engine trigger |
| `/run-notifs` | X-Auth | Manual notification loop trigger (v4.1+) |
| `/run-lovebomb` | X-Auth | POST `{feed_url}` — queue LoveBomb session |
| `/run-feedreply` | X-Auth | POST `{feed_url}` — queue FeedReply session |
| `/admin/callouts` | X-Auth | Bot-callout review dashboard (v4.1+) |
| `/fire-lb` | X-Auth | Manual fire LoveBomb due queue |
| `/fire-fr` | X-Auth | Manual fire FeedReply due queue |
| `/ai-test` | X-Auth | Verify Workers AI is reachable |

---

## Configuration

```toml
# wrangler.toml.example
name = "vibesmom-bsky"
main = "worker.js"
compatibility_date = "2024-12-01"

[[d1_databases]]
binding = "DB"
database_name = "vibesmom-db"
database_id = "YOUR_D1_ID"

[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_ID"

[ai]
binding = "AI"

[triggers]
crons = ["*/5 * * * *"]
```

Secrets:
```bash
wrangler secret put BSKY_HANDLE          # vibesmom.bsky.social
wrangler secret put BSKY_APP_PASS        # Bluesky app password
wrangler secret put VIBESMOM_SECRET      # API auth token
wrangler secret put TG_BOT_TOKEN         # Telegram bot for callout alerts
wrangler secret put TG_CHAT_ID           # Telegram chat ID to alert
wrangler deploy
```

---

## Ethical Notes

- Bot clearly identifies as AI in its profile bio
- Does not claim to be a human therapist or counselor
- Posts are supportive, not diagnostic
- Bot-callouts are NEVER replied to — flagged for human review only
- Crisis-detected posts include 988 (Suicide & Crisis Lifeline) reference
- Daily caps enforced to prevent spam
- All content patterns reviewed by the VPDLNY collective

---

## License

[MIT](LICENSE)

---

<div align="center">
<sub>Built by <a href="https://osintnet.uk">Indica Independent</a> | Part of the <a href="https://osintnet.uk">VPDLNY</a> mission</sub>
</div>

---

## Changelog

### v4.2 — LoveBomb Resilience (May 15 2026)
- **FIX:** `composeLBReplies` no longer crashes on non-string Llama responses — hardened parser handles object/null/undefined payloads
- **FIX:** Per-post LLAMA_FAST fallback if LLAMA_SMART batch compose fails — graceful degradation instead of empty queue
- **FIX:** Schema migration — added missing `post_text` column to `lb_replied_posts` (ALTER TABLE in production)
- **FIX:** Bot-callout detector now also gates LoveBomb threads — won't reply if anyone in the thread is calling out bots

### v4.1 — Notification Loop + Bot-Callout Detector (May 15 2026)
- **NEW:** `runNotificationLoop()` — runs every cron tick. Reads incoming Bluesky notifications, posts ONE followup per thread (KV-dedup, 30-day TTL), auto-marks all notifs as seen
- **NEW:** Bot-callout detector with 16 regex patterns (`"this is a bot"`, `"touching grass"`, `"automated empathy"`, etc.) — flags + sends Telegram alert to operator + DOES NOT reply
- **NEW:** Followup composer — separate prompt for thread continuations, 1-2 sentences max, references both their reply and the original context
- **NEW:** Thanks/heart detector — short `"thank you"` / `"❤"` replies get LIKED instead of text-responded-to
- **NEW:** `/admin/callouts` dashboard for reviewing flagged callouts
- **NEW:** `/run-notifs` manual trigger route
- **NEW:** D1 tables: `vibesmom_callouts`, `vibesmom_notif_state`
- **FIX:** Killed stock empathy template (`"my sister went through something similar"`) — prompt now forbids specific personal-experience claims and requires opener variation per reply

### v4.0 — Unified Worker (May 12 2026)
- Consolidated `lovebomb`, `feed-reply-engine`, `vibesmom-bsky` into single worker
- Migrated from Anthropic API to Workers AI (`llama-3.3-70b` / `llama-3.1-8b`)
- Centralized dashboard for all modules
- Self-learning cycle via reranker model

### v3.x — Self-Learning + Kindness Engine
- Daily auditor + KV integrity guard
- Negative feedback detection → prompt self-correction
- Kindness engine: searches for genuine helpers, likes + auto-follows

### v2.3 — Kindness Engine (May 10 2026)
- 20 kindness-targeted search queries
- Like → like → follow flow
- `/stats` endpoint with daily counts

---
