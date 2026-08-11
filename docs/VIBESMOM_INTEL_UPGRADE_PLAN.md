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
