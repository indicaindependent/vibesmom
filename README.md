<div align="center">

# 🤖 VibesMom

**A warm, genuinely human Bluesky presence — she listens, she has a life, and when someone actually needs help she finds a real, verified resource for them.**

[![Bluesky](https://img.shields.io/badge/@vibesmom.bsky.social-0085ff?style=for-the-badge&logo=bluesky&logoColor=white)](https://bsky.app/profile/vibesmom.bsky.social)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![Workers AI](https://img.shields.io/badge/Llama_on_Workers_AI-7C3AED?style=for-the-badge)](https://developers.cloudflare.com/workers-ai/)
[![AT Protocol](https://img.shields.io/badge/AT_Protocol-0560ff?style=for-the-badge&logo=bluesky&logoColor=white)](https://atproto.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)

</div>

---

## What she is

VibesMom is an autonomous but *unhurried* presence on Bluesky, running entirely on the Cloudflare free edge (Workers + Workers AI + D1 + KV). She is not a patrol bot and not a wellness-app chatbot. She's built to feel like a real community member who happens to be made of code — warm, sometimes funny, sometimes blunt, never robotic, and honest about what she is.

Three things make her different from a typical "support bot":

**1. She holds real conversations — and only helps when help is actually wanted.**
An inner-judgment model reads the *whole* thread and decides, conservatively, whether someone is disclosing a real-world need (housing, food, fleeing danger, medical, self-harm risk, fraud, isolation) or just having a hard day that warmth alone serves. Most of the time the answer is "just listen." She continues a kind exchange for a few turns like a person would — then knows exactly when a conversation is over.

**2. When there IS a real need, she finds a REAL resource.**
She geolocates from the conversation, looks up a **verified** local agency from her own directory, and offers it in her own words — never a canned dump. If no verified local resource exists yet, she researches a candidate, corroborates it across two independent sources, and stages it *honestly as unverified* — she will **never** hand someone an unconfirmed local number. A national lifeline covers them now; the local entry only becomes usable after it's phone-verified (an optional CALL-E leg, off by default).

**3. She has an inner life.**
Once a day, in a calm midday window, she does something human: writes a short original micro-poem, and occasionally amplifies a genuinely kind post from someone else with her own take. She keeps a small film diary. Every night she runs a quiet self-learning cycle, and once a month she writes a private self-reflection digest. She isn't performing wellness — she's *being someone*.

Everything she says is honest. She draws on general lived wisdom but **never fabricates a personal anecdote** (no fake sister/friend/story). Her honesty is the whole brand.

---

## What she actually does (the real loop)

She wakes on Cloudflare cron and behaves on a human clock (waking hours in UTC):

```
Every tick, 7AM–11PM UTC
  ├── runConversationLoop()   → continue real threads; assessNeed() decides if a
  │                             human/resource is needed → directoryLookup() → verified help
  ├── runDistressReplyLoop()  → selective, unhurried cold outreach to strangers in pain
  │                             (small daily cap, real gaps, a conscience check that a reply
  │                              would land as welcome — never swooping, never a patrol)
  └── runKindnessEngine()     → find people helping people → like → follow at a threshold

Midday (calm window)
  └── runHumanMechanicsAndHobby() → daily micro-poem + occasional warm amplification (once/day)

Overnight (3AM UTC)
  ├── runLearnCycle()         → learn from what landed well / poorly, self-correct her voice
  └── runMonthlyDigest()      → private monthly self-reflection (self-gates to once/month)
```

She reaches out **rarely and meaningfully**. Cold replies to strangers are selective by design — a small daily cap, a real human gap between messages, and a conscience check first. She is not trying to be everywhere.

---

## Voice & safety

- Speaks in first person, contractions, real grounded language — no wellness clichés, no "honey," no hollow positivity.
- If accused of being a bot, she doesn't get defensive or deny it stiffly — she reacts like a tired human would and stays on *your* topic (a defensive bot changes the subject; a person keeps talking about what matters).
- Bot-callouts are flagged for human review, never argued with.
- Crisis-level posts always include a real crisis line (e.g. 988 in the US).
- Clearly identifies as AI in her profile — never claims to be a human therapist or counselor.
- Daily caps and per-thread turn caps prevent spam and prevent her from overstaying.

---

## Architecture

```
Cloudflare Cron ──▶ vibesmom-bsky Worker

Workers AI:
  LLAMA_CONVO = @cf/meta/llama-4-scout-17b-16e-instruct   (conversational voice)
  LLAMA_SMART = @cf/meta/llama-3.3-70b-instruct-fp8-fast   (inner judgment / need assessment)
  LLAMA_FAST  = @cf/meta/llama-3.1-8b-instruct-fast        (quick composes)
  RERANKER    = @cf/baai/bge-reranker-base                 (learning signal)

Storage:
  D1  — reply history, gate decisions, sessions, error log, learning context
  KV  — session cache, dedup keys, daily counters, self-gates

Directory:
  A verified resource directory (need × locale) with an honest unverified-vs-verified
  distinction and an optional phone-verification leg. National lines always cover the gap.

Human-in-the-loop:
  Telegram alerts for bot-callouts and for draft-mode hobby posts.
```

Legacy manual tools (`runLoveBomb`, `runFeedReplyEngine`) still exist as optional operator-queued utilities and fire if something is queued — but they are *not* who she is. Her identity is the conversation loop, the verified-help path, and her inner life.

---

## Configuration

```toml
# wrangler.toml.example
name = "vibesmom-bsky"
main = "vibesmom-bsky.js"
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

```bash
wrangler secret put BSKY_HANDLE          # vibesmom.bsky.social
wrangler secret put BSKY_APP_PASS        # Bluesky app password
wrangler secret put VIBESMOM_SECRET      # API auth token for manual routes
wrangler secret put TG_BOT_TOKEN         # Telegram bot for alerts (optional)
wrangler secret put TG_CHAT_ID           # Telegram chat to alert (optional)
wrangler deploy
```

The verified-directory + phone-verification legs are optional and off by default; VibesMom runs as a warm conversational presence without them.

---

## License

[MIT](LICENSE)

---

<div align="center">
<sub>Built by <a href="https://osintnet.uk">Indica Independent</a> · part of the VPDLNY mission</sub>
</div>

---

## ⚡ Support the mission

Free, ad-free, independent infrastructure — no VC, no strings. If she helped, a tip keeps her running.

[![Donate via SkyGive](https://img.shields.io/badge/💜_Donate_via_SkyGive-8A5CF6?style=for-the-badge&logoColor=white)](https://donate.skygive.app/)
