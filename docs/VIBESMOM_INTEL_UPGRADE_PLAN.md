# VibesMom — 42-Day Longitudinal Intelligence Analysis & Upgrade Plan
Aug 11 2026 · analyst: Bumboclaat/ScrambleMeBot · account: vibesmom.bsky.social

## DATA BASELINE (432 stranger-replies, 3x14-day cohorts)
| metric | C3 (28-42d, oldest) | C2 (14-28d) | C1 (last 14d, newest) | trend |
|---|---|---|---|---|
| replies fired | 167 | 177 | 88 | down (more selective) |
| avg length (u16) | 146 | 157 | 214 | up (bloating) |
| ends on question % | 98.8% | 89.8% | 86.4% | down (less reflexive-Q) |
| names-their-agency % | 4% | 9% | 31% | up (big shift) |
| "do you have someone?" % | 3% | 18% | 49% | up (biggest shift) |
| body-grounding % | 5% | 9% | 2% | up then dropped |
| crisis 988/phone % | 1% | 7% | 8% | up (safety) |
| likes/reply | 0.25 | 0.24 | 0.20 | down slightly |
| replies-back/reply | 0.31 | 0.43 | 0.31 | peaked mid |

## WHAT SHE LEARNED (live KV self-model)
PERSONALITY_NOTES (14): witness+validate before solutions; name what people ALREADY did;
pivot to "do you have someone"; ground people in their bodies first; ask the next question.
WORKING_PATTERNS: converged on "empathetic presence when overwhelmed" (was 7/8 duplicates).
AVOID_PATTERNS: don't get defensive re: bot; for SSA/Medicaid give ONE exact step; respect blocks.

## HOW SHE LEARNS (mechanism, pre-Phase-1)
runLearnCycle pulled last 30 notifications -> llama-8b -> {working,avoid} -> KV (cap 10),
injected into every composer via getLearningContext. Learned from a PROXY (inbound text),
not from real outcomes on her own replies.

## WEAKNESSES FOUND
W1 blind learning signal (proxy, not outcome) — FIXED in Phase 1
W2 pattern collapse (exact-string dedupe) — FIXED (semantic dedupe)
W3 length bloat (146->214) — Phase 3
W4 fabricated "my sister" anecdote — Phase 3
W5 self-model drift (grounding 9%->2%) — Phase 4

## PHASE 1 — OUTCOME-AWARE LEARNING (DEPLOYED Aug 11 2026)
runLearnCycle rewritten: grades HER OWN recent replies by REAL outcome
(WON = human reply-back or >=2 likes; LOST = zero engagement >24h), feeds the WARM-vs-FLAT
contrast to the free model, extracts behavioral lessons, semantic-dedupes (60% token overlap),
caps 6 working / 8 avoid, records win-rate to VIBESMOM_LAST_WINRATE. Zero Anthropic.
FIRST LIVE RUN: graded 99, won 33, lost 62, win-rate 0.33; learned 3 working + 2 avoid.
Cron: daily hour-3 UTC via scheduled() handler (auto-runs new code).

## REMAINING PHASES
2 semantic dedupe+decay (partly shipped w/ P1) · 3 length+honesty guardrails ·
4 self-model fidelity + monthly reflection digest · 5 A/B the conscience gate.
Priority: 1 -> 3 -> 2 -> 4 -> 5. All edge/free/CF-AI, no Anthropic.

## PHASE 3 — LENGTH & HONESTY GUARDRAILS (DEPLOYED Aug 11 2026)
Fixes W3 (bloat) + W4 (fabricated "my sister" tic). Three changes to vibesmom-bsky.js:
1. Removed the prompt line that TOLD her to fabricate ("you can reference my sister went
   through this") -> replaced with an explicit anti-fabrication rule + a HARD RULE against
   inventing any relationship. Fixes all composers (shared VIBESMOM_SYSTEM).
2. Retuned composeDistressReply lengthStyle toward her 90-160 char high-engagement band
   (dropped "3-4 sentences / take your time"); USER target -> "aim 90-160, hard max 220";
   max_tokens 180 -> 110.
3. Added scrubFabricatedKin() HARD post-process filter: excises any invented kin/anecdote
   that slips past the prompt, regenerates once if excision leaves the reply too thin.
   Unit-tested: catches "my sister/friend of mine/someone I know/when I went through",
   leaves clean replies (incl. "my heart goes out") untouched.
LIVE PROOF (5 composes via temp /p3-check, since removed): lengths 95/99/103/110/120,
zero fabricated_kin, warmth intact. Bindings preserved, temp route cleaned up.

## PHASE 2 — PATTERN DECAY (DEPLOYED Aug 11 2026)
Semantic dedupe (0.6 token-overlap) already shipped with Phase 1. Added the missing DECAY:
a VIBESMOM_PATTERN_META KV sidecar {pattern: {firstSeen,lastConfirmed}} stamps every pattern
the model re-surfaces each cycle; any working/avoid pattern unconfirmed for 30d is evicted so
the set stays fresh instead of ossifying at cap. Meta is pruned to live patterns (bounded).
runLearnCycle now returns decayed_evicted. Composer still reads plain string arrays (no format change).

## PHASE 4 — SELF-MODEL FIDELITY + MONTHLY DIGEST (DEPLOYED Aug 11 2026)
4a: composeDistressReply gets an occasional (~25%) grounding nudge honoring her own self-model
   ("despair lives in the nervous system") to reverse the 9%->2% body-grounding regression.
   Never forced — only when it fits.
4b: runMonthlyDigest() — measures ~30d of her own replies (avg length, ends-on-question,
   agency-naming, body-grounding, "do you have someone", win-rate, likes/reply), diffs vs the
   prior month, and sends a formatted HTML digest to Pete's Telegram. Self-gates once/month via
   VIBESMOM_DIGEST_MONTH; stores VIBESMOM_DIGEST_PREV as next baseline. Zero Anthropic.
   Wired into the hour-3 UTC cron right after the learn cycle.

## PHASE 5 — CONSCIENCE-GATE AUDIT (DEPLOYED Aug 11 2026)
logGateDecision() logs every replyWouldBeWelcome YES/NO to VIBESMOM_GATE_AUDIT (monthly yes/no
tally + last-25 skipped-post snippets) so false-skips can be reviewed and the WELCOME threshold
tuned with data. Best-effort, never blocks the decision.

## NEW READ-ONLY ENDPOINT
GET /insights (X-Auth gated) returns win_rate, working/avoid patterns, pattern_meta_count,
gate_audit, last_digest, digest_month_sent — one call to see her whole learning state.

## STATUS: ALL 5 PHASES SHIPPED. VibesMom now learns from real outcomes (P1), stays honest +
tight (P3), keeps her lessons fresh (P2), honors her own identity + reports monthly (P4), and
audits her own silence/reply gate (P5). Fully autonomous, edge/free, zero Anthropic.
