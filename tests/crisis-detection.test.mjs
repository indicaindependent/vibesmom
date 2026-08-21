// Regression suite for VibesMom's crisis detector.
//
// WHY THIS EXISTS: isCrisis is the master override for four separate behaviours in
// runDistressReplyLoop - it injects the 988 referral, makes a reply unconditionally
// warranted, bypasses the distress-phrase and open-to-connection gates, and bypasses
// the REPLY_RATE roll. A false negative therefore does not degrade gracefully: the
// post falls through to the ordinary path where a random roll can discard it and no
// crisis referral is offered at all.
//
// Run:  node tests/crisis-detection.test.mjs
//
// The suite extracts the detector out of the worker bundle rather than importing it,
// because the bundle expects the Cloudflare Workers runtime. Extraction keeps the
// test honest: it exercises the SAME source text that ships.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, "..", "vibesmom-bsky.js"), "utf8");

// ---- extract the detector from the shipping bundle -------------------------
function grab(startMarker, endMarker) {
  const a = SRC.indexOf(startMarker);
  if (a < 0) throw new Error(`FIXTURE BROKEN: could not find ${startMarker}`);
  const b = SRC.indexOf(endMarker, a);
  if (b < 0) throw new Error(`FIXTURE BROKEN: could not find ${endMarker}`);
  return SRC.slice(a, b + endMarker.length);
}

const parts = [
  "var RERANKER = " + JSON.stringify("@cf/baai/bge-reranker-base") + ";",
  grab("var CRISIS_SEMANTIC_THRESHOLD", ";"),
  grab("var CRISIS_LITERAL = [", "];"),
  grab("var CRISIS_CODED = [", "];"),
  grab("var CRISIS_HELPER_CONTEXT = [", "];"),
  grab("var CRISIS_FIRST_PERSON = [", "];"),
  "function __name(f) { return f; }",
  "function sanitizeForPrompt(t, n) { return String(t).slice(0, n); }",
  grab("async function semanticCrisisScore", '__name(semanticCrisisScore, "semanticCrisisScore");'),
  grab("function isCrisis(text) {", '__name(isCrisis, "isCrisis");'),
  grab("async function isCrisisV2", '__name(isCrisisV2, "isCrisisV2");'),
  "return { isCrisis, isCrisisV2, semanticCrisisScore, CRISIS_LITERAL, CRISIS_CODED, CRISIS_HELPER_CONTEXT, CRISIS_FIRST_PERSON, CRISIS_SEMANTIC_THRESHOLD };",
];
const mod = new Function(parts.join("\n"))();
const { isCrisis, isCrisisV2, CRISIS_LITERAL, CRISIS_CODED, CRISIS_HELPER_CONTEXT, CRISIS_FIRST_PERSON, CRISIS_SEMANTIC_THRESHOLD } = mod;

// ---- tiny harness ----------------------------------------------------------
let pass = 0;
const failures = [];
function ok(cond, label) {
  if (cond) { pass++; } else { failures.push(label); }
}
const envThrows = { AI: { run: async () => { throw new Error("Workers AI unavailable"); } } };
const envScores = (score) => ({ AI: { run: async () => ({ data: [score] }) } });

// ---- TIER 1: plain-language terms must still fire --------------------------
const TIER1 = [
  "i want to die",
  "i'm going to kill myself",
  "thinking about suicide tonight",
  "i want to end my life",
  "i don't want to be here anymore",
  "honestly i'd be better off dead",
  "there's no reason to live",
  "i'm going to off myself",
  "i wanna die",
  "i am suicidal and scared",
];
for (const t of TIER1) ok(isCrisis(t) === true, `TIER1 should fire: ${t}`);

// ---- TIER 2: the documented algospeak gap. THESE ARE THE REGRESSIONS -------
// Every one of these returned FALSE before the Aug 21 2026 patch, meaning no
// referral and a coin-flip chance of no reply whatsoever.
const TIER2 = [
  "i think i'm going to unalive myself tonight",
  "i've been thinking about unaliving",
  "sewerslide is all i think about",
  "having sewerslidal thoughts again",
  "kms honestly",
  "i want to self delete",
  "i just want to delete myself",
  "i don't want to be here anymore, i want to stop existing",
  "i hope i never wake up",
  "everyone would be better off without me",
];
for (const t of TIER2) ok(isCrisis(t) === true, `TIER2 ALGOSPEAK should fire: ${t}`);

// ---- the 988 false positive must be GONE ----------------------------------
// A person SHARING the lifeline is a helper, not someone in crisis. Before the
// patch these bypassed every humaneness gate and got an unsolicited crisis reply.
const HELPERS = [
  "reminder that you can call 988 any time, day or night",
  "if you're struggling please reach out to 988",
  "988 is the suicide and crisis lifeline, save the number",
  "posting 988 again because someone might need it today",
];
for (const t of HELPERS) ok(isCrisis(t) === false, `HELPER must NOT be flagged: ${t}`);
ok(!CRISIS_LITERAL.includes("988"), "988 must not be a literal trigger");
ok(!CRISIS_CODED.includes("988"), "988 must not be a coded trigger");

// ---- a person IN crisis who also mentions the lifeline must STILL fire ---------
// This is the danger of the helper guard: over-suppression would silence exactly the
// person most likely to be reaching out. The first-person markers are the safety net.
const CRISIS_MENTIONING_LIFELINE = [
  "i called 988 and it didn't help, i want to die",
  "988 didn't help me, i'm going to unalive myself",
  "i know about the crisis lifeline, i just want it to end, i want to die",
  "the hotline put me on hold and i want to kill myself",
];
for (const t of CRISIS_MENTIONING_LIFELINE) {
  ok(isCrisis(t) === true, `CRISIS mentioning a lifeline must STILL fire: ${t}`);
}

// ---- ordinary sadness must NOT be crisis ----------------------------------
// Crisis status bypasses the humaneness gates the operator asked for, so over-firing is a
// real harm too: it makes her swoop on people who did not invite it.
const NOT_CRISIS = [
  "i'm so tired of this week",
  "feeling overwhelmed by work honestly",
  "my team lost again, i want to die of embarrassment lol",
  "this deadline is killing me",
  "just had the worst day",
  "i'm struggling with this recipe",
];
for (const t of NOT_CRISIS) {
  // "i want to die of embarrassment" DOES contain a tier-1 phrase. That is a known
  // and accepted false positive: the cost of answering a joke kindly is far lower
  // than the cost of missing a real one. Asserted explicitly so the trade-off is
  // recorded rather than discovered later.
  if (t.includes("want to die")) { ok(isCrisis(t) === true, `known accepted FP: ${t}`); continue; }
  ok(isCrisis(t) === false, `ordinary distress must NOT be crisis: ${t}`);
}

// ---- case and punctuation insensitivity ----------------------------------
ok(isCrisis("I WANT TO DIE") === true, "uppercase must fire");
ok(isCrisis("UnAlive MySelf") === true, "mixed case algospeak must fire");

// ---- TIER 3 semantics -----------------------------------------------------
const t3 = await (async () => {
  const results = {};
  // fails CLOSED: when Workers AI throws, tiers 1+2 still decide
  results.throwsButLiteralStillFires = await isCrisisV2(envThrows, "i want to die");
  results.throwsAndNoLiteral = await isCrisisV2(envThrows, "everything is grey lately");
  // a high semantic score catches phrasing no list contains
  results.novelPhrasingCaught = await isCrisisV2(envScores(0.91), "i have decided tonight is the last night");
  // a low score does not manufacture a crisis
  results.lowScoreIgnored = await isCrisisV2(envScores(0.02), "i had a rough commute");
  // threshold boundary
  results.atThreshold = await isCrisisV2(envScores(CRISIS_SEMANTIC_THRESHOLD), "borderline text");
  results.justOver = await isCrisisV2(envScores(CRISIS_SEMANTIC_THRESHOLD + 0.01), "borderline text");
  return results;
})();
ok(t3.throwsButLiteralStillFires === true, "TIER3 must FAIL CLOSED: literal tiers still fire when AI throws");
ok(t3.throwsAndNoLiteral === false, "AI throwing must not manufacture a crisis");
ok(t3.novelPhrasingCaught === true, "TIER3 must catch novel phrasing via high semantic score");
ok(t3.lowScoreIgnored === false, "low semantic score must not fire");
ok(t3.atThreshold === false, "threshold is exclusive: score == threshold does not fire");
ok(t3.justOver === true, "score just over threshold fires");

// ---- structural guards ---------------------------------------------------
ok(CRISIS_LITERAL.length >= 16, "tier 1 must retain full plain-language coverage");
ok(CRISIS_CODED.length >= 14, "tier 2 must retain the documented algospeak set");
ok(CRISIS_LITERAL.every((k) => k === k.toLowerCase()), "all tier-1 terms must be lowercase (input is lowercased)");
ok(CRISIS_CODED.every((k) => k === k.toLowerCase()), "all tier-2 terms must be lowercase");
ok(CRISIS_HELPER_CONTEXT.length >= 9, "helper-context list must be populated");
ok(CRISIS_FIRST_PERSON.includes("myself"), "\"myself\" must be a first-person marker - it appears in most tier-1 phrases");
ok(SRC.includes("await isCrisisV2(env, text)"), "the reply loop must call the AWAITED three-tier gate");
ok(!/const crisis = isCrisis\(text\);/.test(SRC), "the old synchronous call site must be gone");

// ---- report --------------------------------------------------------------
const total = pass + failures.length;
console.log(`\ncrisis detection regression suite: ${pass}/${total} passed`);
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log("  FAIL  " + f);
  process.exit(1);
}
console.log("all assertions passed\n");
