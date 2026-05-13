var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var LLAMA_FAST = "@cf/meta/llama-3.1-8b-instruct";
var LLAMA_SMART = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
var RERANKER = "@cf/baai/bge-reranker-base";
var BSKY_PDS = "https://bsky.social";
var BSKY_PUBLIC = "https://public.api.bsky.app";
var DAILY_REPLY_LIMIT = 12;
var MIN_GAP_MS = 20 * 60 * 1e3;
var REPLY_RATE = 0.78;
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
Output ONLY the reply text. Nothing else. No quotes.`;
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
    await env.DB.prepare(
      "INSERT OR IGNORE INTO vibesmom_replies (id,post_uri,post_text,reply_text,author_handle,replied_at,status,error_msg) VALUES (?,?,?,?,?,?,?,?)"
    ).bind(
      data.id,
      data.post_uri,
      data.post_text?.slice(0, 300),
      data.reply_text,
      data.author_handle,
      (/* @__PURE__ */ new Date()).toISOString(),
      data.status,
      data.error_msg || null
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
  let ctx = "";
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
    if (replied >= 2) break;
    const posts = await searchPosts(query, sess.token);
    for (const post of posts) {
      if (replied >= 2) break;
      if (Math.random() > REPLY_RATE) continue;
      const text = post.record?.text || "";
      const did = post.author?.did;
      const handle = post.author?.handle;
      if (!text || !did || shouldSkip(text)) continue;
      if (scoreDistress(text) < 2) continue;
      const age = (Date.now() - new Date(post.indexedAt).getTime()) / 36e5;
      if (age > MAX_POST_AGE_H) continue;
      const profile = await getProfile(did);
      if (profile?.followersCount > MAX_FOLLOWERS) continue;
      if (await hasRepliedToPost(env, post.uri)) continue;
      if (await hasRepliedToAuthor(env, did)) continue;
      const crisis = isCrisis(text);
      try {
        const replyText = await composeDistressReply(env, text, handle, crisis);
        await postDistressReply(env, sess, post, replyText);
        await markReplied(env, post.uri, did);
        await incrementDailyCount(env);
        await logVMReply(env, { id: `vm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, post_uri: post.uri, post_text: text, reply_text: replyText, author_handle: handle, status: "posted" });
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
  const r = await fetch(`${BSKY_PDS}/xrpc/app.bsky.notification.listNotifications?limit=30`, {
    headers: { Authorization: `Bearer ${sess.token}` }
  });
  if (!r.ok) return { error: `Notifications ${r.status}` };
  const data = await r.json();
  const notifs = (data.notifications || []).filter((n) => n.reason === "reply" || n.reason === "like" || n.reason === "mention");
  const texts = notifs.map((n) => n.record?.text || "").filter(Boolean).slice(0, 20);
  if (!texts.length) return { skipped: "no_notifs" };
  const res = await env.AI.run(LLAMA_FAST, {
    messages: [{
      role: "system",
      content: "You analyze engagement patterns for a Bluesky reply bot. Given notification texts, identify 2-3 response patterns that seemed to get positive engagement (replies, likes) and 1-2 patterns to avoid. Return JSON: { working: string[], avoid: string[] }"
    }, { role: "user", content: texts.join("\n---\n") }],
    max_tokens: 300
  });
  try {
    const raw = repairSmartQuotes(stripJsonFences((res?.response || "").trim()));
    const parsed = JSON.parse(raw);
    // HARDENED: validate shape — must be arrays of non-empty strings 8+ chars
    // Bug fix May 13 2026: was spreading non-array values char-by-char into KV
    const cleanArr = (v) => {
      if (!Array.isArray(v)) return [];
      return v.filter(x => typeof x === "string" && x.trim().length >= 8 && x.trim().length <= 500)
              .map(x => x.trim());
    };
    const newAvoid = cleanArr(parsed?.avoid);
    const newWorking = cleanArr(parsed?.working);
    const existing_avoid = JSON.parse(await env.KV.get("VIBESMOM_AVOID_PATTERNS") || "[]");
    const existing_working = JSON.parse(await env.KV.get("VIBESMOM_WORKING_PATTERNS") || "[]");
    // Also clean existing in case of legacy corruption
    const cleanExistingAvoid = cleanArr(existing_avoid);
    const cleanExistingWorking = cleanArr(existing_working);
    // Prepend new (deduped), keep limits
    const merged_avoid = [...new Set([...cleanExistingAvoid, ...newAvoid])].slice(0, 10);
    const merged_working = [...new Set([...cleanExistingWorking, ...newWorking])].slice(0, 10);
    await env.KV.put("VIBESMOM_AVOID_PATTERNS", JSON.stringify(merged_avoid));
    await env.KV.put("VIBESMOM_WORKING_PATTERNS", JSON.stringify(merged_working));
    return { learned: { avoid: newAvoid.length, working: newWorking.length, total_avoid: merged_avoid.length, total_working: merged_working.length } };
  } catch (e) {
    return { error: e.message };
  }
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
      results.distress = await runDistressReplyLoop(env);
      results.kindness = await runKindnessEngine(env, sess);
    } catch (e) {
      await logVMError(env, "scheduledHandler", e.message);
      results.error = e.message;
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
    if (url.pathname === "/" || url.pathname === "/dashboard") {
      return new Response(await renderDashboard(env), { headers: { "Content-Type": "text/html;charset=utf-8" } });
    }
    if (!authed) return new Response("Unauthorized", { status: 401 });
    if (url.pathname === "/admin/init") {
      const r = await initDB(env.DB);
      return new Response(JSON.stringify(r), { headers: { "Content-Type": "application/json" } });
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
