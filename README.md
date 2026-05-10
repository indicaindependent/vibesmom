<div align="center">

# 🤖 VibesMom

**AI-powered mental health support bot for Bluesky — warm, human, never robotic**

[![Bluesky](https://img.shields.io/badge/@vibesmom.bsky.social-0085ff?style=for-the-badge&logo=bluesky&logoColor=white)](https://bsky.app/profile/vibesmom.bsky.social)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![Anthropic](https://img.shields.io/badge/claude--opus--4--7-CC785C?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## What Is This

VibesMom is an autonomous Bluesky bot that posts daily mental health support content — grounding exercises, affirmations, community check-ins — powered by Anthropic's `claude-opus-4-7`.

It's designed to feel like a warm community member, not a corporate wellness bot. No clichés. No hollow positivity. Real talk about real struggles.

---

## Features

- 💬 **Daily Posts** — scheduled at 11am ET via Cloudflare Cron
- 🧠 **Powered by Claude** — `claude-opus-4-7` for genuine, varied content
- 🚫 **Anti-Repetition** — D1 tracks recent posts, bans repeated patterns
- 📊 **Self-Learning** — monitors negative feedback/blocks to self-correct
- 🌍 **AT Protocol Native** — built on Bluesky's open social protocol
- ⚡ **Zero Infrastructure** — runs entirely on Cloudflare's edge

---

## Architecture

```
Cloudflare Cron (daily 11am ET)
        │
        ▼
vibesmom-bsky Worker
        │
        ├── Anthropic API (claude-opus-4-7) → generates post
        ├── D1 (post history, block tracking)
        └── AT Protocol API → publishes to Bluesky

vibesmom-reporter (daily)
        │
        └── Scans notifications for blocks/negative feedback → updates D1
```

---

## Configuration

```toml
# wrangler.toml.example
name = "vibesmom-bsky"
main = "worker.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "vibesmom-db"
database_id = "YOUR_D1_ID"

[vars]
BSKY_HANDLE = "vibesmom.bsky.social"
MGMT_SECRET = "your-management-secret"
```

```bash
wrangler secret put BSKY_APP_PASS
wrangler secret put ANTHROPIC_API_KEY
wrangler deploy
```

---

## Ethical Notes

- Bot clearly identifies as AI in its profile bio
- Does not claim to be a human therapist or counselor
- Posts are supportive, not diagnostic
- All content reviewed by the VPDLNY collective

---

## License

[MIT](LICENSE)

---

<div align="center">
<sub>Built by <a href="https://osintnet.uk">Indica Independent</a> | Part of the <a href="https://osintnet.uk">VPDLNY</a> mission</sub>
</div>

## Changelog

### v2.3 — Kindness Engine (May 10 2026)
- **NEW:** Kindness detection engine — VibesMom now searches Bluesky for humans genuinely helping/supporting other humans
- **NEW:** Automatically **likes** posts where a human offers real support, advice, or kindness to another person
- **NEW:** Tracks likes per account in KV — when VibesMom has liked the same account **2 or more times**, she automatically **follows** that account
- **NEW:** 20 kindness-targeted search queries added alongside distress queries
- **NEW:** `/kindness-test` endpoint for manual trigger
- **NEW:** `/stats` endpoint shows daily reply + like counts
- Kindness engine runs concurrently with reply loop on every cron tick (7AM–11PM UTC)
- Daily limits: 12 replies, 20 kindness likes
- Follow threshold: 2 likes from same account → auto-follow
