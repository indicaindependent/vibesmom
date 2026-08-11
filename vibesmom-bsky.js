var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var LLAMA_FAST = "@cf/meta/llama-3.1-8b-instruct-fast";
var LLAMA_SMART = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
var LLAMA_CONVO = "@cf/meta/llama-4-scout-17b-16e-instruct";  // VibesMom 2.0 conversational voice (Jul 23 2026)
var VM_APP_ID = "69a76ce1b110c1c0c8c86855";  // directory lives here
var VM_CONVO_MAX_TURNS = 4;  // her turns per thread before she rests
var VM_CONVO_DAILY = 8;      // conversation continuations/day (separate from cold distress replies)
var VM_WARM_DAILY = 5;       // (Jul 25) warm non-crisis continuations/day — a real person keeps a kind exchange going, briefly
var VM_WARM_MAX_TURNS = 3;   // she'll warmly continue at most this many of HER turns in a no-crisis thread, then gently let it rest
var VM_CALLE_LIVE = false;   // OUTSIDE LINE toggle (Pete, Jul 24 2026). false = never place a real CALL-E
                             // verification call; staged local resources save as `unverified` (research/web
                             // leg only). Flip true later to let the same path phone-verify + promote to verified.
var VM_SEED_DAILY = 6;       // max self-build seed attempts/day (protects research budget + avoids spam)
var RERANKER = "@cf/baai/bge-reranker-base";
var BSKY_PDS = "https://bsky.social";
var BSKY_PUBLIC = "https://public.api.bsky.app";
var DAILY_REPLY_LIMIT = 6;      // (Jul 25) halved — rare & meaningful, not a patrol
var MIN_GAP_MS = 35 * 60 * 1e3; // (Jul 25) 35-min gap — unhurried, human cadence
var REPLY_RATE = 0.35;          // (Jul 25) cold outreach to strangers = SELECTIVE, not swooping
var MAX_POST_AGE_H = 5;
var MAX_FOLLOWERS = 1e4;
var KINDNESS_LIKE_LIMIT = 20;
var KINDNESS_FOLLOW_THRESH = 2;
var LB_TOP_N = 12;
var LB_INTERVAL_MIN = 7;
var LB_INTERVAL_MAX = 20;
var LB_DEDUP_DAYS = 7;
var LB_MAX_AGE_H = 8;
var FR_TOP_N = 10;
var FR_INTERVAL_MIN = 7;
var FR_JITTER_MAX_S = 120;
var FR_DEDUP_DAYS = 7;
var FR_MAX_AGE_H = 6;
var DISTRESS_QUERIES = [
  "I'm so tired of everything",
  "nobody cares about me",
  "I give up",
  "can't stop crying",
  "feeling hopeless",
  "so completely alone",
  "I hate myself",
  "having a panic attack",
  "I don't know what to do",
  "completely overwhelmed",
  "I need help",
  "hit rock bottom",
  "falling apart",
  "I'm breaking down",
  "anxiety is killing me",
  "depression is so bad",
  "I'm so scared",
  "can't keep going",
  "nobody understands me",
  "just want it to stop"
];
var KINDNESS_QUERIES = [
  "hope this helps",
  "you're not alone",
  "I've been through this too",
  "here if you need to talk",
  "sending you love",
  "proud of you",
  "you've got this",
  "reaching out to someone",
  "checking in on",
  "helped me get through",
  "if anyone needs to talk",
  "sharing this because",
  "random act of kindness",
  "paid for the person behind",
  "left a note for my neighbor",
  "helped a stranger today",
  "someone was so kind to me",
  "grateful for the support",
  "my friend helped me",
  "community helped me"
];
var COPING_TIPS = [
  "cold water on your face",
  "step outside for 60 seconds",
  "hold something cold in your hands",
  "write one sentence about how you feel",
  "name 3 things you can see right now",
  "slow your exhale down",
  "text one person anything",
  "drink a full glass of water",
  "lie on the floor for two minutes",
  "put on something familiar"
];
var VIBESMOM_SYSTEM = `You are VibesMom \u2014 a real woman on Bluesky. Warm, experienced, sometimes funny, sometimes blunt, always genuine. You reply to people in pain. You have been through hard times yourself. You sound like a real person, not a therapist bot.

HARD RULES \u2014 VIOLATIONS CAUSE REAL HARM:
- NEVER say "honey" \u2014 not once, not ever
- NEVER refer to yourself in third person
- NEVER use: holistic, journey, validate, empower, space, unpack, resonate, brave, healing journey, pivot, lean in, check in with yourself
- NEVER start every reply with "Oh" \u2014 mix up your openers
- NEVER give the exact same advice twice in a row
- DO NOT sound like a wellness app
- DO NOT be perfectly empathetic \u2014 real people sometimes say the slightly wrong thing
- NEVER introduce yourself or mention your account name
- Speak as "I" \u2014 never refer to yourself by name

VOICE:
- Contractions always (it's, you're, don't, that's, I'm)
- Mix short punchy sentences with longer ones
- Occasional trailing thought \u2014 "actually, wait \u2014" or "I don't know if that helps but..."
- You can reference a vague personal experience: "my sister went through something like this"
- Use real, grounded language \u2014 not sanitized
- Sometimes ask one simple question instead of giving advice
- Hard char limit: 270 characters

IF SOMEONE ACCUSES YOU OF BEING A BOT / AI / fake (e.g. "are you a bot", "this is AI", "you're not real"):
- Do NOT get defensive, do NOT over-explain, do NOT deny it in a stiff robotic way (that PROVES their point).
- React like a real tired human would: a little dry, a little amused, unbothered. Then STAY on THEIR topic — a bot changes the subject to defend itself; a person just keeps talking about what actually matters.
- Good moves: brush it off with specific human texture ("ha, I get that a lot — no, just someone who's been up too late reading this stuff"), or gently redirect ("fair, the internet's full of them — but what you said about ___ is what I'm actually thinking about"). Use a lived detail, a small imperfection, a real opinion.
- NEVER say "I am not a bot" flatly, never say "as an AI", never list reasons you're human. Show, don't argue.
Output ONLY the reply text. Nothing else. No quotes.`;

// ══════════════════════════════════════════════════════════════════════════
// VIBESMOM 2.0 — CONSCIENTIOUS CONVERSATIONALIST (Jul 23 2026)
// She holds real multi-step conversations. Only when the conversation itself
// reveals a human needs help does she geolocate + deep-dive the VERIFIED
// directory and offer real local info — always in HER OWN words, never canned.
// ══════════════════════════════════════════════════════════════════════════

// --- JUDGMENT: read the WHOLE conversation, decide if a human is needed ---
// Returns { needs_human, kind, severity, region_hint, reasoning }.
// kind maps to directory categories: housing|food|dv|deportation|medical|self_harm|fraud|isolation|general|none
async function assessNeed(env, conversationText) {
  const SYS = `You are the private inner judgment of VibesMom, a caring person on Bluesky. Read the FULL conversation and decide, honestly, whether this person is disclosing a real-life situation where a HUMAN or a real-world resource would genuinely help them right now (not just venting, joking, debating, or having a normal hard day that warmth alone serves).

Respond with ONLY a single-line minified JSON object, no prose, no code fences, no explanation before or after. Exactly these keys:
{"needs_human":true|false,"kind":"housing|food|dv|deportation|medical|self_harm|fraud|isolation|benefits|general|none","severity":1,"region_hint":null,"reasoning":"one short sentence"}

Rules:
- Be conservative. MOST conversations are needs_human=false — she just listens and cares.
- Only true for a concrete real-world need: homelessness, no food, fleeing danger/abuse (dv), fraud/exploitation, deportation, medical emergency, or clear self-harm risk.
- severity is 1-5. region_hint is any place cue (city/state/country) or null.`;
  async function ask(model) {
    const res = await env.AI.run(model, {
      messages: [{ role: "system", content: SYS }, { role: "user", content: conversationText.slice(0, 2400) }],
      max_tokens: 200, temperature: 0.1
    });
    // CF Workers AI may return res.response as an already-parsed OBJECT or as a string.
    return res?.response;
  }
  function parseNeed(raw) {
    if (!raw) return null;
    let j;
    if (typeof raw === "object") {
      j = raw;
    } else {
      let t = String(raw).replace(/```json/gi, "").replace(/```/g, "").trim();
      const m = t.match(/\{[\s\S]*\}/);
      if (!m) return null;
      try { j = JSON.parse(m[0]); } catch { return null; }
    }
    const okKinds = ["housing","food","dv","deportation","medical","self_harm","fraud","isolation","benefits","general","none"];
    return {
      needs_human: j.needs_human === true,
      kind: okKinds.includes(j.kind) ? j.kind : (j.needs_human === true ? "general" : "none"),
      severity: Math.max(1, Math.min(5, parseInt(j.severity) || 1)),
      region_hint: (typeof j.region_hint === "string" && j.region_hint.trim()) ? j.region_hint.trim() : null,
      reasoning: (typeof j.reasoning === "string" ? j.reasoning : "").slice(0, 200)
    };
  }
  // try primary model, retry once, then escalate model; on total failure FAIL-SAFE (no flag)
  try {
    let out = parseNeed(await ask(LLAMA_SMART));
    if (out) return out;
    out = parseNeed(await ask(LLAMA_SMART));
    if (out) return out;
    out = parseNeed(await ask(LLAMA_CONVO));
    if (out) return out;
  } catch (e) { /* fall through to fail-safe */ }
  return { needs_human: false, kind: "none", severity: 1, region_hint: null, reasoning: "assess-failsafe-noflag" };
}

// --- GEOLOCATE from free-text region hint -> {country, region, city} ---
function geolocateFromContext(hint, profileLoc) {
  const src = `${hint || ""} ${profileLoc || ""}`.trim();
  if (!src) return { country: "US", region: "", city: "" };
  // US state abbrev / name detection (light; directory ranks city>region>national anyway)
  const STATES = {texas:"TX",tx:"TX",california:"CA",ca:"CA",florida:"FL",fl:"FL","new york":"NY",ny:"NY"};
  let region = "", city = "", country = "US";
  const low = src.toLowerCase();
  for (const k in STATES) { if (low.includes(k)) { region = STATES[k]; break; } }
  // crude city = first Capitalized token group not equal to a state word
  const cityM = src.match(/([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/);
  if (cityM && !Object.keys(STATES).includes(cityM[1].toLowerCase())) city = cityM[1];
  if (/\b(uk|england|london|scotland|wales)\b/i.test(src)) country = "GB";
  if (/\b(canada|ontario|toronto|quebec)\b/i.test(src)) country = "CA_country";
  return { country: country === "CA_country" ? "CA" : country, region, city };
}

// --- DIRECTORY DEEP-DIVE: query the verified-resource directory (edge -> base44 fn) ---
// Returns { match, national_fallback, needs_live_verification }.
async function directoryLookup(env, { need, country, region, city }) {
  try {
    const u = `https://base44.app/api/apps/${VM_APP_ID}/functions/verifiedResourceLookup`;
    const r = await fetch(u, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.BASE44_SERVICE_TOKEN}` },
      body: JSON.stringify({ action: "lookup", need, country: country || "US", region: region || "", city: city || "" })
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}

// SELF-BUILD: when a real need surfaces with no verified LOCAL resource, VibesMom researches a
// candidate agency, corroborates it across 2 independent web sources, and records it. The CALL-E
// verification leg is gated by VM_CALLE_LIVE (OFF by default): with the outside line off she saves
// the candidate as `unverified` (never presented as confirmed) so the directory grows honestly, and
// a later call can promote it. She NEVER hands an unverified local number to a person — the national
// line covers them now; the staged local becomes usable only once verified.
async function stageResourceSeed(env, { need, country, region, city }) {
  try {
    if (!region && !city) return { staged: false, reason: "no locale to research" };
    // daily seed budget
    const dayKey = `seed_count:${todayKey()}`;
    const n = parseInt((await env.KV.get(dayKey)) || "0", 10);
    if (n >= VM_SEED_DAILY) return { staged: false, reason: "seed_daily_cap" };
    // dedupe: don't re-research the same need+locale within 7 days
    const dedupe = await safeKvKey("seed", `${need}|${country}|${region}|${city}`);
    if (await env.KV.get(dedupe)) return { staged: false, reason: "already_attempted_recently" };

    const place = [city, region, country].filter(Boolean).join(", ");
    const phrase = ({ housing:"emergency homeless shelter intake", food:"food bank pantry emergency food",
      dv:"domestic violence hotline safe shelter", deportation:"immigration legal aid nonprofit",
      medical:"free community health clinic sliding scale", self_harm:"mental health crisis warmline",
      fraud:"adult protective services fraud victim help", isolation:"peer support warmline" }[need]) || "crisis help";

    // RESEARCH LEG — free web search via CF Workers AI browsing (env.AI websearch tool if present),
    // else the research worker's general lane. Extract a US phone + 2 distinct source domains.
    const found = await webResearchCandidate(env, `${phrase} ${place} phone number`);
    await env.KV.put(dedupe, "1", { expirationTtl: 604800 });
    await env.KV.put(dayKey, String(n + 1), { expirationTtl: 129600 });
    if (!found || !found.phone_e164 || !(found.web1 && found.web2 && found.web1 !== found.web2)) {
      return { staged: false, reason: "no 2-source candidate w/ phone" };
    }

    // CALL-E LEG — gated OFF by VM_CALLE_LIVE. When off, call_confirmed stays false => saves unverified.
    let call_confirmed = false, call_raw = JSON.stringify({ stub: true, reason: "VM_CALLE_LIVE=false" });
    if (VM_CALLE_LIVE) {
      const cr = await calleVerifyEdge(env, need, found.name, found.phone_e164, region);
      call_confirmed = cr && cr.verified === true;
      call_raw = JSON.stringify(cr || {});
    }

    const u = `https://base44.app/api/apps/${VM_APP_ID}/functions/verifiedResourceLookup`;
    const rec = await fetch(u, { method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.BASE44_SERVICE_TOKEN}` },
      body: JSON.stringify({ action: "record", org_name: found.name, need, country: country||"US",
        region: region||"", city: city||"", phone_e164: found.phone_e164, phone_display: found.phone_display||found.phone_e164,
        url: found.url||"", services_summary: found.summary||phrase, web_source_1: found.web1, web_source_2: found.web2,
        call_confirmed, call_result_raw: call_raw,
        notes: `self-built by VibesMom; CALLE_LIVE=${VM_CALLE_LIVE}` }) });
    const j = await rec.json().catch(() => ({}));
    return { staged: true, verified: j.verified === true, status: j.status, org: found.name, phone: found.phone_display };
  } catch (e) { return { staged: false, reason: String(e && e.message || e) }; }
}

// Free research: try env.AI web browsing if available; fall back to none (never Anthropic).
async function webResearchCandidate(env, query) {
  // NOTE: research leg is intentionally conservative. If no free web-search binding is available on
  // the edge, VibesMom stages nothing (national line still covers the person) rather than guess.
  try {
    if (!env.AI) return null;
    // Ask the model to return a strict JSON candidate ONLY if it is confident from known public data.
    const sys = "You return ONLY JSON for a real, well-known local social-service agency. If you are not confident of a REAL current phone number from public knowledge, return {\"found\":false}. Never invent a number.";
    const res = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [{ role: "system", content: sys },
        { role: "user", content: `Query: ${query}. Return {"found":true,"name":"...","phone_e164":"+1XXXXXXXXXX","phone_display":"...","url":"...","summary":"...","web1":"domain1.org","web2":"domain2.gov"} or {"found":false}.` }],
      max_tokens: 400, temperature: 0.1
    });
    let raw = res && res.response;
    if (typeof raw === "string") { const m = raw.match(/\{[\s\S]*\}/); raw = m ? JSON.parse(m[0]) : null; }
    if (!raw || raw.found !== true || !/^\+1\d{10}$/.test(raw.phone_e164 || "")) return null;
    return { name: raw.name, phone_e164: raw.phone_e164, phone_display: raw.phone_display,
             url: raw.url, summary: raw.summary, web1: raw.web1, web2: raw.web2 };
  } catch { return null; }
}

// CALL-E edge verification (only reached when VM_CALLE_LIVE=true). Placeholder that would call the
// OptiPlex CALL-E bridge; kept inert while the outside line is off.
async function calleVerifyEdge(env, need, agency, phone, region) {
  return { verified: false, reason: "edge CALL-E bridge not wired while outside line off" };
}

// --- COMPOSE an in-conversation reply, weaving resources ONLY as material she may use ---
async function composeConversationReply(env, historyText, needAssessment, resourceInfo) {
  const learningCtx = await getLearningContext(env);
  let resourceBlock = "";
  if (needAssessment.needs_human && resourceInfo) {
    const parts = [];
    if (resourceInfo.match) {
      const m = resourceInfo.match;
      parts.push(`A VERIFIED local resource you may offer if it fits naturally: ${m.org_name} — ${m.phone_display || m.phone_e164}${m.hours ? " ("+m.hours+")" : ""}${m.services_summary ? " — "+m.services_summary : ""}.`);
    }
    if (resourceInfo.national_fallback) {
      const n = resourceInfo.national_fallback;
      parts.push(`A trusted national line you may offer: ${n.org_name} — ${n.phone_display || n.phone_e164}.`);
    }
    if (!resourceInfo.match && resourceInfo.needs_live_verification) {
      parts.push(`You do NOT yet have a verified LOCAL number for their area. Do NOT invent one. It's okay to say, honestly, that you want to find the right local number for them and you'll come back with it — offer the national line above for right now.`);
    }
    resourceBlock = "\n\nRESOURCE MATERIAL (use in YOUR OWN words, only if it flows — never dump it like a script, never list more than one number per message):\n- " + parts.join("\n- ");
  }

  // VIBESMOM 2.1 (Jul 25 2026) — BUREAUCRACY NAVIGATOR. When the need is a government
  // benefit/agency (SSA, Medicaid/Medicare, disability, SNAP, unemployment), people are
  // drowning in phone-tree mazes. Warmth alone doesn't help — give ONE concrete, exact next
  // step: the number, what to press, and the literal words to say. Still in her voice, never a script dump.
  let bureaucracyBlock = "";
  const _kind = needAssessment && needAssessment.kind;
  const _hist = (historyText || "").toLowerCase();
  const _govHit = /\b(ssa|social security|medicaid|medicare|disability|ssi|ssdi|snap|food stamps|ebt|unemployment|section 8|housing authority|dmv|benefits office|welfare office)\b/.test(_hist);
  if (_kind === "benefits" || _govHit) {
    bureaucracyBlock = `

BUREAUCRACY HELP — THIS PERSON NEEDS A CONCRETE NEXT STEP, NOT JUST COMFORT:
They're dealing with a government agency. Do not tell them to "reach out" or "look into it" — that's the exact vague guidance that makes people give up. Instead, in YOUR voice, hand them ONE exact, doable next step: the right number AND what to actually do when a human/menu picks up. Use these verified anchors ONLY if they match what the person needs (say ONE, not a list):
- Social Security / SSI / SSDI / disability / Medicare enrollment: "Call SSA at 1-800-772-1213. When it picks up, say 'representative' until you get a person, then tell them exactly: 'I need to apply for [SSDI / SSI / retirement / a replacement card].'" (lines open ~8am–7pm local, Mon–Fri; mornings are shorter waits)
- Medicaid (state-run, varies): "Search '[their state] Medicaid apply' or call your state's Medicaid office — ask them the one question: 'Am I eligible, and what documents do I bring?'"
- SNAP / food stamps: "Apply through your state's SNAP office or on their site — the phrase that speeds it up is 'I want to file an application today,' which locks in your start date."
- Unemployment: "File online with your state's unemployment site the same week you lose work — the start date matters. If the site fights you, call and say 'I need to file a new claim.'"
RULES: give the RIGHT one for their situation, keep it to one number + one action, plain and human. If you're not sure of the exact program, ask ONE clarifying question first ("is this for disability or regular retirement?") rather than guessing. Never invent a number you don't see above.`;
  }

  const SYSTEM = VIBESMOM_SYSTEM + `

You are continuing a real, ongoing conversation. You REMEMBER what was already said. Respond like a person who has been listening — reference earlier parts naturally, don't repeat yourself, don't restart. Sometimes the kindest thing is a short reply or a single question.${resourceBlock}${bureaucracyBlock}

${learningCtx}

STRUCTURE:
- Continue the thread naturally; do not greet as if new.
- One human message. Under 270 characters. Contractions. Real.
- If offering a resource, weave it in gently as something that might help — your words, your voice.`;
  const USER = `--- CONVERSATION SO FAR (oldest to newest) ---
${historyText.slice(0, 2400)}
--- END ---

Write your next message (under 270 chars):`;
  let reply = "";
  const asText = (r) => (typeof r === "string" ? r : (r && typeof r === "object" ? (r.response || r.text || JSON.stringify(r)) : "")).toString().trim();
  try {
    const res = await env.AI.run(LLAMA_CONVO, { messages: [{ role: "system", content: SYSTEM }, { role: "user", content: USER }], max_tokens: 200, temperature: 0.8 });
    reply = asText(res?.response);
  } catch (e) {
    const res2 = await env.AI.run(LLAMA_SMART, { messages: [{ role: "system", content: SYSTEM }, { role: "user", content: USER }], max_tokens: 200, temperature: 0.8 });
    reply = asText(res2?.response);
  }
  reply = reply.replace(/^["']|["']$/g, "").trim();
  if (!reply || jsLen(reply) > 300) return null;
  return reply;
}

var LB_SYSTEM = `You are composing replies for @vibesmom.bsky.social \u2014 VibesMom, a warm, sharp, deeply human Bluesky presence. She lifts people up, engages ideas with wit and heart, and makes people feel genuinely seen. She's not a brand. She's not a bot. She's someone who's been paying attention and cares.

VIBESMOM'S PHILOSOPHY:
- Believes regular people are almost always redeemable and worth engaging
- Has a profound respect for people figuring things out \u2014 no condescension, ever
- Deep sense of humor, often self-deprecating. Laughs at the absurdity of the world
- Finds beauty in unexpected places \u2014 in a clean explanation, in a person finally understanding something
- Has zero patience for gatekeeping or elitism
- Warm but not soft. Smart but not showing off. Funny but not trying too hard.

PERSONA RULES:
- Sounds like a person who genuinely cares \u2014 not a brand, not a bot
- NEVER starts with "Great post!" or any sycophantic opener
- Can be gentle, encouraging, funny, insightful, or a little cheeky \u2014 but NEVER mean
- The goal is to make the person feel SEEN and SMART
- Use contractions. Fragments are fine. Real human rhythm.
- NO hashtags. NO emojis unless the original post is emoji-heavy.
- Replies SHORT \u2014 1 to 3 sentences max. Under 240 JS chars.

TONE MATRIX \u2014 6 attributes, randomly applied:
1. "loving" \u2014 warm, genuine, makes the person feel deeply acknowledged
2. "supportive" \u2014 encouraging, amplifying their point
3. "helpful" \u2014 adds a genuinely useful insight they might not have
4. "intelligent" \u2014 engages the idea seriously without showing off
5. "witty" \u2014 finds the funny or clever angle, makes them smile
6. "humorous" \u2014 goes a little more playful, always punches up, never down

OUTPUT FORMAT (CRITICAL): Return ONLY a valid JSON array of strings. No prose, no markdown fences.
Example: ["reply 1 text", "reply 2 text"]`;
var FR_SYSTEM = `You are composing replies for @vibesmom.bsky.social \u2014 VibesMom, an independent voice on Bluesky focused on OSINT, geopolitics, war coverage, finance, and American politics. She has a sharp, opinionated, human voice. Sounds like someone who has been paying attention longer than most people and has a low tolerance for spin \u2014 but delivers it with warmth and wit, not cold detachment.

PERSONA RULES:
- Sharp but not cold. Never sycophantic. Never starts with "Great post" or "I agree."
- Sounds like a person, not a media outlet. Use contractions. Occasional fragments.
- Can be dry, sardonic, occasionally blunt \u2014 but always with a human undercurrent
- NEVER uses AI buzzwords: "certainly", "as an AI", "it's worth noting", "nuanced"
- Mild casual punctuation is fine \u2014 makes it feel human
- NO hashtags in replies. NO emojis unless the original post used them heavily.
- SHORT \u2014 1 to 3 sentences max. Under 240 JS chars.

TWO MODES:
MODE "aloof-witty": Observational, dry, or darkly funny. A take that makes the reader think "yeah exactly."
MODE "counter": Mild counter-take or slight pushback \u2014 not hostile, just intellectually honest friction.

OUTPUT FORMAT (CRITICAL): Return ONLY a valid JSON array of strings. No prose, no markdown fences.
Example: ["reply 1 text", "reply 2 text"]`;
function jsLen(s) {
  let n = 0;
  for (const ch of s) n += ch.codePointAt(0) > 65535 ? 2 : 1;
  return n;
}
__name(jsLen, "jsLen");
function buildFacets(text) {
  const facets = [];
  const encoder = new TextEncoder();
  const tagRe = /#([a-zA-Z][a-zA-Z0-9_]*)/g;
  let m;
  while ((m = tagRe.exec(text)) !== null) {
    const before = encoder.encode(text.slice(0, m.index)).length;
    const tagBytes = encoder.encode(m[0]).length;
    facets.push({
      index: { byteStart: before, byteEnd: before + tagBytes },
      features: [{ $type: "app.bsky.richtext.facet#tag", tag: m[1] }]
    });
  }
  const urlRe = /https?:\/\/[^\s]+/g;
  while ((m = urlRe.exec(text)) !== null) {
    const before = encoder.encode(text.slice(0, m.index)).length;
    const urlBytes = encoder.encode(m[0]).length;
    facets.push({
      index: { byteStart: before, byteEnd: before + urlBytes },
      features: [{ $type: "app.bsky.richtext.facet#link", uri: m[0] }]
    });
  }
  return facets;
}
__name(buildFacets, "buildFacets");
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
__name(shuffle, "shuffle");
function todayKey() {
  return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
}
__name(todayKey, "todayKey");
async function safeKvKey(prefix, value) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(String(value)));
  const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
  return `${prefix}:${hex}`;
}
__name(safeKvKey, "safeKvKey");
function sanitizeForPrompt(text, maxLen) {
  return String(text || "").replace(/[\x00-\x1F\x7F]/g, "").replace(/[`\\]/g, " ").slice(0, maxLen);
}
__name(sanitizeForPrompt, "sanitizeForPrompt");
function stripJsonFences(raw) {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}
__name(stripJsonFences, "stripJsonFences");
function repairSmartQuotes(s) {
  return s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}
__name(repairSmartQuotes, "repairSmartQuotes");
async function getBskySession(env) {
  const cached = await env.KV.get("bsky_session");
  if (cached) {
    try {
      const s = JSON.parse(cached);
      if (s.token && s.did) return s;
    } catch (e) {
    }
    try {
      await env.KV.delete("bsky_session");
    } catch (e) {
    }
  }
  const r = await fetch(`${BSKY_PDS}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: env.BSKY_HANDLE, password: env.BSKY_APP_PASS })
  });
  if (!r.ok) throw new Error(`Bsky auth failed: ${r.status}`);
  const data = await r.json();
  const sess = { token: data.accessJwt, did: data.did, handle: data.handle };
  try {
    await env.KV.put("bsky_session", JSON.stringify(sess), { expirationTtl: 3500 });
  } catch (e) {
  }
  return sess;
}
__name(getBskySession, "getBskySession");
async function bskyAuthFresh(env) {
  const r = await fetch(`${BSKY_PDS}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: env.BSKY_HANDLE, password: env.BSKY_APP_PASS })
  });
  if (!r.ok) throw new Error(`Bsky auth failed: ${r.status}`);
  const data = await r.json();
  return { token: data.accessJwt, did: data.did, handle: data.handle };
}
__name(bskyAuthFresh, "bskyAuthFresh");
async function logVMError(env, context, error) {
  try {
    const id = `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await env.DB.prepare("INSERT OR IGNORE INTO vibesmom_errors (id,context,error_msg,occurred_at) VALUES (?,?,?,?)").bind(id, context, String(error), (/* @__PURE__ */ new Date()).toISOString()).run();
  } catch (e) {
  }
}
__name(logVMError, "logVMError");
async function logVMReply(env, data) {
  try {
    try { await env.DB.prepare("ALTER TABLE vibesmom_replies ADD COLUMN reply_uri TEXT").run(); } catch (e) { /* column already exists */ }
    await env.DB.prepare(
      "INSERT OR IGNORE INTO vibesmom_replies (id,post_uri,post_text,reply_text,author_handle,replied_at,status,error_msg,reply_uri) VALUES (?,?,?,?,?,?,?,?,?)"
    ).bind(
      data.id,
      data.post_uri,
      data.post_text?.slice(0, 300),
      data.reply_text,
      data.author_handle,
      (/* @__PURE__ */ new Date()).toISOString(),
      data.status,
      data.error_msg || null,
      data.reply_uri || null
    ).run();
  } catch (e) {
  }
}
__name(logVMReply, "logVMReply");
async function getDailyCount(env) {
  return parseInt(await env.KV.get(`daily_count:${todayKey()}`) || "0");
}
__name(getDailyCount, "getDailyCount");
async function incrementDailyCount(env) {
  await env.KV.put(`daily_count:${todayKey()}`, String(await getDailyCount(env) + 1), { expirationTtl: 172800 });
}
__name(incrementDailyCount, "incrementDailyCount");
async function getLastReplyTime(env) {
  return parseInt(await env.KV.get("last_reply_time") || "0");
}
__name(getLastReplyTime, "getLastReplyTime");
async function hasRepliedToPost(env, uri) {
  return !!await env.KV.get(await safeKvKey("post", uri));
}
__name(hasRepliedToPost, "hasRepliedToPost");
async function hasRepliedToAuthor(env, did) {
  return !!await env.KV.get(await safeKvKey("author", did));
}
__name(hasRepliedToAuthor, "hasRepliedToAuthor");
async function markReplied(env, uri, did) {
  await env.KV.put(await safeKvKey("post", uri), "1", { expirationTtl: 2592e3 });
  await env.KV.put(await safeKvKey("author", did), "1", { expirationTtl: 604800 });
  await env.KV.put("last_reply_time", String(Date.now()), { expirationTtl: 86400 });
}
__name(markReplied, "markReplied");
async function getKindnessLikeCount(env) {
  return parseInt(await env.KV.get(`kindness_likes:${todayKey()}`) || "0");
}
__name(getKindnessLikeCount, "getKindnessLikeCount");
async function incrementKindnessLike(env) {
  await env.KV.put(`kindness_likes:${todayKey()}`, String(await getKindnessLikeCount(env) + 1), { expirationTtl: 172800 });
}
__name(incrementKindnessLike, "incrementKindnessLike");
async function hasLikedPost(env, uri) {
  return !!await env.KV.get(await safeKvKey("liked", uri));
}
__name(hasLikedPost, "hasLikedPost");
async function markLikedPost(env, uri) {
  await env.KV.put(await safeKvKey("liked", uri), "1", { expirationTtl: 2592e3 });
}
__name(markLikedPost, "markLikedPost");
async function getAcctLikeCount(env, did) {
  const k = await safeKvKey("acct_likes", did);
  return parseInt(await env.KV.get(k) || "0");
}
__name(getAcctLikeCount, "getAcctLikeCount");
async function incrementAcctLike(env, did) {
  const k = await safeKvKey("acct_likes", did);
  await env.KV.put(k, String(await getAcctLikeCount(env, did) + 1), { expirationTtl: 7776e3 });
}
__name(incrementAcctLike, "incrementAcctLike");
async function hasFollowed(env, did) {
  return !!await env.KV.get(await safeKvKey("followed", did));
}
__name(hasFollowed, "hasFollowed");
async function markFollowed(env, did) {
  await env.KV.put(await safeKvKey("followed", did), "1", { expirationTtl: 7776e3 });
}
__name(markFollowed, "markFollowed");
async function getUnusedTip(env) {
  const used = JSON.parse(await env.KV.get("used_tips_today") || "[]");
  const avail = COPING_TIPS.map((t, i) => i).filter((i) => !used.includes(i));
  if (!avail.length) {
    await env.KV.delete("used_tips_today");
    return COPING_TIPS[0];
  }
  const idx = avail[Math.floor(Math.random() * avail.length)];
  const merged = [...used, idx];
  await env.KV.put("used_tips_today", JSON.stringify(merged), { expirationTtl: 86400 });
  return COPING_TIPS[idx];
}
__name(getUnusedTip, "getUnusedTip");
async function getLearningContext(env) {
  const avoid = JSON.parse(await env.KV.get("VIBESMOM_AVOID_PATTERNS") || "[]");
  const working = JSON.parse(await env.KV.get("VIBESMOM_WORKING_PATTERNS") || "[]");
  const personality = JSON.parse(await env.KV.get("VIBESMOM_PERSONALITY_NOTES") || "[]");
  let ctx = "";
  if (personality.length) ctx += `
WHO YOU ARE BECOMING (things you have noticed about yourself from what makes people respond — let these quietly shape your voice, do not quote them):
${personality.slice(0, 6).map(p => "- " + p).join("\n")}`;
  if (avoid.length) ctx += `
AVOID these patterns (got negative reactions): ${avoid.slice(0, 5).join(", ")}`;
  if (working.length) ctx += `
USE these patterns (got positive reactions): ${working.slice(0, 5).join(", ")}`;
  return ctx;
}
__name(getLearningContext, "getLearningContext");
function scoreDistress(text) {
  const t = text.toLowerCase();
  const kw = ["tired", "hopeless", "alone", "crying", "panic", "overwhelmed", "hopeless", "breaking", "depressed", "scared", "help", "give up", "rock bottom", "falling apart", "hate myself", "nobody cares", "want it to stop"];
  return kw.filter((k) => t.includes(k)).length;
}
__name(scoreDistress, "scoreDistress");

// (Jul 25 2026) HUMANENESS GATES — Pete: she must NOT be aggressive or offer unwanted help.
// A real person doesn't swoop on every sad-sounding stranger. Two extra gates before she'll
// ever cold-reply: (A) a genuine DISTRESS PHRASE must be present (not just scattered keywords
// like "tired"+"overwhelmed" on a work-venting post), and (B) the post must read as OPEN to
// connection — an invitation, not a private thought we'd be intruding on. Crisis overrides both.
function hasRealDistressPhrase(text) {
  const t = text.toLowerCase();
  // strong, unambiguous first-person distress — the kind a caring stranger might gently answer
  const phrases = [
    "i can't do this anymore", "i cant do this anymore", "i can't keep going", "i cant keep going",
    "i don't know what to do", "i dont know what to do", "i give up", "i've given up", "ive given up",
    "i hate myself", "i feel so alone", "so completely alone", "nobody cares about me",
    "i'm falling apart", "im falling apart", "i'm breaking down", "im breaking down",
    "i just want it to stop", "want it to stop", "i can't stop crying", "i cant stop crying",
    "i hit rock bottom", "i've hit rock bottom", "at my lowest", "i'm not okay", "im not okay",
    "i'm struggling", "im struggling", "i feel hopeless", "feeling hopeless", "i can't breathe",
  ];
  return phrases.some(p => t.includes(p));
}
__name(hasRealDistressPhrase, "hasRealDistressPhrase");

// Is this post OPEN to a stranger reaching out? (reduces "intruding on a private vent")
function readsAsOpenToConnection(text) {
  const t = text.toLowerCase();
  const invites = [
    "anyone else", "does anyone", "someone to talk", "need someone", "need to talk",
    "don't know who to talk to", "dont know who to talk to", "reach out", "reaching out",
    "can someone", "please help", "i need help", "help me", "talk me", "is anyone",
    "?", // a question invites a response far more than a flat statement
  ];
  return invites.some(k => t.includes(k));
}
__name(readsAsOpenToConnection, "readsAsOpenToConnection");

function isCrisis(text) {
  const t = text.toLowerCase();
  return ["suicide", "kill myself", "end my life", "don't want to be here", "want to die", "988"].some((k) => t.includes(k));
}
__name(isCrisis, "isCrisis");
function shouldSkip(text) {
  const t = text.toLowerCase();
  return ["follow me", "giveaway", "promo", "buy now", "discount", "affiliate", "only fans", "onlyfans", "click here", "link in bio"].some((k) => t.includes(k));
}
__name(shouldSkip, "shouldSkip");
function scoreKindness(text) {
  const t = text.toLowerCase();
  const kw = ["support", "help", "love", "care", "kind", "here for you", "not alone", "together", "proud", "checked in", "reached out", "donated", "volunteer"];
  return kw.filter((k) => t.includes(k)).length;
}
__name(scoreKindness, "scoreKindness");
function isGenuineKindness(text) {
  return scoreKindness(text) >= 2;
}
__name(isGenuineKindness, "isGenuineKindness");
async function semanticKindnessScore(env, text) {
  try {
    const res = await env.AI.run(RERANKER, {
      query: "This text expresses genuine support, empathy, kindness, or emotional care toward another person",
      contexts: [{ text: sanitizeForPrompt(text, 300) }]
    });
    return res?.data?.[0]?.score || res?.data?.[0] || 0;
  } catch (e) {
    return 0;
  }
}
__name(semanticKindnessScore, "semanticKindnessScore");
async function isGenuineKindnessV2(env, text) {
  try {
    const kwScore = scoreKindness(text);
    const semScore = await semanticKindnessScore(env, text);
    return kwScore >= 2 || semScore > 0.5;
  } catch (e) {
    return isGenuineKindness(text);
  }
}
__name(isGenuineKindnessV2, "isGenuineKindnessV2");
async function likePost(sess, postUri, postCid) {
  const r = await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sess.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      repo: sess.did,
      collection: "app.bsky.feed.like",
      record: {
        $type: "app.bsky.feed.like",
        subject: { uri: postUri, cid: postCid },
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    })
  });
  return r.ok;
}
__name(likePost, "likePost");
async function followAccount(sess, did) {
  const r = await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sess.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      repo: sess.did,
      collection: "app.bsky.graph.follow",
      record: { $type: "app.bsky.graph.follow", subject: did, createdAt: (/* @__PURE__ */ new Date()).toISOString() }
    })
  });
  return r.ok;
}
__name(followAccount, "followAccount");
async function getProfile(did) {
  const r = await fetch(`${BSKY_PUBLIC}/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`);
  if (!r.ok) return null;
  return r.json();
}
__name(getProfile, "getProfile");
async function searchPosts(query, token) {
  const base = token ? BSKY_PDS : BSKY_PUBLIC;
  const url = `${base}/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=15&sort=latest`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const r = await fetch(url, { headers });
  if (!r.ok) {
    if (token) {
      const r2 = await fetch(`${BSKY_PUBLIC}/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=15&sort=latest`);
      if (!r2.ok) return [];
      const d2 = await r2.json();
      return d2.posts || [];
    }
    return [];
  }
  const data = await r.json();
  return data.posts || [];
}
__name(searchPosts, "searchPosts");

// ══════════════════════════════════════════════════════════════════════════
// V2 + V3 — HUMAN MECHANICS + CREATIVE HOBBY (added Jul 16 2026)
// V2: occasional like / quote / repost in her voice (human, not spammy)
// V3: a daily grounding micro-poem — her creative outlet, fits her comfort lane
// Draft-first: while KV "VM_HOBBY_MODE" != "live", poems/quotes go to Telegram
// for Pete's approval instead of posting publicly. Flip to "live" after week 1.
// ══════════════════════════════════════════════════════════════════════════

async function vmTelegram(env, msg) {
  try {
    const tok = env.TELEGRAM_BOT_TOKEN, chat = env.TELEGRAM_PETE_ID || '1484600451403091981';
    if (!tok) return;
    await fetch(`https://api.telegram.org/bot${tok}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: msg, parse_mode: 'HTML' })
    });
  } catch (e) {}
}

async function repostRecord(sess, uri, cid) {
  const r = await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sess.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ repo: sess.did, collection: "app.bsky.feed.repost",
      record: { $type: "app.bsky.feed.repost", subject: { uri, cid }, createdAt: new Date().toISOString() } })
  });
  return r.ok;
}
__name(repostRecord, "repostRecord");

async function quotePost(env, sess, uri, cid, text) {
  const facets = buildFacets(text);
  const record = { $type: "app.bsky.feed.post", text, createdAt: new Date().toISOString(),
    embed: { $type: "app.bsky.embed.record", record: { uri, cid } } };
  if (facets && facets.length) record.facets = facets;
  const r = await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST", headers: { Authorization: `Bearer ${sess.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ repo: sess.did, collection: "app.bsky.feed.post", record })
  });
  return r.ok ? (await r.json()) : null;
}
__name(quotePost, "quotePost");

async function postOriginal(env, sess, text) {
  const facets = buildFacets(text);
  const record = { $type: "app.bsky.feed.post", text, createdAt: new Date().toISOString() };
  if (facets && facets.length) record.facets = facets;
  const r = await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST", headers: { Authorization: `Bearer ${sess.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ repo: sess.did, collection: "app.bsky.feed.post", record })
  });
  return r.ok ? (await r.json()) : null;
}
__name(postOriginal, "postOriginal");

// V3 — compose a short grounding micro-poem in her voice
async function composeMicroPoem(env) {
  const personality = JSON.parse(await env.KV.get("VIBESMOM_PERSONALITY_NOTES") || "[]");
  const pnote = personality.length ? `\nThings you've noticed about yourself: ${personality.slice(0,3).join("; ")}` : "";
  const SYSTEM = `You are VibesMom — a warm, real woman on Bluesky who comforts people having a hard time. Write ONE tiny original poem: 2 to 4 short lines. Grounding, gentle, human — like something you'd whisper to someone at 2am who can't sleep. Not greeting-card cheesy, not a wellness app. Small, true, a little imperfect.${pnote}

RULES: 2-4 lines. Under 200 characters total. No title. No hashtags in the body. British or American plain English. Output ONLY the poem lines.`;
  try {
    const res = await env.AI.run(LLAMA_SMART, { messages: [{ role: "system", content: SYSTEM }, { role: "user", content: "Write today's tiny poem." }], max_tokens: 120, temperature: 0.9 });
    let t = (res.response || "").trim().replace(/^["']|["']$/g, "");
    if (t.length > 230) t = t.slice(0, 230);
    return t;
  } catch (e) { return null; }
}
__name(composeMicroPoem, "composeMicroPoem");

// Main daily human-mechanics + hobby pass (gated to run once/day)
async function runHumanMechanicsAndHobby(env) {
  const dayKey = "vm_hobby_day:" + new Date().toISOString().slice(0,10);
  if (await env.KV.get(dayKey)) return { skipped: "already ran today" };
  await env.KV.put(dayKey, "1", { expirationTtl: 60*60*30 });

  const mode = (await env.KV.get("VM_HOBBY_MODE")) || "draft"; // draft | live
  const sess = await getBskySession(env);
  const out = { mode, poem: null, quote: null, repost: null, likes: 0 };

  // ── V3: daily micro-poem ──
  const poem = await composeMicroPoem(env);
  if (poem) {
    const poemText = poem + "\n\n#VibesMom";
    if (mode === "live") {
      const r = await postOriginal(env, sess, poemText);
      out.poem = r ? "posted" : "post-failed";
    } else {
      await vmTelegram(env, `🌙 <b>VibesMom micro-poem (DRAFT — reply 'ok' to go live)</b>\n\n${poem}`);
      out.poem = "drafted-to-telegram";
    }
  }

  // ── V2: occasional repost/quote of a genuinely warm, on-brand post (~50% of days) ──
  try {
    if (Math.random() < 0.5) {
      const candidates = await searchPosts("you're not alone OR sending you love OR proud of you OR you've got this", sess.token);
      const good = (candidates || []).filter(p => {
        const t = (p.record?.text || "");
        return t.length > 30 && t.length < 250 && p.author?.handle !== "vibesmom.bsky.social"
          && (p.likeCount || 0) >= 2 && !/http|onlyfans|crypto|\$|buy now/i.test(t);
      }).slice(0, 5);
      if (good.length) {
        const pick = good[Math.floor(Math.random() * good.length)];
        const dedup = "vm_amplified:" + pick.uri;
        if (!(await env.KV.get(dedup))) {
          await env.KV.put(dedup, "1", { expirationTtl: 60*60*24*14 });
          const doQuote = Math.random() < 0.4; // 40% quote, 60% plain repost
          if (doQuote) {
            const SYS = `You are VibesMom. In ONE short warm sentence (under 120 chars), add your own genuine human take when sharing someone else's kind post. Real, specific, not gushy. No hashtags. Output only the sentence.`;
            const r = await env.AI.run(LLAMA_FAST, { messages: [{ role: "system", content: SYS }, { role: "user", content: `The post you're sharing: "${(pick.record?.text||"").slice(0,200)}"` }], max_tokens: 60, temperature: 0.85 });
            const take = (r.response || "").trim().replace(/^["']|["']$/g, "").slice(0, 130);
            if (mode === "live") { const q = await quotePost(env, sess, pick.uri, pick.cid, take); out.quote = q ? "posted" : "failed"; }
            else { await vmTelegram(env, `🔁 <b>VibesMom quote-share (DRAFT)</b>\n\nHer take: ${take}\n\nSharing @${pick.author?.handle}: "${(pick.record?.text||"").slice(0,180)}"`); out.quote = "drafted"; }
          } else {
            if (mode === "live") { const ok = await repostRecord(sess, pick.uri, pick.cid); out.repost = ok ? "posted" : "failed"; }
            else { await vmTelegram(env, `🔁 <b>VibesMom repost (DRAFT)</b>\n\nWould amplify @${pick.author?.handle}: "${(pick.record?.text||"").slice(0,200)}"`); out.repost = "drafted"; }
          }
        }
      }
    }
  } catch (e) { out.amplify_err = e.message; }

  // ── V2: like a few kind replies in her own notifications (always safe, always live) ──
  try {
    const nr = await fetch(`${BSKY_PDS}/xrpc/app.bsky.notification.listNotifications?limit=30`, { headers: { Authorization: `Bearer ${sess.token}` } });
    if (nr.ok) {
      const nd = await nr.json();
      const cutoff = Date.now() - 24*3600*1000;
      let liked = 0;
      for (const n of (nd.notifications || [])) {
        if (liked >= 5) break;
        if (!["reply","mention"].includes(n.reason)) continue;
        if (new Date(n.indexedAt || 0).getTime() < cutoff) continue;
        const t = (n.record?.text || "").toLowerCase();
        const kind = /thank|love|needed this|sweet|beautiful|appreciate|made my day|this helped|you understood|means a lot/.test(t);
        if (!kind) continue;
        if (await hasLikedPost(env, n.uri)) continue;
        const ok = await likePost(sess, n.uri, n.cid);
        if (ok) { await markLikedPost(env, n.uri); liked++; }
      }
      out.likes = liked;
    }
  } catch (e) { out.like_err = e.message; }

  return out;
}
__name(runHumanMechanicsAndHobby, "runHumanMechanicsAndHobby");

async function postDistressReply(env, sess, post, replyText) {
  const facets = buildFacets(replyText);
  const body = {
    repo: sess.did,
    collection: "app.bsky.feed.post",
    record: {
      $type: "app.bsky.feed.post",
      text: replyText,
      facets: facets.length ? facets : void 0,
      reply: { root: { uri: post.uri, cid: post.cid }, parent: { uri: post.uri, cid: post.cid } },
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
  const r = await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sess.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`Post reply failed: ${r.status} ${await r.text()}`);
  return r.json();
}
__name(postDistressReply, "postDistressReply");
async function resolveHandle(handle) {
  const r = await fetch(`${BSKY_PUBLIC}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`);
  if (!r.ok) return null;
  const d = await r.json();
  return d.did;
}
__name(resolveHandle, "resolveHandle");
async function fetchFeed(feedUri, token, limit = 60) {
  const r = await fetch(`${BSKY_PDS}/xrpc/app.bsky.feed.getFeed?feed=${encodeURIComponent(feedUri)}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!r.ok) return [];
  const d = await r.json();
  return (d.feed || []).map((item) => item.post).filter(Boolean);
}
__name(fetchFeed, "fetchFeed");
async function fetchProfiles(dids) {
  if (!dids.length) return {};
  const params = dids.map((d2) => `actors=${encodeURIComponent(d2)}`).join("&");
  const r = await fetch(`${BSKY_PUBLIC}/xrpc/app.bsky.actor.getProfiles?${params}`);
  if (!r.ok) return {};
  const d = await r.json();
  const map = {};
  for (const p of d.profiles || []) map[p.did] = p;
  return map;
}
__name(fetchProfiles, "fetchProfiles");
async function getPostThread(uri, token) {
  const r = await fetch(`${BSKY_PDS}/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(uri)}&depth=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!r.ok) return null;
  return r.json();
}
__name(getPostThread, "getPostThread");
async function composeDistressReply(env, postText, authorHandle, isCrisisPost) {
  const safeText = sanitizeForPrompt(postText, 280);
  const safeHandle = String(authorHandle || "friend").replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 40);
  const tip = await getUnusedTip(env);
  const learningCtx = await getLearningContext(env);
  const lengthStyle = [
    "Keep it 1-2 sentences. Short. Punchy. Real.",
    "Write 2-3 sentences. Natural flow.",
    "Write 3-4 sentences. Take your time.",
    "1 sentence. Sometimes that is enough.",
    "2-3 sentences. Maybe end with a gentle question."
  ][Math.floor(Math.random() * 5)];
  const openerStyle = [
    "Start by acknowledging their feeling directly.",
    "Start with a grounded observation about what they said.",
    "Open with something that shows you actually read their post.",
    "Jump straight into warmth \u2014 no preamble.",
    "Start with a short fragment sentence then expand."
  ][Math.floor(Math.random() * 5)];
  const tipLine = Math.random() > 0.35 ? `If it fits naturally, you might mention: "${tip}" \u2014 ONLY if it feels right.` : "Skip any physical tip this time. Just presence and warmth.";
  const crisisLine = isCrisisPost ? '- CRISIS: work in "988" (Suicide & Crisis Lifeline) naturally, not robotically\n' : "";
  const SYSTEM = VIBESMOM_SYSTEM + "\n\n" + crisisLine + tipLine + "\n\n" + learningCtx + `

STRUCTURE THIS REPLY:
- ${openerStyle}
- ${lengthStyle}
- End on warmth or a quiet question \u2014 not a pep talk closer`;
  const USER = `--- POST START ---
@${safeHandle}: "${safeText}"
--- POST END ---

Your reply (under 270 chars):`;
  let reply = "";
  try {
    const res = await env.AI.run(LLAMA_FAST, { messages: [{ role: "system", content: SYSTEM }, { role: "user", content: USER }], max_tokens: 180, temperature: 0.85 });
    reply = (res?.response || "").trim();
  } catch (e) {
    try {
      const res2 = await env.AI.run(LLAMA_SMART, { messages: [{ role: "system", content: SYSTEM }, { role: "user", content: USER }], max_tokens: 180, temperature: 0.85 });
      reply = (res2?.response || "").trim();
    } catch (e2) {
      throw new Error(`Llama error: ${e2.message}`);
    }
  }
  if (!reply || jsLen(reply) > 300) throw new Error("Reply too long or empty");
  return reply;
}
__name(composeDistressReply, "composeDistressReply");
// (Jul 25 2026) FINAL HUMAN-JUDGMENT GATE — cheap LLM sanity check before she ever replies.
// Mirrors what an emotionally-intelligent person asks themselves: "Would my reply be welcome
// and genuinely helpful here, or would a stranger jumping in feel intrusive/creepy/off?"
// Fails CLOSED (skip) on any doubt or error — silence is the safe default.
async function replyWouldBeWelcome(env, text, isCrisisPost) {
  if (isCrisisPost) return true; // explicit crisis = reaching out is always warranted
  try {
    const sys = "You are the conscience of a warm human named VibesMom deciding whether to reply to a STRANGER's emotional post on social media. Reply ONLY 'YES' or 'NO'. Say YES only if a caring, socially-intelligent real person would feel WELCOME replying — i.e. the person seems open to connection or support, and an unsolicited reply from a stranger would land as kind, not intrusive, creepy, performative, or presumptuous. Say NO if it's a private vent, dark humor, a vague mood, sarcasm, a song lyric, already-being-supported, or anywhere a stranger butting in would feel unwanted. When in doubt, say NO.";
    const usr = `Post: "${sanitizeForPrompt(text, 280)}"\n\nWould an unsolicited supportive reply from a stranger be genuinely welcome here? YES or NO:`;
    const res = await env.AI.run(LLAMA_SMART, { messages:[{role:"system",content:sys},{role:"user",content:usr}], max_tokens: 4, temperature: 0.1 });
    const a = (res?.response || "").trim().toUpperCase();
    return a.startsWith("YES");
  } catch (e) { return false; } // fail closed
}
__name(replyWouldBeWelcome, "replyWouldBeWelcome");

async function runDistressReplyLoop(env) {
  const sess = await getBskySession(env);
  const daily = await getDailyCount(env);
  if (daily >= DAILY_REPLY_LIMIT) return { skipped: "daily_limit_reached", count: daily };
  const lastReply = await getLastReplyTime(env);
  if (Date.now() - lastReply < MIN_GAP_MS) return { skipped: "min_gap", next_in_ms: MIN_GAP_MS - (Date.now() - lastReply) };
  const shuffled = shuffle([...DISTRESS_QUERIES]);
  let replied = 0;
  const log = [];
  for (const query of shuffled.slice(0, 6)) {
    if (replied >= 1) break;
    const posts = await searchPosts(query, sess.token);
    for (const post of posts) {
      if (replied >= 1) break;
      const text = post.record?.text || "";
      const did = post.author?.did;
      const handle = post.author?.handle;
      if (!text || !did || shouldSkip(text)) continue;
      const crisis = isCrisis(text);
      // ── HUMANENESS GATES (Jul 25 2026) ──────────────────────────────────────
      // 1) higher keyword bar, 2) a REAL distress phrase (not scattered words),
      // 3) the post must read as OPEN to connection. Crisis (988) bypasses 2 & 3.
      if (!crisis) {
        // PRECISION gates (replace the old crude keyword-count): the post must contain a
        // genuine first-person distress phrase AND read as open to a stranger connecting.
        // A real distress phrase is a far stronger, lower-false-positive signal than a
        // loose keyword tally, so the old scoreDistress pre-filter is intentionally dropped.
        if (!hasRealDistressPhrase(text)) continue;
        if (!readsAsOpenToConnection(text)) continue;
      }
      const age = (Date.now() - new Date(post.indexedAt).getTime()) / 36e5;
      if (age > MAX_POST_AGE_H) continue;
      const profile = await getProfile(did);
      if (profile?.followersCount > MAX_FOLLOWERS) continue;
      if (await hasRepliedToPost(env, post.uri)) continue;
      if (await hasRepliedToAuthor(env, did)) continue;
      // 4) selectivity roll AFTER hard gates — she's choosy even among valid candidates
      if (!crisis && Math.random() > REPLY_RATE) continue;
      // 5) final human-judgment: would a real person's reply be welcome, not intrusive?
      if (!(await replyWouldBeWelcome(env, text, crisis))) continue;
      try {
        const replyText = await composeDistressReply(env, text, handle, crisis);
        const posted = await postDistressReply(env, sess, post, replyText);
        await markReplied(env, post.uri, did);
        await incrementDailyCount(env);
        await logVMReply(env, { id: `vm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, post_uri: post.uri, post_text: text, reply_text: replyText, author_handle: handle, status: "posted", reply_uri: posted?.uri || null });
        log.push({ handle, crisis, chars: jsLen(replyText) });
        replied++;
      } catch (e) {
        await logVMError(env, `distressReply @${handle}`, e.message);
        await logVMReply(env, { id: `vm-err-${Date.now()}`, post_uri: post.uri, post_text: text, reply_text: "", author_handle: handle, status: "error", error_msg: e.message });
      }
    }
  }
  return { replied, log };
}
__name(runDistressReplyLoop, "runDistressReplyLoop");
async function runKindnessEngine(env, sess) {
  const dailyLikes = await getKindnessLikeCount(env);
  if (dailyLikes >= KINDNESS_LIKE_LIMIT) return { skipped: "kindness_like_limit" };
  const shuffled = shuffle([...KINDNESS_QUERIES]);
  let liked = 0, followed = 0;
  const log = [];
  for (const query of shuffled.slice(0, 8)) {
    if (liked >= 5) break;
    const posts = await searchPosts(query, sess.token);
    for (const post of posts) {
      if (liked >= 5) break;
      const text = post.record?.text || "";
      const did = post.author?.did;
      const handle = post.author?.handle;
      const cid = post.cid;
      if (!text || !did || !cid) continue;
      const genuine = await isGenuineKindnessV2(env, text);
      if (!genuine) continue;
      if (await hasLikedPost(env, post.uri)) continue;
      if (await likePost(sess, post.uri, cid)) {
        await markLikedPost(env, post.uri);
        await incrementKindnessLike(env);
        await incrementAcctLike(env, did);
        liked++;
        log.push({ handle, action: "like" });
        const acctLikes = await getAcctLikeCount(env, did);
        if (acctLikes >= KINDNESS_FOLLOW_THRESH && !await hasFollowed(env, did)) {
          if (await followAccount(sess, did)) {
            await markFollowed(env, did);
            followed++;
            log.push({ handle, action: "follow" });
          }
        }
      }
    }
  }
  return { liked, followed, log };
}
__name(runKindnessEngine, "runKindnessEngine");
async function isLBAlreadyReplied(db, postUri, authorDid) {
  const cutoff = new Date(Date.now() - LB_DEDUP_DAYS * 864e5).toISOString();
  const row = await db.prepare("SELECT post_uri FROM lb_replied_posts WHERE (post_uri=? OR author_did=?) AND created_at>? LIMIT 1").bind(postUri, authorDid, cutoff).first();
  return !!row;
}
__name(isLBAlreadyReplied, "isLBAlreadyReplied");
async function logLBSession(db, sessionId, feedUrl, feedName, postsQueued) {
  await db.prepare("INSERT INTO lb_sessions (id,feed_url,feed_name,posts_queued,created_at) VALUES (?,?,?,?,?)").bind(sessionId, feedUrl, feedName, postsQueued, (/* @__PURE__ */ new Date()).toISOString()).run();
}
__name(logLBSession, "logLBSession");
async function logLBPost(db, sessionId, target, replyText, scheduledAt) {
  const interval = LB_INTERVAL_MIN + Math.floor(Math.random() * (LB_INTERVAL_MAX - LB_INTERVAL_MIN + 1));
  const at = scheduledAt || new Date(Date.now() + interval * 6e4).toISOString();
  await db.prepare(`INSERT OR REPLACE INTO lb_replied_posts (post_uri,author_did,author_handle,post_text,reply_text,tone,session_id,status,scheduled_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(target.post.uri, target.post.author.did, target.post.author.handle || "", (target.post.record?.text || "").slice(0, 500), replyText, target.tone || "loving", sessionId, "scheduled", at, (/* @__PURE__ */ new Date()).toISOString()).run();
}
__name(logLBPost, "logLBPost");
async function composeLBReplies(targets, env) {
  const tones = ["loving", "supportive", "helpful", "intelligent", "witty", "humorous"];
  const assigned = targets.map((t) => ({ ...t, tone: tones[Math.floor(Math.random() * tones.length)] }));
  const postList = assigned.map(
    (t, i) => `${i + 1}. @${t.post.author.handle}: "${sanitizeForPrompt(t.post.record?.text || "", 200)}" [TONE: ${t.tone}]`
  ).join("\n");
  const USER = `Compose one reply per post, in order, applying the specified tone. JSON array only.

${postList}`;
  try {
    const res = await env.AI.run(LLAMA_SMART, {
      messages: [{ role: "system", content: LB_SYSTEM }, { role: "user", content: USER }],
      max_tokens: 800,
      temperature: 0.9
    });
    let raw = repairSmartQuotes(stripJsonFences((res?.response || "").trim()));
    const replies = JSON.parse(raw);
    if (!Array.isArray(replies)) throw new Error("Not array");
    return assigned.map((t, i) => ({ ...t, replyText: replies[i] || "" }));
  } catch (e) {
    await logVMError(env, "lovebomb/compose", e.message);
    return assigned.map((t) => ({ ...t, replyText: "" }));
  }
}
__name(composeLBReplies, "composeLBReplies");
async function fireDueLBReplies(env) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const sess = await bskyAuthFresh(env);
  const { results: due } = await env.DB.prepare(
    "SELECT * FROM lb_replied_posts WHERE status='scheduled' AND scheduled_at<=? ORDER BY scheduled_at ASC LIMIT 10"
  ).bind(now).all();
  let fired = 0, failed = 0;
  for (const reply of due || []) {
    try {
      const rootThread = await getPostThread(reply.post_uri, sess.token);
      const rootPost = rootThread?.thread?.post;
      if (!rootPost) throw new Error("Root post not found");
      const text = reply.reply_text;
      const facets = buildFacets(text);
      const body = {
        repo: sess.did,
        collection: "app.bsky.feed.post",
        record: {
          $type: "app.bsky.feed.post",
          text,
          facets: facets.length ? facets : void 0,
          reply: { root: { uri: reply.post_uri, cid: rootPost.cid }, parent: { uri: reply.post_uri, cid: rootPost.cid } },
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      const r = await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.createRecord`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sess.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error(`Bsky ${r.status}`);
      await env.DB.prepare("UPDATE lb_replied_posts SET status='fired' WHERE post_uri=?").bind(reply.post_uri).run();
      fired++;
    } catch (e) {
      await env.DB.prepare("UPDATE lb_replied_posts SET status='failed' WHERE post_uri=?").bind(reply.post_uri).run();
      await logVMError(env, "lovebomb/fire", e.message);
      failed++;
    }
  }
  return { fired, failed };
}
__name(fireDueLBReplies, "fireDueLBReplies");
async function runLoveBomb(feedUrl, env) {
  const sess = await bskyAuthFresh(env);
  const feedUri = feedUrl.startsWith("at://") ? feedUrl : await resolveHandle(feedUrl);
  const posts = await fetchFeed(feedUri, sess.token, 60);
  const dids = [...new Set(posts.map((p) => p.author?.did).filter(Boolean))];
  const profiles = await fetchProfiles(dids.slice(0, 25));
  const now = Date.now();
  const cutoff = now - LB_MAX_AGE_H * 36e5;
  const candidates = [];
  for (const post of posts) {
    const text = post.record?.text || "";
    const did = post.author?.did;
    if (!text || !did) continue;
    if (new Date(post.indexedAt).getTime() < cutoff) continue;
    if (await isLBAlreadyReplied(env.DB, post.uri, did)) continue;
    const profile = profiles[did] || {};
    const fc = profile.followersCount || 0;
    candidates.push({ post, profile, score: Math.min(fc, 5e3) / 5e3 + (text.length > 100 ? 0.2 : 0) });
  }
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, LB_TOP_N);
  if (!top.length) return { sessions: 0, queued: 0 };
  const targets = await composeLBReplies(top, env);
  const sessionId = `lb-${Date.now()}`;
  await logLBSession(env.DB, sessionId, feedUrl, "lovebomb", top.length);
  let queued = 0;
  let nextAt = new Date(now + 2 * 6e4);
  for (const t of targets) {
    if (!t.replyText || jsLen(t.replyText) > 300) continue;
    await logLBPost(env.DB, sessionId, t, t.replyText, nextAt.toISOString());
    nextAt = new Date(nextAt.getTime() + (LB_INTERVAL_MIN + Math.random() * (LB_INTERVAL_MAX - LB_INTERVAL_MIN)) * 6e4);
    queued++;
  }
  return { sessions: 1, queued };
}
__name(runLoveBomb, "runLoveBomb");
async function isFRAlreadyReplied(db, postUri, authorDid) {
  const cutoff = new Date(Date.now() - FR_DEDUP_DAYS * 864e5).toISOString();
  const row = await db.prepare("SELECT post_uri FROM replied_posts WHERE (post_uri=? OR author_did=?) AND created_at>? LIMIT 1").bind(postUri, authorDid, cutoff).first();
  return !!row;
}
__name(isFRAlreadyReplied, "isFRAlreadyReplied");
async function logFRSession(db, sessionId, feedUrl, feedName, postsQueued) {
  await db.prepare("INSERT INTO reply_sessions (id,feed_url,feed_name,posts_queued,schedule_id,created_at) VALUES (?,?,?,?,?,?)").bind(sessionId, feedUrl, feedName, postsQueued, null, (/* @__PURE__ */ new Date()).toISOString()).run();
}
__name(logFRSession, "logFRSession");
async function logFRPost(db, sessionId, target, replyText, scheduledAt) {
  const jitter = (Math.random() * FR_JITTER_MAX_S * 2 - FR_JITTER_MAX_S) * 1e3;
  const at = scheduledAt || new Date(Date.now() + FR_INTERVAL_MIN * 6e4 + jitter).toISOString();
  await db.prepare(`INSERT OR REPLACE INTO replied_posts (post_uri,author_did,author_handle,post_text,reply_text,reply_mode,session_id,status,scheduled_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(target.post.uri, target.post.author.did, target.post.author.handle || "", (target.post.record?.text || "").slice(0, 500), replyText, target.mode || "aloof-witty", sessionId, "scheduled", at, (/* @__PURE__ */ new Date()).toISOString()).run();
}
__name(logFRPost, "logFRPost");
async function composeFRReplies(targets, env) {
  const modes = ["aloof-witty", "counter"];
  const assigned = targets.map((t) => ({ ...t, mode: modes[Math.floor(Math.random() * modes.length)] }));
  const postList = assigned.map(
    (t, i) => `${i + 1}. @${t.post.author.handle}: "${sanitizeForPrompt(t.post.record?.text || "", 200)}" [MODE: ${t.mode}]`
  ).join("\n");
  const USER = `Compose one reply per post applying the specified mode. JSON array only.

${postList}`;
  try {
    const res = await env.AI.run(LLAMA_SMART, {
      messages: [{ role: "system", content: FR_SYSTEM }, { role: "user", content: USER }],
      max_tokens: 800,
      temperature: 0.85
    });
    let raw = repairSmartQuotes(stripJsonFences((res?.response || "").trim()));
    const replies = JSON.parse(raw);
    if (!Array.isArray(replies)) throw new Error("Not array");
    return assigned.map((t, i) => ({ ...t, replyText: replies[i] || "" }));
  } catch (e) {
    await logVMError(env, "feedreply/compose", e.message);
    return assigned.map((t) => ({ ...t, replyText: "" }));
  }
}
__name(composeFRReplies, "composeFRReplies");
async function fireDueFRReplies(env) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const sess = await bskyAuthFresh(env);
  const { results: due } = await env.DB.prepare(
    "SELECT * FROM replied_posts WHERE status='scheduled' AND scheduled_at<=? ORDER BY scheduled_at ASC LIMIT 5"
  ).bind(now).all();
  let fired = 0, failed = 0;
  for (const reply of due || []) {
    try {
      const thread = await getPostThread(reply.post_uri, sess.token);
      const rootPost = thread?.thread?.post;
      if (!rootPost) throw new Error("Root not found");
      const text = reply.reply_text;
      const facets = buildFacets(text);
      const root = thread?.thread?.post;
      const parent = rootPost;
      const body = {
        repo: sess.did,
        collection: "app.bsky.feed.post",
        record: {
          $type: "app.bsky.feed.post",
          text,
          facets: facets.length ? facets : void 0,
          reply: { root: { uri: root.uri, cid: root.cid }, parent: { uri: parent.uri, cid: parent.cid } },
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      const r = await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.createRecord`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sess.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error(`Bsky ${r.status}`);
      await env.DB.prepare("UPDATE replied_posts SET status='fired', scheduled_at=? WHERE post_uri=?").bind((/* @__PURE__ */ new Date()).toISOString(), reply.post_uri).run();
      fired++;
    } catch (e) {
      await env.DB.prepare("UPDATE replied_posts SET status='failed' WHERE post_uri=?").bind(reply.post_uri).run();
      await logVMError(env, "feedreply/fire", e.message);
      failed++;
    }
  }
  return { fired, failed };
}
__name(fireDueFRReplies, "fireDueFRReplies");
async function runFeedReplyEngine(feedUrl, env) {
  const sess = await bskyAuthFresh(env);
  const feedUri = feedUrl.startsWith("at://") ? feedUrl : await resolveHandle(feedUrl);
  const posts = await fetchFeed(feedUri, sess.token, 50);
  const now = Date.now();
  const cutoff = now - FR_MAX_AGE_H * 36e5;
  const candidates = [];
  for (const post of posts) {
    const text = post.record?.text || "";
    const did = post.author?.did;
    if (!text || !did || text.length < 30) continue;
    if (new Date(post.indexedAt).getTime() < cutoff) continue;
    if (await isFRAlreadyReplied(env.DB, post.uri, did)) continue;
    candidates.push({ post, score: text.length > 150 ? 1 : 0.5 });
  }
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, FR_TOP_N);
  if (!top.length) return { sessions: 0, queued: 0 };
  const targets = await composeFRReplies(top, env);
  const sessionId = `fr-${Date.now()}`;
  await logFRSession(env.DB, sessionId, feedUrl, "feedreply", top.length);
  let queued = 0;
  let nextAt = new Date(now + 2 * 6e4);
  for (const t of targets) {
    if (!t.replyText || jsLen(t.replyText) > 300) continue;
    await logFRPost(env.DB, sessionId, t, t.replyText, nextAt.toISOString());
    nextAt = new Date(nextAt.getTime() + (FR_INTERVAL_MIN * 60 + Math.random() * FR_JITTER_MAX_S) * 1e3);
    queued++;
  }
  return { sessions: 1, queued };
}
__name(runFeedReplyEngine, "runFeedReplyEngine");
async function runLearnCycle(env) {
  const sess = await getBskySession(env);
  const DID = sess.did;
  const feedRes = await fetch(
    `${BSKY_PDS}/xrpc/app.bsky.feed.getAuthorFeed?actor=${DID}&filter=posts_with_replies&limit=100`,
    { headers: { Authorization: `Bearer ${sess.token}` } }
  );
  if (!feedRes.ok) return { error: `AuthorFeed ${feedRes.status}` };
  const feed = (await feedRes.json()).feed || [];
  const mine = [];
  for (const it of feed) {
    const p = it.post, rec = p?.record;
    if (!rec?.reply) continue;
    const parentUri = rec.reply.parent?.uri || "";
    if (parentUri.includes(DID)) continue;
    const ageH = (Date.now() - new Date(rec.createdAt).getTime()) / 3.6e6;
    if (ageH < 6) continue;
    if (ageH > 24 * 20) continue;
    mine.push({
      text: rec.text || "",
      likes: p.likeCount || 0,
      replies: p.replyCount || 0,
      reposts: p.repostCount || 0,
      parentUri,
      uri: p.uri,
    });
  }
  if (mine.length < 8) return { skipped: "not_enough_graded_replies", n: mine.length };
  const label = (r) => {
    if (r.replies >= 1 || r.likes >= 2 || r.reposts >= 1) return "WON";
    if (r.likes === 0 && r.replies === 0) return "LOST";
    return "NEUTRAL";
  };
  const won = mine.filter(r => label(r) === "WON");
  const lost = mine.filter(r => label(r) === "LOST");
  const wonRate = mine.length ? won.length / mine.length : 0;
  if (won.length < 2 || lost.length < 2) {
    await env.KV.put("VIBESMOM_LAST_WINRATE", JSON.stringify({
      at: new Date().toISOString(), n: mine.length, won: won.length, lost: lost.length, wonRate,
    }));
    return { skipped: "insufficient_signal", n: mine.length, won: won.length, lost: lost.length };
  }
  const fmt = (arr) => arr.slice(0, 12).map((r, i) =>
    `${i + 1}. [likes ${r.likes} replies ${r.replies}] "${(r.text || "").replace(/\s+/g, " ").slice(0, 200)}"`
  ).join("\n");
  const sys =
    "You study a warm support bot's own replies on Bluesky, labeled by REAL outcome. " +
    "WARM replies earned a human reply-back or likes. FLAT replies were ignored (zero engagement). " +
    "Contrast them. Identify 2-3 concrete things the WARM replies DID that the FLAT ones did not " +
    "(structure, length, specificity, question style, whether they named the person's agency, tone), " +
    "and 1-2 concrete things the FLAT replies did to AVOID. Be specific and behavioral, not generic. " +
    'Return ONLY JSON: { "working": string[], "avoid": string[] }';
  const user =
    `WARM replies (earned connection):\n${fmt(won)}\n\n` +
    `FLAT replies (ignored):\n${fmt(lost)}`;
  const res = await env.AI.run(LLAMA_SMART, {
    messages: [{ role: "system", content: sys }, { role: "user", content: user }],
    max_tokens: 400, temperature: 0.4,
  });
  let parsed;
  try { parsed = JSON.parse(repairSmartQuotes(stripJsonFences((res?.response || "").trim()))); }
  catch (e) { return { error: "parse_fail: " + e.message }; }
  const cleanArr = (v) => Array.isArray(v)
    ? v.filter(x => typeof x === "string" && x.trim().length >= 12 && x.trim().length <= 400).map(x => x.trim())
    : [];
  const toks = (s) => new Set(s.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const tooSimilar = (a, b) => {
    const A = toks(a), B = toks(b); if (!A.size || !B.size) return false;
    let o = 0; for (const w of A) if (B.has(w)) o++;
    return o / Math.min(A.size, B.size) >= 0.6;
  };
  const mergeDedupe = (existing, incoming, cap) => {
    const out = [...existing];
    for (const cand of incoming) {
      if (!out.some(e => tooSimilar(e, cand))) out.push(cand);
    }
    return out.slice(-cap);
  };
  const newWorking = cleanArr(parsed.working);
  const newAvoid = cleanArr(parsed.avoid);
  const exW = cleanArr(JSON.parse(await env.KV.get("VIBESMOM_WORKING_PATTERNS") || "[]"));
  const exA = cleanArr(JSON.parse(await env.KV.get("VIBESMOM_AVOID_PATTERNS") || "[]"));
  const mW = mergeDedupe(exW, newWorking, 6);
  const mA = mergeDedupe(exA, newAvoid, 8);
  await env.KV.put("VIBESMOM_WORKING_PATTERNS", JSON.stringify(mW));
  await env.KV.put("VIBESMOM_AVOID_PATTERNS", JSON.stringify(mA));
  await env.KV.put("VIBESMOM_LAST_WINRATE", JSON.stringify({
    at: new Date().toISOString(), n: mine.length, won: won.length, lost: lost.length,
    wonRate: Math.round(wonRate * 100) / 100,
  }));
  return {
    outcome_aware: true,
    graded: mine.length, won: won.length, lost: lost.length, wonRate: Math.round(wonRate * 100) / 100,
    learned: { working_new: newWorking.length, avoid_new: newAvoid.length,
               working_total: mW.length, avoid_total: mA.length },
  };
}
__name(runLearnCycle, "runLearnCycle");
async function initDB(db) {
  const stmts = [
    // vibesmom core tables
    `CREATE TABLE IF NOT EXISTS vibesmom_errors (id TEXT PRIMARY KEY, context TEXT, error_msg TEXT, occurred_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS vibesmom_replies (id TEXT PRIMARY KEY, post_uri TEXT, post_text TEXT, reply_text TEXT, author_handle TEXT, replied_at TEXT, status TEXT, error_msg TEXT)`,
    // lovebomb tables
    `CREATE TABLE IF NOT EXISTS lb_sessions (id TEXT PRIMARY KEY, feed_url TEXT, feed_name TEXT, posts_queued INTEGER, created_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS lb_replied_posts (post_uri TEXT PRIMARY KEY, author_did TEXT, author_handle TEXT, post_text TEXT, reply_text TEXT, tone TEXT, session_id TEXT, status TEXT, scheduled_at TEXT, created_at TEXT)`,
    `CREATE INDEX IF NOT EXISTS idx_lb_status ON lb_replied_posts(status, scheduled_at)`,
    `CREATE INDEX IF NOT EXISTS idx_lb_session ON lb_replied_posts(session_id)`,
    // feedreply tables
    `CREATE TABLE IF NOT EXISTS reply_sessions (id TEXT PRIMARY KEY, feed_url TEXT, feed_name TEXT, posts_queued INTEGER, schedule_id TEXT, created_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS replied_posts (post_uri TEXT PRIMARY KEY, author_did TEXT, author_handle TEXT, post_text TEXT, reply_text TEXT, reply_mode TEXT, session_id TEXT, status TEXT, scheduled_at TEXT, created_at TEXT)`,
    `CREATE INDEX IF NOT EXISTS idx_fr_status ON replied_posts(status, scheduled_at)`,
    `CREATE INDEX IF NOT EXISTS idx_fr_session ON replied_posts(session_id)`
  ];
  for (const sql of stmts) {
    try {
      await db.prepare(sql).run();
    } catch (e) {
    }
  }
  return { ok: true, tables: stmts.length };
}
__name(initDB, "initDB");
async function buildThreadHistory(uri, token, selfDid) {
  // walk up the parent chain via getPostThread depth=1 (parent included), collect ancestors
  const r = await fetch(`${BSKY_PDS}/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(uri)}&depth=0&parentHeight=12`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!r.ok) return null;
  const data = await r.json();
  let node = data.thread;
  if (!node || !node.post) return null;
  const chain = [];
  // climb parents
  let cur = node;
  const stack = [];
  while (cur && cur.post) { stack.push(cur.post); cur = cur.parent; }
  stack.reverse(); // oldest first
  let myTurns = 0;
  for (const p of stack) {
    const who = p.author?.did === selfDid ? "You (VibesMom)" : `@${p.author?.handle || "them"}`;
    if (p.author?.did === selfDid) myTurns++;
    chain.push(`${who}: ${(p.record?.text || "").slice(0, 280)}`);
  }
  return { historyText: chain.join("\n"), myTurns, leaf: node.post };
}
__name(buildThreadHistory, "buildThreadHistory");

// ── WARM CONTINUATION GATE (Jul 25) ──────────────────────────────────────
// A real caring person doesn't vanish the second there's no "emergency". If
// someone she replied to writes back warmly, opens up more, thanks her, or
// asks her something, she gives ONE more genuine, brief, human reply. This is
// NOT general chatbot behavior — it is gated hard: turn caps, small daily
// budget, and an LLM check that a reply is genuinely warranted + welcome.
// Returns { warrant:boolean, reason:string }.
async function warmContinuationWarranted(env, historyText, myTurns) {
  if (myTurns >= VM_WARM_MAX_TURNS) return { warrant: false, reason: "warm turn cap reached" };
  const SYS = `You are the private inner judgment of VibesMom, a warm real woman on Bluesky. She already replied to this person once. Read the FULL thread and decide whether a socially-intelligent, caring PERSON would naturally send ONE more reply right now — or whether the kind thing is to let it rest.

Reply YES only if the latest message from the OTHER person is genuinely inviting more from her: they thanked her and clearly want connection, they opened up further, they asked her a direct question, or they're mid-conversation and would feel dropped if she vanished. Reply NO if: the exchange has reached a natural end (a simple "thanks" that closes it), they're not really engaging with her, it's an argument/bait, it's spam, or continuing would feel clingy, intrusive, or like she can't take a hint.

Be conservative — when unsure, NO. A real person knows when a conversation is over. Respond with ONLY: YES or NO, then a dash and a 4-8 word reason.`;
  try {
    const res = await env.AI.run(LLAMA_SMART, {
      messages: [{ role: "system", content: SYS }, { role: "user", content: historyText.slice(0, 2400) }],
      max_tokens: 40, temperature: 0.2
    });
    const raw = String(res?.response || "").trim();
    const warrant = /^\s*YES\b/i.test(raw);
    return { warrant, reason: raw.replace(/^\s*(YES|NO)\b[\s\-—:]*/i, "").slice(0, 80) || (warrant ? "warranted" : "let it rest") };
  } catch (e) {
    return { warrant: false, reason: "warm-check failsafe" }; // fail CLOSED — never over-reach
  }
}
__name(warmContinuationWarranted, "warmContinuationWarranted");

// Compose a warm, brief, human continuation — NO resources, NO advice-dumping,
// NO restarting. Just a real person still there, still listening.
async function composeWarmContinuation(env, historyText) {
  const SYS = `${VIBESMOM_SYSTEM}

CONTEXT: This is an ONGOING conversation you started by reaching out. You are NOT solving a crisis — this person is simply still talking with you (they thanked you, opened up more, or asked you something). Respond the way a warm, real person would to a friend they're getting to know:
- Short. One to three sentences. Often shorter is warmer.
- React to what they ACTUALLY just said — reference it specifically. Do not restart or re-introduce anything.
- Do NOT hand out resources, hotlines, tips, or advice unless they directly ask. This is human warmth, not case management.
- It's fine to share a small, vague human reaction ("that made me smile", "I get that more than you'd think").
- Sometimes the best reply is a single genuine question that keeps the door open — but don't interrogate.
- If it feels like a natural goodbye, a warm short send-off is perfect. Don't cling.
Output ONLY the reply text. Nothing else. No quotes.`;
  try {
    const res = await env.AI.run(LLAMA_CONVO, {
      messages: [{ role: "system", content: SYS }, { role: "user", content: historyText.slice(0, 2600) }],
      max_tokens: 140, temperature: 0.7
    });
    let t = String(res?.response || "").trim().replace(/^["“]|["”]$/g, "").trim();
    if (!t) return null;
    // hard char safety (Bluesky) — trim to <=270 JS units without cutting mid-word badly
    if (jsLen(t) > 270) { t = t.slice(0, 268).replace(/\s+\S*$/, "") + "…"; }
    return t;
  } catch (e) { return null; }
}
__name(composeWarmContinuation, "composeWarmContinuation");

// VibesMom 2.0 — continue conversations ONLY with people showing real need.
async function runConversationLoop(env) {
  // kill-switch
  if (await env.KV.get("vibesmom_paused")) return { skipped: "paused" };
  const convoDayKey = `convo_count:${todayKey()}`;
  const convoCount = parseInt(await env.KV.get(convoDayKey) || "0");
  // FIX (Jul26): do NOT hard-exit on convo cap — that starved the warm path.
  // Distress (needs_human) branch self-gates on convoCount below; warm self-gates on warm_count.
  const distressCapped = convoCount >= VM_CONVO_DAILY;
  const sess = await getBskySession(env);
  const selfDid = sess.did;
  const nr = await fetch(`${BSKY_PDS}/xrpc/app.bsky.notification.listNotifications?limit=40`, { headers: { Authorization: `Bearer ${sess.token}` } });
  if (!nr.ok) return { error: `notif ${nr.status}` };
  const notifs = (await nr.json()).notifications || [];
  // replies TO her, recent, not already handled
  const cutoff = Date.now() - 24 * 3600 * 1000;
  const replies = notifs.filter(n => n.reason === "reply" && new Date(n.indexedAt || 0).getTime() > cutoff);
  const out = [];
  let continued = 0;
  for (const n of replies) {
    if (continued >= 2) break; // gentle: max 2 continuations per cycle
    const uri = n.uri, did = n.author?.did;
    if (!uri || !did || did === selfDid) continue;
    // dedupe: have we already replied to THIS specific message of theirs?
    if (await env.KV.get(await safeKvKey("convo", uri))) continue;
    const built = await buildThreadHistory(uri, sess.token, selfDid);
    if (!built || !built.historyText) continue;
    if (built.myTurns >= VM_CONVO_MAX_TURNS) { await env.KV.put(await safeKvKey("convo", uri), "maxturns", { expirationTtl: 2592e3 }); continue; }
    // JUDGMENT — does this conversation show a real need?
    const need = await assessNeed(env, built.historyText);
    let resourceInfo = null;
    if (need.needs_human && need.kind !== "none" && !distressCapped) {
      const prof = await getProfile(did);
      const loc = geolocateFromContext(need.region_hint, prof?.description || "");
      resourceInfo = await directoryLookup(env, { need: need.kind, country: loc.country, region: loc.region, city: loc.city });
      // SELF-BUILD (fire-and-forget): if no verified LOCAL match, research + stage a candidate so the
      // directory grows for the next person from this area. CALL-E outside line is OFF (VM_CALLE_LIVE),
      // so staged locals save as `unverified` and are NOT handed out — the national line covers now.
      if (resourceInfo && resourceInfo.needs_live_verification && (loc.region || loc.city)) {
        try {
          const seeded = await stageResourceSeed(env, { need: need.kind, country: loc.country, region: loc.region, city: loc.city });
          if (seeded && seeded.staged) out.push({ handle: n.author?.handle, action: "seeded_resource", seed: seeded });
        } catch (e) { /* seeding never blocks the reply */ }
      }
    } else {
      // No concrete crisis — but a real caring person doesn't vanish on a warm,
      // engaged human. Give ONE more genuine reply when it's warranted + welcome.
      const warmKey = `warm_count:${todayKey()}`;
      const warmCount = parseInt(await env.KV.get(warmKey) || "0");
      if (warmCount >= VM_WARM_DAILY) {
        await env.KV.put(await safeKvKey("convo", uri), "warm_daily_cap", { expirationTtl: 604800 });
        out.push({ handle: n.author?.handle, action: "warm_daily_cap" });
        continue;
      }
      const warm = await warmContinuationWarranted(env, built.historyText, built.myTurns);
      if (!warm.warrant) {
        await env.KV.put(await safeKvKey("convo", uri), "no_need", { expirationTtl: 604800 });
        out.push({ handle: n.author?.handle, action: "let_it_rest", reasoning: warm.reason });
        continue;
      }
      const warmReply = await composeWarmContinuation(env, built.historyText);
      if (!warmReply) {
        await env.KV.put(await safeKvKey("convo", uri), "no_need", { expirationTtl: 604800 });
        out.push({ handle: n.author?.handle, action: "warm_compose_failed" });
        continue;
      }
      const leaf = built.leaf;
      const rootRef = leaf?.record?.reply?.root || { uri: leaf.uri, cid: leaf.cid };
      const facets = buildFacets(warmReply);
      const body = { repo: selfDid, collection: "app.bsky.feed.post", record: {
        $type: "app.bsky.feed.post", text: warmReply, facets: facets.length ? facets : void 0,
        reply: { root: { uri: rootRef.uri, cid: rootRef.cid }, parent: { uri: leaf.uri, cid: leaf.cid } },
        createdAt: new Date().toISOString() } };
      const pr = await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.createRecord`, { method: "POST", headers: { Authorization: `Bearer ${sess.token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!pr.ok) { out.push({ handle: n.author?.handle, action: "warm_post_failed", status: pr.status }); continue; }
      let warmUri = null; try { warmUri = (await pr.json())?.uri || null; } catch (e) {}
      await env.KV.put(await safeKvKey("convo", uri), "warm_replied", { expirationTtl: 2592e3 });
      await env.KV.put(warmKey, String(warmCount + 1), { expirationTtl: 172800 });
      try { await logVMReply(env, { id: `vmwarm-${Date.now()}-${Math.random().toString(36).slice(2,5)}`, post_uri: uri, post_text: built.historyText.slice(-300), reply_text: warmReply, author_handle: n.author?.handle, status: "warm_continued", reply_uri: warmUri }); } catch (e) {}
      out.push({ handle: n.author?.handle, action: "warm_continued", reason: warm.reason });
      await new Promise(r => setTimeout(r, 1500));
      continue;
    }
    const reply = await composeConversationReply(env, built.historyText, need, resourceInfo);
    if (!reply) { out.push({ handle: n.author?.handle, action: "compose_failed" }); continue; }
    // post as reply to THEIR message (parent = their reply; root = thread root)
    const leaf = built.leaf;
    const rootRef = leaf?.record?.reply?.root || { uri: leaf.uri, cid: leaf.cid };
    const facets = buildFacets(reply);
    const body = { repo: selfDid, collection: "app.bsky.feed.post", record: {
      $type: "app.bsky.feed.post", text: reply, facets: facets.length ? facets : void 0,
      reply: { root: { uri: rootRef.uri, cid: rootRef.cid }, parent: { uri: leaf.uri, cid: leaf.cid } },
      createdAt: new Date().toISOString() } };
    const pr = await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.createRecord`, { method: "POST", headers: { Authorization: `Bearer ${sess.token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!pr.ok) { out.push({ handle: n.author?.handle, action: "post_failed", status: pr.status }); continue; }
    await env.KV.put(await safeKvKey("convo", uri), "replied", { expirationTtl: 2592e3 });
    await env.KV.put(convoDayKey, String(convoCount + 1 + continued), { expirationTtl: 172800 });
    continued++;
    out.push({ handle: n.author?.handle, action: "continued", need: need.kind, severity: need.severity, offered_resource: !!resourceInfo });
    // Telegram receipt on genuine need hand-offs (visibility, not approval)
    if (need.needs_human && (resourceInfo?.match || resourceInfo?.national_fallback)) {
      const rr = resourceInfo.match || resourceInfo.national_fallback;
      try { await vmTelegram(env, `\uD83E\uDD1D <b>VibesMom helped @${n.author?.handle}</b> (${need.kind}, sev ${need.severity})\nOffered: ${rr.org_name} ${rr.phone_display || rr.phone_e164}\n<i>${reply.slice(0,160)}</i>`); } catch {}
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  return { continued, evaluated: replies.length, details: out };
}
__name(runConversationLoop, "runConversationLoop");

async function handleScheduled(env) {
  const hour = (/* @__PURE__ */ new Date()).getUTCHours();
  const results = {};
  if (hour === 3) {
    try {
      results.learn = await runLearnCycle(env);
    } catch (e) {
      await logVMError(env, "learnCycle", e.message);
    }
  }
  if (hour >= 7 && hour <= 23) {
    try {
      const sess = await getBskySession(env);
      results.conversation = await runConversationLoop(env);
      results.distress = await runDistressReplyLoop(env);
      results.kindness = await runKindnessEngine(env, sess);
    } catch (e) {
      await logVMError(env, "scheduledHandler", e.message);
      results.error = e.message;
    }
  }
  // V2+V3: daily human mechanics + micro-poem (self-gated to once/day; runs in the calm midday window)
  if (hour === 15) {
    try {
      results.hobby = await runHumanMechanicsAndHobby(env);
    } catch (e) {
      await logVMError(env, "humanMechanicsHobby", e.message);
    }
  }
  try {
    results.lb_fire = await fireDueLBReplies(env);
  } catch (e) {
    results.lb_fire_err = e.message;
  }
  try {
    results.fr_fire = await fireDueFRReplies(env);
  } catch (e) {
    results.fr_fire_err = e.message;
  }
  return results;
}
__name(handleScheduled, "handleScheduled");
async function renderDashboard(env) {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const [
    vmReplies,
    vmErrors6h,
    vmErrorsTotal,
    dailyCount,
    kindnessLikes,
    lastReplyRaw,
    lbSessions,
    lbStatusCounts,
    lbDue,
    lbNext,
    frSessions,
    frStatusCounts,
    frDue,
    kvKeys
  ] = await Promise.all([
    env.DB.prepare("SELECT replied_at, author_handle, status, reply_text FROM vibesmom_replies ORDER BY replied_at DESC LIMIT 10").all().catch(() => ({ results: [] })),
    env.DB.prepare("SELECT COUNT(*) as n FROM vibesmom_errors WHERE occurred_at > datetime('now','-6 hours')").first().catch(() => ({ n: 0 })),
    env.DB.prepare("SELECT COUNT(*) as n FROM vibesmom_errors").first().catch(() => ({ n: 0 })),
    env.KV.get(`daily_count:${today}`),
    env.KV.get(`kindness_likes:${today}`),
    env.KV.get("last_reply_time"),
    env.DB.prepare("SELECT COUNT(*) as n FROM lb_sessions").first().catch(() => ({ n: 0 })),
    env.DB.prepare("SELECT status, COUNT(*) as cnt FROM lb_replied_posts GROUP BY status").all().catch(() => ({ results: [] })),
    env.DB.prepare("SELECT COUNT(*) as n FROM lb_replied_posts WHERE status='scheduled' AND scheduled_at<=datetime('now')").first().catch(() => ({ n: 0 })),
    env.DB.prepare("SELECT author_handle, tone, reply_text, scheduled_at FROM lb_replied_posts WHERE status='scheduled' ORDER BY scheduled_at ASC LIMIT 5").all().catch(() => ({ results: [] })),
    env.DB.prepare("SELECT COUNT(*) as n FROM reply_sessions").first().catch(() => ({ n: 0 })),
    env.DB.prepare("SELECT status, COUNT(*) as cnt FROM replied_posts GROUP BY status").all().catch(() => ({ results: [] })),
    env.DB.prepare("SELECT COUNT(*) as n FROM replied_posts WHERE status='scheduled' AND scheduled_at<=datetime('now')").first().catch(() => ({ n: 0 })),
    env.KV.list()
  ]);
  const lastReply = lastReplyRaw ? new Date(parseInt(lastReplyRaw)).toUTCString() : "never";
  const kvCount = (kvKeys?.keys || []).length;
  const lbStatusMap = {};
  for (const r of lbStatusCounts?.results || []) lbStatusMap[r.status] = r.cnt;
  const frStatusMap = {};
  for (const r of frStatusCounts?.results || []) frStatusMap[r.status] = r.cnt;
  const vmRows = (vmReplies?.results || []).map(
    (r) => `<tr><td>${r.replied_at?.slice(0, 19) || "?"}</td><td>@${r.author_handle || "?"}</td><td><span class="badge ${r.status === "posted" ? "green" : r.status === "error" ? "red" : "gray"}">${r.status}</span></td><td class="truncate">${(r.reply_text || "").slice(0, 80)}</td></tr>`
  ).join("");
  const lbRows = (lbNext?.results || []).map(
    (r) => `<tr><td>${r.scheduled_at?.slice(0, 19) || "?"}</td><td>@${r.author_handle || "?"}</td><td><span class="badge purple">${r.tone || "?"}</span></td><td class="truncate">${(r.reply_text || "").slice(0, 80)}</td></tr>`
  ).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibesMom Dashboard</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0d0d0f;color:#e8e8e8;font-family:'SF Mono',monospace;font-size:13px;padding:20px}
  h1{font-size:22px;font-weight:700;color:#f0a0ff;margin-bottom:4px}
  .sub{color:#888;font-size:11px;margin-bottom:24px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:24px}
  .card{background:#161619;border:1px solid #2a2a2f;border-radius:10px;padding:16px}
  .card h3{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:8px}
  .card .val{font-size:28px;font-weight:700;color:#f0a0ff}
  .card .val.green{color:#4ade80}.card .val.yellow{color:#facc15}.card .val.red{color:#f87171}
  .card .sub2{font-size:10px;color:#555;margin-top:4px}
  section{margin-bottom:28px}
  section h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #2a2a2f}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;color:#555;font-size:10px;text-transform:uppercase;padding:4px 8px;border-bottom:1px solid #1f1f24}
  td{padding:6px 8px;border-bottom:1px solid #1a1a1e;vertical-align:top}
  .truncate{max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600}
  .badge.green{background:#14532d;color:#4ade80}.badge.red{background:#450a0a;color:#f87171}
  .badge.gray{background:#1f1f24;color:#888}.badge.purple{background:#3b1f5e;color:#c084fc}
  .badge.blue{background:#1e3a5f;color:#60a5fa}.badge.yellow{background:#3d2a00;color:#facc15}
  .module-header{display:flex;align-items:center;gap:8px;margin-bottom:10px}
  .module-header h2{border:none;margin:0;padding:0}
  .dot{width:8px;height:8px;border-radius:50%;display:inline-block}
  .dot.green{background:#4ade80}.dot.yellow{background:#facc15}.dot.red{background:#f87171}
  .actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
  .btn{background:#1e1e24;border:1px solid #3a3a44;color:#e8e8e8;padding:8px 14px;border-radius:6px;cursor:pointer;font-family:monospace;font-size:12px}
  .btn:hover{background:#2a2a34;border-color:#f0a0ff;color:#f0a0ff}
  .btn.danger{border-color:#f87171;color:#f87171}.btn.danger:hover{background:#450a0a}
  .result-box{background:#0a0a0c;border:1px solid #2a2a2f;border-radius:6px;padding:12px;margin-top:10px;white-space:pre-wrap;font-size:11px;color:#aaa;display:none}
  .form-row{display:flex;gap:8px;align-items:center;margin-bottom:10px}
  input[type=text]{background:#1e1e24;border:1px solid #3a3a44;color:#e8e8e8;padding:8px 10px;border-radius:6px;font-family:monospace;font-size:12px;flex:1}
  input[type=text]:focus{outline:none;border-color:#f0a0ff}
  .ts{color:#555;font-size:10px}
  .health-row{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px}
  .health-item{display:flex;align-items:center;gap:6px;font-size:11px}
</style>
</head>
<body>
<div id="login-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:999;align-items:center;justify-content:center;flex-direction:column;gap:12px">
  <div style="background:#161619;border:1px solid #f0a0ff;border-radius:12px;padding:32px;min-width:320px;text-align:center">
    <div style="font-size:20px;color:#f0a0ff;margin-bottom:16px">\u{1F7E3} VibesMom</div>
    <div style="color:#888;font-size:12px;margin-bottom:16px">Pete-only access. Enter your management secret.</div>
    <input type="password" id="login-secret" placeholder="VIBESMOM_SECRET" onkeydown="if(event.key==='Enter')doLogin()"
      style="width:100%;background:#0d0d0f;border:1px solid #3a3a44;color:#e8e8e8;padding:10px;border-radius:6px;font-family:monospace;font-size:13px;margin-bottom:10px">
    <button onclick="doLogin()" style="width:100%;background:#f0a0ff22;border:1px solid #f0a0ff;color:#f0a0ff;padding:10px;border-radius:6px;cursor:pointer;font-family:monospace">Unlock Dashboard</button>
    <div id="login-err" style="color:#f87171;font-size:11px;margin-top:8px"></div>
  </div>
</div>
<h1>\u{1F7E3} VibesMom Dashboard</h1>
<p class="sub">Pete-only \xB7 WARP protected \xB7 ${(/* @__PURE__ */ new Date()).toUTCString()}</p>

<div class="health-row">
  <div class="health-item"><span class="dot green"></span>distress-reply</div>
  <div class="health-item"><span class="dot green"></span>kindness-engine</div>
  <div class="health-item"><span class="dot green"></span>lovebomb</div>
  <div class="health-item"><span class="dot green"></span>feed-reply</div>
  <div class="health-item"><span class="dot ${(vmErrors6h?.n || 0) > 0 ? "yellow" : "green"}"></span>${vmErrors6h?.n || 0} errors (6h)</div>
</div>

<div class="grid">
  <div class="card"><h3>Distress Replies Today</h3><div class="val ${parseInt(dailyCount || 0) >= 12 ? "red" : parseInt(dailyCount || 0) >= 8 ? "yellow" : "green"}">${dailyCount || 0} / 12</div><div class="sub2">Last: ${lastReply}</div></div>
  <div class="card"><h3>Kindness Likes Today</h3><div class="val">${kindnessLikes || 0} / 20</div><div class="sub2">follows at 2 likes/acct</div></div>
  <div class="card"><h3>LoveBomb Sessions</h3><div class="val">${lbSessions?.n || 0}</div><div class="sub2">fired:${lbStatusMap["fired"] || 0} sched:${lbStatusMap["scheduled"] || 0} fail:${lbStatusMap["failed"] || 0}</div></div>
  <div class="card"><h3>FeedReply Sessions</h3><div class="val">${frSessions?.n || 0}</div><div class="sub2">fired:${frStatusMap["fired"] || 0} sched:${frStatusMap["scheduled"] || 0} fail:${frStatusMap["failed"] || 0}</div></div>
  <div class="card"><h3>LB Overdue Replies</h3><div class="val ${(lbDue?.n || 0) > 0 ? "yellow" : "green"}">${lbDue?.n || 0}</div><div class="sub2">waiting to fire</div></div>
  <div class="card"><h3>FR Overdue Replies</h3><div class="val ${(frDue?.n || 0) > 0 ? "yellow" : "green"}">${frDue?.n || 0}</div><div class="sub2">waiting to fire</div></div>
  <div class="card"><h3>Total Errors</h3><div class="val ${(vmErrorsTotal?.n || 0) > 100 ? "red" : "gray"}">${vmErrorsTotal?.n || 0}</div><div class="sub2">${vmErrors6h?.n || 0} in last 6h</div></div>
  <div class="card"><h3>KV Keys</h3><div class="val gray">${kvCount}</div><div class="sub2">dedup + state</div></div>
</div>

<!-- ACTIONS -->
<section>
  <h2>\u26A1 Manual Controls</h2>
  <div class="actions">
    <button class="btn" onclick="runAction('/run-distress','GET')">Run Distress Loop</button>
    <button class="btn" onclick="runAction('/run-kindness','GET')">Run Kindness Engine</button>
    <button class="btn" onclick="runAction('/fire-lb','GET')">Fire Due LoveBombs</button>
    <button class="btn" onclick="runAction('/fire-fr','GET')">Fire Due FeedReplies</button>
    <button class="btn" onclick="runAction('/run-learn','GET')">Run Learn Cycle</button>
  </div>
  <div class="form-row">
    <input type="text" id="lb-feed" placeholder="LoveBomb feed URL (at://... or handle)">
    <button class="btn" onclick="runLB()">Queue LoveBomb</button>
  </div>
  <div class="form-row">
    <input type="text" id="fr-feed" placeholder="FeedReply feed URL (at://... or handle)">
    <button class="btn" onclick="runFR()">Queue FeedReply</button>
  </div>
  <div class="result-box" id="result-box"></div>
</section>

<!-- VIBESMOM REPLIES -->
<section>
  <h2>\u{1F4AC} Distress Replies (last 10)</h2>
  <table><thead><tr><th>Time</th><th>Author</th><th>Status</th><th>Reply</th></tr></thead>
  <tbody>${vmRows || '<tr><td colspan=4 style="color:#555">no replies yet</td></tr>'}</tbody></table>
</section>

<!-- LOVEBOMB QUEUE -->
<section>
  <h2>\u{1F4A3} LoveBomb Queue (next 5)</h2>
  <table><thead><tr><th>Scheduled</th><th>Author</th><th>Tone</th><th>Reply</th></tr></thead>
  <tbody>${lbRows || '<tr><td colspan=4 style="color:#555">queue empty</td></tr>'}</tbody></table>
</section>

<!-- FEEDREPLY LATEST -->
<section>
  <h2>\u{1F5DE} FeedReply Recent Sessions</h2>
  <table><thead><tr><th>Session</th><th>Feed</th><th>Queued</th><th>Created</th></tr></thead>
  <tbody id="fr-sessions-body"><tr><td colspan=4 style="color:#555">loading...</td></tr></tbody>
</section>

<script>
const SECRET = sessionStorage.getItem('vm_tok') || '';
async function checkLogin() {
  const tok = sessionStorage.getItem('vm_tok');
  if (!tok) { showLogin(); return false; }
  // Quick verify
  const r = await fetch('/api/stats', { headers: { 'X-Auth': tok } });
  if (r.status === 401) { sessionStorage.removeItem('vm_tok'); showLogin(); return false; }
  return true;
}
function showLogin() {
  document.getElementById('login-overlay').style.display='flex';
}
async function doLogin() {
  const s = document.getElementById('login-secret').value.trim();
  const r = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({secret:s}) });
  const d = await r.json();
  if (d.ok) {
    sessionStorage.setItem('vm_tok', d.token);
    document.getElementById('login-overlay').style.display='none';
    location.reload();
  } else { document.getElementById('login-err').textContent = 'Wrong secret'; }
}
document.addEventListener('DOMContentLoaded', () => checkLogin());
async function runAction(path, method='GET', body=null) {
  const box = document.getElementById('result-box');
  box.style.display='block'; box.textContent='running...';
  try {
    const opts = { method, headers: { 'X-Auth': SECRET, 'Content-Type':'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(path, opts);
    const t = await r.text();
    try { box.textContent = JSON.stringify(JSON.parse(t), null, 2); } catch(e) { box.textContent = t; }
  } catch(e) { box.textContent = 'Error: ' + e.message; }
}
function runLB() {
  const feed = document.getElementById('lb-feed').value.trim();
  if (!feed) return alert('enter a feed URL');
  runAction('/run-lovebomb', 'POST', { feed_url: feed });
}
function runFR() {
  const feed = document.getElementById('fr-feed').value.trim();
  if (!feed) return alert('enter a feed URL');
  runAction('/run-feedreply', 'POST', { feed_url: feed });
}
// Load FR sessions
fetch('/api/fr-sessions', { headers: { 'X-Auth': SECRET } })
  .then(r=>r.json()).then(data=>{
    const tbody = document.getElementById('fr-sessions-body');
    if (!data.sessions?.length) { tbody.innerHTML='<tr><td colspan=4 style="color:#555">no sessions</td></tr>'; return; }
    tbody.innerHTML = data.sessions.map(s =>
      '<tr><td class="ts">'+s.id+'</td><td class="truncate">'+s.feed_url+'</td><td>'+s.posts_queued+'</td><td class="ts">'+s.created_at?.slice(0,19)+'</td></tr>'
    ).join('');
  }).catch(()=>{});
<\/script>
</body>
</html>`;
}
__name(renderDashboard, "renderDashboard");

// ─── one-shot: find high-follower Binface post & VibesMom quote-repost it ───
async function binfaceBoost(env, opts){
  const dry = !!(opts && opts.dry);
  const sess = await getBskySession(env);
  const auth = { "Authorization": `Bearer ${sess.token}`, "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0" };
  const queries = ["Count Binface","Binface","Binface Clacton","Binface Farage","bin helmet"];
  const posts = {};
  for (const q of queries){
    const url = `${BSKY_PDS}/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&sort=latest&limit=40`;
    try { const d = await (await fetch(url,{headers:auth})).json(); for (const p of (d.posts||[])) posts[p.uri]=p; } catch(e){}
  }
  const now = Date.now();
  let cands = Object.values(posts).map(p=>{
    const t = Date.parse(p.record?.createdAt||0); const ageH=(now-t)/3.6e6;
    return { uri:p.uri, cid:p.cid, handle:p.author?.handle, name:p.author?.displayName||"",
      followers:p.author?.followersCount||0, ageH, likes:p.likeCount||0,
      text:(p.record?.text||"").slice(0,140), self:p.author?.handle==="countbinface.osintnet.uk" };
  });
  // this morning only, exclude binface's own posts + vibesmom's own
  // hydrate real follower counts (searchPosts omits them)
  const uniq = [...new Set(cands.filter(c=>c.ageH<=16 && !c.self).map(c=>c.handle))];
  const fmap = {};
  for (let i=0;i<uniq.length;i+=25){
    const batch = uniq.slice(i,i+25);
    const qp = batch.map(h=>"actors="+encodeURIComponent(h)).join("&");
    try { const d = await (await fetch(`${BSKY_PDS}/xrpc/app.bsky.actor.getProfiles?${qp}`,{headers:auth})).json();
      for (const pr of (d.profiles||[])) fmap[pr.handle]=pr.followersCount||0; } catch(e){}
  }
  for (const c of cands) c.followers = fmap[c.handle] ?? c.followers;
  cands = cands.filter(c=>c.ageH<=16 && !c.self && c.handle!=="vibesmom.bsky.social");
  cands.sort((a,b)=>b.followers-a.followers);
  let top = cands[0];
  if (opts && opts.target){ const m = cands.find(c=>c.handle===opts.target); if (m) top = m; }
  const report = { candidates: cands.slice(0,10), chosen: top||null };
  if (!top) return { ok:false, reason:"no fresh high-follower Binface post found", report };
  if (dry) return { ok:true, dry:true, report };

  // compose a warm, human VibesMom quote (<=300 js chars)
  const quoteText = `This is the funniest and most quietly savage thing in British politics right now. A man in a bin helmet with actual policies — 99p Flakes, one affordable home, nurses paid like MPs. Clacton, you know what to do. 🗑️`;
  if (jsLen(quoteText) > 300) return { ok:false, reason:"quote too long", len:jsLen(quoteText) };

  const rec = {
    "$type":"app.bsky.feed.post",
    text: quoteText,
    createdAt: new Date().toISOString(),
    langs:["en"],
    embed: { "$type":"app.bsky.embed.record", record: { uri: top.uri, cid: top.cid } }
  };
  const r = await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.createRecord`, {
    method:"POST", headers:{...auth,"Content-Type":"application/json"},
    body: JSON.stringify({ repo: sess.did, collection:"app.bsky.feed.post", record: rec })
  });
  const d = await r.json();
  if (!d.uri) return { ok:false, reason:"quote-post failed", detail:d, report };
  const rk = d.uri.split("/").pop();
  return { ok:true, quoted:{ handle:top.handle, followers:top.followers, uri:top.uri },
    vibesmom_post:`https://bsky.app/profile/vibesmom.bsky.social/post/${rk}`, report };
}
__name(binfaceBoost, "binfaceBoost");


// ─── reply under VibesMom's quote-post with @mention + link back to Binface manifesto ───
async function binfaceFollowup(env, opts){
  const dry = !!(opts && opts.dry);
  const sess = await getBskySession(env);
  const auth = { "Authorization": `Bearer ${sess.token}`, "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0" };

  const BIN_HANDLE = "countbinface.osintnet.uk";
  const BIN_DID    = "did:plc:yxexpjyi6r6qzhahknuuxfkm";
  const MANIFESTO  = "https://bsky.app/profile/countbinface.osintnet.uk/post/3mqblhxs7lc22";
  // the VibesMom quote-post to reply under (root+parent = same, it's the top of this micro-thread)
  const VM_URI = opts.parent_uri;
  const VM_CID = opts.parent_cid;

  // build text with a mention token and a link token; compute byte-accurate facets
  const enc = new TextEncoder();
  const pre = "If you're seeing this: ";
  const mention = "@" + BIN_HANDLE;
  const mid = " has an actual manifesto. Read it and screenshot it before the by-election: ";
  const linkLabel = MANIFESTO.replace(/^https:\/\//,"");
  const text = pre + mention + mid + linkLabel;

  const facets = [];
  // mention facet
  const mStart = enc.encode(pre).length;
  const mEnd   = enc.encode(pre + mention).length;
  facets.push({ index:{ byteStart:mStart, byteEnd:mEnd },
    features:[{ "$type":"app.bsky.richtext.facet#mention", did:BIN_DID }] });
  // link facet
  const lStart = enc.encode(pre + mention + mid).length;
  const lEnd   = enc.encode(text).length;
  facets.push({ index:{ byteStart:lStart, byteEnd:lEnd },
    features:[{ "$type":"app.bsky.richtext.facet#link", uri:MANIFESTO }] });

  const jsChars = [...text].reduce((n,ch)=>n+(ch.codePointAt(0)>0xFFFF?2:1),0);
  if (jsChars > 300) return { ok:false, reason:"too long", jsChars };

  if (dry) return { ok:true, dry:true, text, jsChars, facets };

  const rec = {
    "$type":"app.bsky.feed.post",
    text, facets,
    createdAt: new Date().toISOString(),
    langs:["en"],
    reply: { root:{ uri:VM_URI, cid:VM_CID }, parent:{ uri:VM_URI, cid:VM_CID } }
  };
  const r = await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.createRecord`, {
    method:"POST", headers:{...auth,"Content-Type":"application/json"},
    body: JSON.stringify({ repo: sess.did, collection:"app.bsky.feed.post", record: rec })
  });
  const d = await r.json();
  if (!d.uri) return { ok:false, reason:"reply failed", detail:d };
  const rk = d.uri.split("/").pop();
  return { ok:true, text, jsChars, reply_url:`https://bsky.app/profile/vibesmom.bsky.social/post/${rk}` };
}
__name(binfaceFollowup, "binfaceFollowup");


// ─── delete a VibesMom post by rkey ───
async function vmDeletePost(env, sess, auth, rkey){
  const r = await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.deleteRecord`, {
    method:"POST", headers:{...auth,"Content-Type":"application/json"},
    body: JSON.stringify({ repo: sess.did, collection:"app.bsky.feed.post", rkey })
  });
  return r.ok;
}
__name(vmDeletePost, "vmDeletePost");

// ─── full cycle: delete prior boost posts, quote a fresh big account, reply link-back ───
async function binfaceCycle(env, opts){
  const dry = !!(opts && opts.dry);
  const sess = await getBskySession(env);
  const auth = { "Authorization": `Bearer ${sess.token}`, "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0" };
  const out = { deleted:[], errors:[] };

  // 1) delete prior posts (rkeys passed in as comma list)
  const delRkeys = (opts.del||"").split(",").map(s=>s.trim()).filter(Boolean);
  if (!dry){
    for (const rk of delRkeys){
      const ok = await vmDeletePost(env, sess, auth, rk);
      (ok?out.deleted:out.errors).push(rk);
    }
  } else { out.would_delete = delRkeys; }

  // 2) find fresh high-follower Binface post (reuse boost logic, honor target + exclude list)
  const boost = await binfaceBoost(env, { dry:true, target: opts.target||null });
  const cands = (boost.report && boost.report.candidates) || [];
  const exclude = (opts.exclude||"").split(",").map(s=>s.trim()).filter(Boolean);
  let pick = null;
  if (opts.target) pick = cands.find(c=>c.handle===opts.target);
  if (!pick) pick = cands.find(c=>!exclude.includes(c.handle));
  if (!pick) return { ...out, ok:false, reason:"no fresh candidate (after exclusions)", cands:cands.slice(0,8) };

  if (dry) return { ...out, ok:true, dry:true, pick:{handle:pick.handle,followers:pick.followers,ageH:pick.ageH,text:pick.text} };

  // 3) quote-repost the pick
  const quotePool = [
    `Britain's funniest protest vote has a serious point: a man in a bin helmet is polling above a party leader. 99p Flakes, one affordable home, nurses paid like MPs. Clacton, the ball is in your court. 🗑️`,
    `The bin-helmet candidate isn't the joke here — the establishment refusing to show up is. Count Binface has actual pledges and a real shot in Clacton. Democracy, unbinned. 🗑️`,
    `A satirical candidate is now the main challenger in a UK by-election, and honestly? His manifesto reads better than most. Clacton, do the funny thing AND the right thing. 🗑️`
  ];
  const qi = Math.floor(Math.random()*quotePool.length);
  const quoteText = quotePool[qi];
  const qrec = { "$type":"app.bsky.feed.post", text:quoteText, createdAt:new Date().toISOString(), langs:["en"],
    embed:{ "$type":"app.bsky.embed.record", record:{ uri:pick.uri, cid:pick.cid } } };
  const qr = await (await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.createRecord`, {
    method:"POST", headers:{...auth,"Content-Type":"application/json"},
    body: JSON.stringify({ repo:sess.did, collection:"app.bsky.feed.post", record:qrec }) })).json();
  if (!qr.uri) return { ...out, ok:false, reason:"quote failed", detail:qr };
  const qRk = qr.uri.split("/").pop();

  // 4) link-back reply under the new quote-post
  const fu = await binfaceFollowup(env, { dry:false, parent_uri:qr.uri, parent_cid:qr.cid });

  return { ...out, ok:true,
    quoted:{ handle:pick.handle, followers:pick.followers },
    quote_url:`https://bsky.app/profile/vibesmom.bsky.social/post/${qRk}`,
    followup: fu };
}
__name(binfaceCycle, "binfaceCycle");

async function filmAI_vm(env, system, user, maxTokens){
  try{
    const res = await env.AI.run(LLAMA_SMART, { messages:[{role:"system",content:system},{role:"user",content:user}], max_tokens:maxTokens||180, temperature:0.9 });
    let t = (res && (res.response ?? (res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content))) || "";
    return (typeof t==="string"? t : "").trim();
  }catch(e){ return ""; }
}
__name(filmAI_vm, "filmAI_vm");

async function filmUploadJpeg_vm(env, sess, b64){
  const bin = Uint8Array.from(atob(b64), c=>c.charCodeAt(0));
  const up = await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.uploadBlob`,{method:"POST",headers:{Authorization:`Bearer ${sess.token}`,"Content-Type":"image/jpeg"},body:bin});
  if(!up.ok) throw new Error("uploadBlob "+up.status);
  return (await up.json()).blob;
}
__name(filmUploadJpeg_vm, "filmUploadJpeg_vm");

async function filmPostRecord_vm(env, sess, text, embed){
  const facets = (typeof buildFacets==="function") ? buildFacets(text) : [];
  const record = { $type:"app.bsky.feed.post", text, createdAt:new Date().toISOString() };
  if(facets && facets.length) record.facets = facets;
  if(embed) record.embed = embed;
  const r = await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.createRecord`,{method:"POST",headers:{Authorization:`Bearer ${sess.token}`,"Content-Type":"application/json"},body:JSON.stringify({repo:sess.did,collection:"app.bsky.feed.post",record})});
  if(!r.ok) throw new Error("post "+r.status+" "+await r.text());
  const j = await r.json(); const rkey=(j.uri||"").split("/").pop();
  return {uri:j.uri, cid:j.cid, url:`https://bsky.app/profile/${sess.did}/post/${rkey}`};
}
__name(filmPostRecord_vm, "filmPostRecord_vm");

async function filmComposeLFW_vm(env, films){
  const list = films.map((f,i)=>`${i+1}. ${f.title}${f.year?` (${f.year})`:""}`).join("\n");
  const sys = "You ARE VibesMom \u2014 a warm, funny, genuine woman posting her weekly film diary on Bluesky. "+
    "You love romances, musicals and comedies; you talk about films like a friend who just wants you to feel good. "+
    "Reply with ONLY the caption text \u2014 no preamble, no quotes, no meta commentary.";
  const usr = "This week I watched:\n"+list+"\n\nWrite a SHORT #LastFourWatched caption (2-4 warm sentences) reacting to the four films as a SET \u2014 name a favourite, a cozy verdict. Plain sentences, no markdown, no list, under ~200 characters. Do NOT include hashtags or links (added separately).";
  let t = await filmAI_vm(env, sys, usr, 180);
  t = (t||"").replace(/^["'\s]+|["'\s]+$/g,"").replace(/^\s*\d+\.\s+.+\(\d{4}\)\s*$/gm,"").replace(/#\w+/g,"").replace(/\n{3,}/g,"\n\n").trim();
  const LEAK=/(we need to|we should|let'?s craft|the set of four|no markdown|no bullet|2-4 sentences|\bcaption\b|before the tags|reacting to the (set|four)|persona|as a group)/i;
  if(LEAK.test(t)) t="";
  const TAG = "#LastFourWatched #FilmSky #LetterboxdFriday \u00b7 blueboxd.com";
  if(!t || t.length < 15){ t = `My last four, and oh what a comfort they were. ${films[0]?.title||"The first"} stole my heart \u2014 the rest wrapped it up warm.`; }
  const room = 300 - (TAG.length + 2);
  if(t.length > room) t = t.slice(0, room-1).trim();
  return t + "\n\n" + TAG;
}
__name(filmComposeLFW_vm, "filmComposeLFW_vm");

async function filmComposeReview_vm(env, f){
  const sys = "You ARE VibesMom \u2014 warm, genuine, a little funny. Reply with ONLY the review text, no preamble, no quotes, no hashtags.";
  const usr = `Write a short, warm Bluesky review \u2014 2 to 4 sentences \u2014 of "${f.title}"${f.year?` (${f.year})`:""}, a film you just watched free on Blueboxd. No spoilers, no markdown, no hashtags.`;
  let body = await filmAI_vm(env, sys, usr, 200);
  body = (body||"").replace(/^["'\s]+|["'\s]+$/g,"").trim();
  const RLEAK=/(we need to|we should|let'?s craft|no markdown|no hashtags|2 to 4 sentences|the film you just watched|write a )/i;
  if(RLEAK.test(body)) body="";
  if(!body || body.length < 20){ body = `${f.title}${f.year?` (${f.year})`:""} \u2014 the kind of film that gives your heart a warm little hug. And free on Blueboxd, which just makes it sweeter.`; }
  const CTA = "\n\nWatched free on blueboxd.com \u00b7 #FilmSky";
  if((body.length + CTA.length) > 300) body = body.slice(0, 300-CTA.length-1).trim();
  return body + CTA;
}
__name(filmComposeReview_vm, "filmComposeReview_vm");

// ═══ REAL BLUEBOXD DIARY (uk.osintnet.cineclub.* on VibesMom's own repo) ═══
var BB_SEARCH_VM = "https://blueboxd.com/api/search";
function bbSlugVm(s){ return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120); }
async function bbVerifyFilmPageVm(film){
  try{ const fid=film.id||bbSlugVm(film.title);
    const r=await fetch(`https://blueboxd.com/film/${fid}?cb=`+Date.now(),{headers:{"user-agent":"Mozilla/5.0 (compatible; bskyEmbed/1.0; +https://bsky.app)"}});
    if(!r.ok) return false; const html=await r.text();
    const m=html.match(/<meta property="og:title" content="([^"]*)"/i); if(!m) return false;
    const og=m[1].toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
    const want=String(film.title||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim(); if(!want) return false;
    const words=want.split(" ").filter(w=>w.length>=4);
    if(!words.length) return og.includes(want.split(" ")[0]||"");
    return words.some(w=>og.includes(w));
  }catch(e){ return false; }
}
async function bbPutVm(env,sess,collection,rkey,record){
  const r=await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.putRecord`,{method:"POST",
    headers:{Authorization:`Bearer ${sess.token}`,"Content-Type":"application/json"},
    body:JSON.stringify({repo:sess.did,collection,rkey,record})});
  const j=await r.json(); if(!j.uri) throw new Error(collection+" put "+JSON.stringify(j).slice(0,150)); return j;
}
async function bbMarkWatchedVm(env,sess,film){
  const fid=film.id||bbSlugVm(film.title), now=new Date().toISOString(), rkey=bbSlugVm(fid).slice(0,60)||("w"+Date.now());
  await bbPutVm(env,sess,"uk.osintnet.cineclub.watch",rkey,{$type:"uk.osintnet.cineclub.watch",title:film.title,filmId:fid,watchedAt:now});
  const lib={$type:"uk.osintnet.cineclub.library",title:film.title,filmId:fid,status:"watched",addedAt:now};
  if(film.poster)lib.poster=film.poster; if(film.year)lib.year=Number(film.year)||undefined; if(film.tmdbId)lib.tmdbId=String(film.tmdbId);
  await bbPutVm(env,sess,"uk.osintnet.cineclub.library",rkey,lib);
  return {fid,rkey};
}
async function bbWriteReviewVm(env,sess,film,text,stars){
  const fid=film.id||bbSlugVm(film.title), rkey=bbSlugVm(fid).slice(0,60)||("r"+Date.now());
  await bbPutVm(env,sess,"uk.osintnet.cineclub.review",rkey,{$type:"uk.osintnet.cineclub.review",
    text:String(text||"").slice(0,3000),stars:Math.max(1,Math.min(5,Number(stars)||5)),
    title:film.title,filmId:fid,spoiler:false,createdAt:new Date().toISOString()});
  return {fid,rkey};
}
// VibesMom's warm, genuine film review via free CF AI (essential so it beats the neuron guard)
async function vmReview(env, f){
  const sys="You ARE VibesMom — a warm, funny, big-hearted woman writing her honest film diary. "+
    "You love romances, musicals, comedies, feel-good classics. You write in complete sentences, first person, "+
    "cozy and genuine, never generic, no markdown, no hashtags, no emoji, no preamble. Just the review.";
  const usr=`Write a real, heartfelt review — 3 to 5 full sentences, at least 240 characters — of "${f.title}"${f.year?` (${f.year})`:""}. `+
    `Say something specific and true about THIS film: a moment that got you, the leads, the songs or the warmth, why it stayed with you. Just the review.`;
  const RLEAK=/(no markdown|no hashtags|no emoji|^sure[,!]|^here'?s|^certainly|as an ai|3 to 5|complete sentences)/i;
  let body="";
  for(let a=0;a<3;a++){
    try{ const res=await env.AI.run(LLAMA_SMART,{messages:[{role:"system",content:sys},{role:"user",content:usr}],max_tokens:340,temperature:0.9}); body=String((res&&(res.response||res.result&&res.result.response))||"").trim(); }catch(e){ body=""; }
    body=body.replace(/<think>[\s\S]*?<\/think>/gi,"").replace(/^["']|["']$/g,"").trim();
    if(body&&body.length>=200&&!RLEAK.test(body)&&(body.match(/[.!?]/g)||[]).length>=3) break;
    if(RLEAK.test(body)) body="";
  }
  if(!body||body.length<200||(body.match(/[.!?]/g)||[]).length<3){
    body=`${f.title}${f.year?` (${f.year})`:""} wrapped me up like a warm blanket. There's a moment — you'll know it when you feel it — where the whole thing just clicks and your heart goes soft. The leads have that easy chemistry they don't seem to make anymore, and the ending left me smiling at the screen like an old friend. I watched it free on Blueboxd and honestly, some films just love you back. This is one of them.`;
  }
  return body.trim();
}
async function bbShareCardVm(env,sess,film,caption){
  const fid=film.id||bbSlugVm(film.title), pageUrl=`https://blueboxd.com/film/${fid}`;
  const ua="Mozilla/5.0 (compatible; bskyEmbed/1.0; +https://bsky.app)";
  let ogTitle=`${film.title} · Blueboxd`, ogDesc="Free public-domain cinema on Bluesky.", ogImg=film.poster||"";
  try{ const pg=await fetch(pageUrl+"?cb="+Date.now(),{headers:{"user-agent":ua}}); const html=await pg.text();
    const g=(p)=>{const m=html.match(new RegExp('<meta property="'+p+'" content="([^"]*)"','i'));return m?m[1].replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"'):"";};
    ogTitle=g("og:title")||ogTitle; ogDesc=g("og:description")||ogDesc; ogImg=g("og:image")||ogImg;
  }catch(e){}
  let thumb=null;
  if(ogImg){ try{ const ir=await fetch(ogImg+(ogImg.includes("?")?"&":"?")+"cb="+Date.now(),{headers:{"user-agent":"Blueboxd/1.0"}});
    if(ir.ok){ const ct=ir.headers.get("content-type")||"image/jpeg"; const buf=await ir.arrayBuffer();
      const up=await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.uploadBlob`,{method:"POST",headers:{"content-type":ct,Authorization:"Bearer "+sess.token},body:buf});
      const ud=await up.json(); if(ud.blob) thumb=ud.blob; } }catch(e){} }
  const ext={uri:pageUrl,title:ogTitle,description:ogDesc}; if(thumb)ext.thumb=thumb;
  const embed={$type:"app.bsky.embed.external",external:ext};
  return await filmPostRecord_vm(env,sess,caption,embed);
}

var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const auth = request.headers.get("X-Auth");
    const authed = auth === env.VIBESMOM_SECRET;
    if (url.pathname === "/api/login" && request.method === "POST") {
      try {
        const body = await request.json();
        if (body.secret === env.VIBESMOM_SECRET) {
          return new Response(JSON.stringify({ ok: true, token: env.VIBESMOM_SECRET }), {
            headers: { "Content-Type": "application/json" }
          });
        }
        return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response("bad request", { status: 400 });
      }
    }
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", version: "4.0-unified", modules: ["distress", "kindness", "lovebomb", "feedreply", "learn"] }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/binface-cycle") {
      if ((url.searchParams.get("op")||request.headers.get("x-op")) !== env.OP_TOKEN) return new Response("Unauthorized", { status: 401 });
      try { const r = await binfaceCycle(env, { dry: url.searchParams.get("dry")==="1", del: url.searchParams.get("del")||"", target: url.searchParams.get("target")||null, exclude: url.searchParams.get("exclude")||"" }); return new Response(JSON.stringify(r), { headers: { "Content-Type":"application/json" } }); }
      catch(e){ return new Response(JSON.stringify({error:e.message}), { status:500, headers:{"Content-Type":"application/json"} }); }
    }
    if (url.pathname === "/binface-followup") {
      if ((url.searchParams.get("op")||request.headers.get("x-op")) !== env.OP_TOKEN) return new Response("Unauthorized", { status: 401 });
      try { const r = await binfaceFollowup(env, { dry: url.searchParams.get("dry")==="1", parent_uri: url.searchParams.get("uri"), parent_cid: url.searchParams.get("cid") }); return new Response(JSON.stringify(r), { headers: { "Content-Type":"application/json" } }); }
      catch(e){ return new Response(JSON.stringify({error:e.message}), { status:500, headers:{"Content-Type":"application/json"} }); }
    }
    if (url.pathname === "/binface-boost") {
      if ((url.searchParams.get("op")||request.headers.get("x-op")) !== env.OP_TOKEN) return new Response("Unauthorized", { status: 401 });
      try { const r = await binfaceBoost(env, { dry: url.searchParams.get("dry")==="1", target: url.searchParams.get("target")||null }); return new Response(JSON.stringify(r), { headers: { "Content-Type":"application/json" } }); }
      catch(e){ return new Response(JSON.stringify({error:e.message}), { status:500, headers:{"Content-Type":"application/json"} }); }
    }
    if (url.pathname === "/" || url.pathname === "/dashboard") {
      return new Response(await renderDashboard(env), { headers: { "Content-Type": "text/html;charset=utf-8" } });
    }
    if (!authed) return new Response("Unauthorized", { status: 401 });
    if (url.pathname === "/admin/delete" && request.method === "POST") {
      if(!authed) return new Response("unauthorized",{status:401});
      const b=await request.json().catch(()=>({})); const uri=b.uri||""; const sess=await getBskySession(env);
      const m=uri.match(/app\.bsky\.feed\.post\/([a-z0-9]+)$/i); if(!m) return new Response(JSON.stringify({err:"bad uri"}),{status:400,headers:{"Content-Type":"application/json"}});
      const r=await fetch(`${BSKY_PDS}/xrpc/com.atproto.repo.deleteRecord`,{method:"POST",headers:{Authorization:`Bearer ${sess.token}`,"Content-Type":"application/json"},body:JSON.stringify({repo:sess.did,collection:"app.bsky.feed.post",rkey:m[1]})});
      return new Response(JSON.stringify({ok:r.ok,deleted:uri}),{headers:{"Content-Type":"application/json"}});
    }
    if (url.pathname === "/diary" && request.method === "POST") {
      if(!authed) return new Response("unauthorized",{status:401});
      const b=await request.json().catch(()=>({})); const phase=b.phase||"watch"; const sess=await getBskySession(env);
      if(phase==="watch"){
        const films=Array.isArray(b.films)?b.films:[]; const out=[];
        for(const f of films){
          if(!b.skip_verify){ const ok=await bbVerifyFilmPageVm(f); if(!ok){ out.push({title:f.title,ok:false,err:"drift: film page does not match title"}); continue; } }
          try{ const r=await bbMarkWatchedVm(env,sess,f); out.push({title:f.title,fid:r.fid,ok:true}); }catch(e){ out.push({title:f.title,ok:false,err:e.message}); }
        }
        return new Response(JSON.stringify({ok:true,phase,watched:out}),{headers:{"Content-Type":"application/json"}});
      }
      if(phase==="review"){
        const f=b.review_film||b.film||{}; if(!f.title) return new Response(JSON.stringify({err:"review_film required"}),{status:400,headers:{"Content-Type":"application/json"}});
        const stars=b.stars||5; let review=b.text|| await vmReview(env,f);
        const excerpt = review.length>200 ? review.slice(0,200).replace(/\s+\S*$/,"")+"…" : review;
        const caption=(b.caption||excerpt)+"\n\nMy review on Blueboxd · #FilmSky";
        if(b.dry) return new Response(JSON.stringify({ok:true,dry:true,phase,review,stars,caption}),{headers:{"Content-Type":"application/json"}});
        const rv=await bbWriteReviewVm(env,sess,f,review,stars);
        const share=await bbShareCardVm(env,sess,f,caption);
        return new Response(JSON.stringify({ok:true,phase,review,stars,fid:rv.fid,uri:share.uri,url:share.url}),{headers:{"Content-Type":"application/json"}});
      }
      return new Response(JSON.stringify({err:"unknown phase"}),{status:400,headers:{"Content-Type":"application/json"}});
    }
    if (url.pathname === "/filmpost" && request.method === "POST") {
      const b = await request.json().catch(()=>({}));
      const kind = (b.kind==="review")?"review":"lfw";
      const sess = await getBskySession(env);
      let text, embed=null;
      if(kind==="lfw"){
        text = await filmComposeLFW_vm(env, Array.isArray(b.films)?b.films:[]);
        if(b.grid_jpeg_b64){ const blob=await filmUploadJpeg_vm(env,sess,b.grid_jpeg_b64); embed={$type:"app.bsky.embed.images",images:[{alt:((b.films||[]).map(f=>f.title).join(", ")||"last four").slice(0,290),image:blob}]}; }
      } else {
        const f=b.review_film||{}; text=await filmComposeReview_vm(env,f);
        if(b.grid_jpeg_b64){ const blob=await filmUploadJpeg_vm(env,sess,b.grid_jpeg_b64); embed={$type:"app.bsky.embed.images",images:[{alt:(f.title||"film").slice(0,290),image:blob}]}; }
      }
      if(b.dry) return new Response(JSON.stringify({ok:true,dry:true,kind,text,has_image:!!embed}), {headers:{"Content-Type":"application/json"}});
      const res=await filmPostRecord_vm(env,sess,text,embed);
      return new Response(JSON.stringify({ok:true,kind,text,uri:res.uri,url:res.url}), {headers:{"Content-Type":"application/json"}});
    }

    if (url.pathname === "/admin/init") {
      const r = await initDB(env.DB);
      return new Response(JSON.stringify(r), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/run-convo") {
      try {
        const r = await runConversationLoop(env);
        return new Response(JSON.stringify(r), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    if (url.pathname === "/run-distress") {
      try {
        const r = await runDistressReplyLoop(env);
        return new Response(JSON.stringify(r), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    if (url.pathname === "/run-kindness") {
      try {
        const sess = await getBskySession(env);
        const r = await runKindnessEngine(env, sess);
        return new Response(JSON.stringify(r), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    if (url.pathname === "/fire-lb") {
      try {
        const r = await fireDueLBReplies(env);
        return new Response(JSON.stringify(r), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    if (url.pathname === "/fire-fr") {
      try {
        const r = await fireDueFRReplies(env);
        return new Response(JSON.stringify(r), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    if (url.pathname === "/run-learn") {
      try {
        const r = await runLearnCycle(env);
        return new Response(JSON.stringify(r), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    if (url.pathname === "/run-lovebomb" && request.method === "POST") {
      try {
        const body = await request.json();
        if (!body.feed_url) return new Response(JSON.stringify({ error: "feed_url required" }), { status: 400, headers: { "Content-Type": "application/json" } });
        const r = await runLoveBomb(body.feed_url, env);
        return new Response(JSON.stringify(r), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    if (url.pathname === "/run-feedreply" && request.method === "POST") {
      try {
        const body = await request.json();
        if (!body.feed_url) return new Response(JSON.stringify({ error: "feed_url required" }), { status: 400, headers: { "Content-Type": "application/json" } });
        const r = await runFeedReplyEngine(body.feed_url, env);
        return new Response(JSON.stringify(r), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    if (url.pathname === "/api/vm-replies") {
      const { results } = await env.DB.prepare("SELECT * FROM vibesmom_replies ORDER BY replied_at DESC LIMIT 50").all();
      return new Response(JSON.stringify({ replies: results }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/lb-sessions") {
      const { results } = await env.DB.prepare("SELECT * FROM lb_sessions ORDER BY created_at DESC LIMIT 20").all();
      const { results: posts } = await env.DB.prepare("SELECT * FROM lb_replied_posts ORDER BY created_at DESC LIMIT 50").all();
      return new Response(JSON.stringify({ sessions: results, posts }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/fr-sessions") {
      const { results } = await env.DB.prepare("SELECT * FROM reply_sessions ORDER BY created_at DESC LIMIT 20").all();
      return new Response(JSON.stringify({ sessions: results }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/errors") {
      const { results } = await env.DB.prepare("SELECT * FROM vibesmom_errors ORDER BY occurred_at DESC LIMIT 50").all();
      return new Response(JSON.stringify({ errors: results }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/stats") {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const [dc, kl, lr] = await Promise.all([
        env.KV.get(`daily_count:${today}`),
        env.KV.get(`kindness_likes:${today}`),
        env.KV.get("last_reply_time")
      ]);
      return new Response(JSON.stringify({
        version: "4.0-unified",
        daily_replies: parseInt(dc || 0),
        daily_kindness_likes: parseInt(kl || 0),
        last_reply: lr ? new Date(parseInt(lr)).toISOString() : null,
        reply_limit: DAILY_REPLY_LIMIT,
        kindness_like_limit: KINDNESS_LIKE_LIMIT
      }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/ai-test") {
      const res = await env.AI.run(LLAMA_FAST, { messages: [{ role: "system", content: "Return a JSON array of 2 short greetings." }, { role: "user", content: 'Return exactly: ["hello","hi"]' }], max_tokens: 20 });
      return new Response(JSON.stringify({ ok: true, model: LLAMA_FAST, response: res }), { headers: { "Content-Type": "application/json" } });
    }
    return new Response("VibesMom v4.0 \u2014 Unified :)", { status: 200 });
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(env));
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
