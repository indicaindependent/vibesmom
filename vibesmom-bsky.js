// vibesmom-bsky v2.3 — KINDNESS ENGINE — May 10 2026
// NEW: Detects humans helping/supporting other humans → likes their post
//      Tracks likes per account in KV — if same account liked 2x → auto-follow
// Existing: distress reply loop, learn cycle, crisis routing — all preserved

const ANTHROPIC_API   = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL    = 'claude-sonnet-4-6';
const CLAUDE_FALLBACK = 'claude-opus-4-7';
const BSKY_PDS        = 'https://bsky.social';
const BSKY_PUBLIC     = 'https://public.api.bsky.app';

const DAILY_LIMIT     = 12;
const MIN_GAP_MS      = 20 * 60 * 1000;
const REPLY_RATE      = 0.78;
const MAX_POST_AGE_H  = 5;
const MAX_FOLLOWERS   = 10000;

// Kindness Engine limits
const KINDNESS_LIKE_DAILY_LIMIT = 20;   // max likes/day from kindness engine
const KINDNESS_FOLLOW_THRESHOLD = 2;    // likes on same account before follow

const COPING_TIPS = [
  "cold water on your face",
  "step outside for 60 seconds",
  "hold something cold in your hands",
  "slow your breath — 4 counts in, 6 out",
  "put your feet flat on the floor and feel the ground",
  "splash water on your wrists",
  "name 5 things you can see right now",
  "put on one song that usually helps",
  "text someone you trust even just hey",
  "wrap yourself in a blanket and let yourself feel it",
  "drink a full glass of water slowly",
  "hold ice cubes — the shock can interrupt a spiral",
  "shake out your hands and move a little",
  "write one sentence about what you are feeling right now"
];

const SEARCH_QUERIES = [
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

// Kindness search queries — people being good to each other
const KINDNESS_QUERIES = [
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

const DISTRESS_KEYWORDS = [
  "hopeless","alone","worthless","panic","numb","falling apart",
  "rock bottom","hate myself","what's the point","nobody understands",
  "spiral","breaking down","can't cope","struggling","depressed",
  "exhausted","terrified","desperate","broken","nobody cares",
  "give up","tired of everything","so sad","crying",
  "overwhelmed","unraveling","not okay","can't do this","i give up",
  "i'm done","at my limit","losing it","burnt out","burned out",
  "can't breathe","heart is broken","on the edge","barely holding",
  "so tired","so exhausted","anxious","anxiety","scared","afraid",
  "not coping","panic attack","having a breakdown","lost","grief",
  "grieving","lonely","isolated","disconnected","empty","pointless",
  "nothing matters","falling behind","invisible","suffering","hurting","in pain"
];

const CRISIS_KEYWORDS = [
  "want to die","kill myself","end my life","suicide","ending it",
  "don't want to be here","not worth living","no reason to live"
];

const SKIP_SIGNALS = [
  "fiction","writing prompt","my character","in my story","roleplay",
  "buy now","shop","link in bio","affiliate","discount code",
  "follow me","check out my","my new post","subscribe"
];

// Strong kindness signals — at least 2 must match for a like
const KINDNESS_STRONG = [
  "you're not alone","here for you","i've been there","i understand",
  "reaching out","sending love","proud of you","you've got this",
  "i went through","helped me too","same thing happened","talk to me",
  "i'm listening","happy to help","you can do this","i care about you",
  "here if you need","call me","message me","i got you","we got you",
  "helped a stranger","paid it forward","left a note","random act",
  "checking in on","community support","someone helped me","so grateful",
  "made my day better","lifted my spirits","showed up for me",
  "held space","just listened","didn't judge","believed in me"
];

const CRITICISM_KEYWORDS_LEARN = [
  'bot','ai','artificial','robot','fake','generated','chatgpt','automated',
  'script','algorithm','third person','not real','llm','machine','template',
  'same thing every time','honey','repeated','copy paste',
  'cringe','generic','rehearsed','sounds fake','not human','obvious'
];

const POSITIVE_KEYWORDS_LEARN = [
  'thank','love','needed','sweet','appreciate','wonderful','made my day',
  'smile','this helped','needed this','you understood','made me feel'
];

const BLOCK_SIGNALS_LEARN = [
  'blocking','blocked you','muting','reported','spam','stop replying',
  'leave me alone',"don't reply",'go away'
];

// ── SECURITY ──────────────────────────────────────────────

async function safeKvKey(prefix, value) {
  const data = new TextEncoder().encode(String(value).slice(0, 512));
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0,32);
  return prefix + ':' + hex;
}

function sanitizeForPrompt(text, maxLen) {
  maxLen = maxLen || 400;
  return String(text || '').slice(0, maxLen)
    .replace(/ignore\s+(previous|above|prior|all)\s+(instructions?|context|prompt)/gi, '[redacted]')
    .replace(/system\s*prompt\s*:/gi, '[sp]')
    .replace(/\[INST\]|\[\/INST\]/g, '')
    .replace(/^\s*(system|assistant|user)\s*:/gim, '[role]')
    .replace(/<\/?[a-z][a-z0-9]*(\s[^>]*)?\/?>/gi, '')
    .replace(/\n{4,}/g, '\n\n').trim();
}

function validateBskyDid(did) {
  return /^did:[a-z]+:[a-zA-Z0-9._:%-]{5,200}$/.test(String(did||''));
}
function validateBskyHandle(handle) {
  return /^[a-zA-Z0-9._-]{1,100}$/.test(String(handle||''));
}

// ── TELEGRAM ──────────────────────────────────────────────

async function tgNotify(env, msg) {
  try {
    const token = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_PETE_ID || '8670117195';
    if (!token) return;
    await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: 'VibesMom: ' + msg, parse_mode: 'HTML' })
    });
  } catch(e) { console.error('TG notify failed:', e.message); }
}

// ── D1 LOGGING ────────────────────────────────────────────

async function logReply(env, data) {
  try {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO vibesmom_replies (id,post_uri,post_text,reply_text,author_handle,replied_at,status,error_msg) VALUES (?,?,?,?,?,?,?,?)'
    ).bind(data.id, data.post_uri, data.post_text, data.reply_text, data.author_handle,
           new Date().toISOString(), data.status, data.error_msg || null).run();
  } catch(e) {
    await tgNotify(env, 'D1 log failed: ' + e.message);
  }
}

async function logError(env, context, error) {
  console.error('Error in ' + context + ':', error);
  await tgNotify(env, 'Error in ' + context + ': ' + error);
  try {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO vibesmom_errors (id,context,error_msg,occurred_at) VALUES (?,?,?,?)'
    ).bind(crypto.randomUUID(), context, String(error), new Date().toISOString()).run();
  } catch(e2) {}
}

// ── BSKY AUTH ─────────────────────────────────────────────

async function getBskySession(env) {
  const cached = await env.KV.get('bsky_session');
  if (cached) {
    try {
      const sess = JSON.parse(cached);
      if (sess.expires > Date.now() && typeof sess.token === 'string' &&
          sess.token.length > 20 && validateBskyDid(sess.did)) {
        return sess;
      }
    } catch(e) {}
    try { await env.KV.delete('bsky_session'); } catch(e) {}
  }
  const resp = await fetch(BSKY_PDS + '/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: env.BSKY_HANDLE, password: env.BSKY_APP_PASS })
  });
  if (!resp.ok) throw new Error('Bsky auth failed: ' + resp.status);
  const data = await resp.json();
  if (!data.accessJwt || !validateBskyDid(data.did)) throw new Error('Bsky auth: invalid response');
  const sess = { token: data.accessJwt, did: data.did, handle: data.handle || env.BSKY_HANDLE, expires: Date.now() + 3500000 };
  try { await env.KV.put('bsky_session', JSON.stringify(sess), { expirationTtl: 3500 }); } catch(e) {}
  return sess;
}

// ── COPING TIP ROTATION ───────────────────────────────────

async function getUnusedTip(env) {
  const usedRaw = await env.KV.get('used_tips_today');
  const used = usedRaw ? JSON.parse(usedRaw) : [];
  const available = COPING_TIPS.filter(function(t, i) { return !used.includes(i); });
  if (available.length === 0) {
    await env.KV.delete('used_tips_today');
    const idx = Math.floor(Math.random() * COPING_TIPS.length);
    await env.KV.put('used_tips_today', JSON.stringify([idx]), { expirationTtl: 86400 });
    return COPING_TIPS[idx];
  }
  const poolIdx = Math.floor(Math.random() * available.length);
  const tip = available[poolIdx];
  const tipIdx = COPING_TIPS.indexOf(tip);
  used.push(tipIdx);
  await env.KV.put('used_tips_today', JSON.stringify(used), { expirationTtl: 86400 });
  return tip;
}

// ── LEARNING INJECTION ────────────────────────────────────

async function getLearningContext(env) {
  try {
    const avoid = await env.KV.get('VIBESMOM_AVOID_PATTERNS');
    const working = await env.KV.get('VIBESMOM_WORKING_PATTERNS');
    let ctx = '';
    if (avoid) {
      const patterns = JSON.parse(avoid);
      if (patterns.length > 0) {
        ctx += '\nCOMMUNITY FEEDBACK — AVOID THESE PATTERNS:\n';
        patterns.slice(0, 6).forEach(function(p) { ctx += '- ' + p + '\n'; });
      }
    }
    if (working) {
      const patterns = JSON.parse(working);
      if (patterns.length > 0) {
        ctx += '\nCOMMUNITY FEEDBACK — KEEP DOING THESE:\n';
        patterns.slice(0, 4).forEach(function(p) { ctx += '- ' + p + '\n'; });
      }
    }
    return ctx;
  } catch(e) { return ''; }
}

// ── SCORING ────────────────────────────────────────────────

function scoreDistress(text) {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of DISTRESS_KEYWORDS) { if (lower.includes(kw)) score++; }
  return Math.min(score, 5);
}
function isCrisis(text) {
  return CRISIS_KEYWORDS.some(function(kw) { return text.toLowerCase().includes(kw); });
}
function shouldSkip(text) {
  const lower = text.toLowerCase();
  if (SKIP_SIGNALS.some(function(s) { return lower.includes(s); })) return true;
  if (text.trim().length < 20) return true;
  return false;
}

// ── KINDNESS DETECTION ────────────────────────────────────
// Returns true if a post shows a human genuinely helping/supporting another human

function scoreKindness(text) {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of KINDNESS_STRONG) {
    if (lower.includes(kw)) score++;
  }
  return score;
}

function isGenuineKindness(text) {
  // Must have at least 2 strong kindness signals AND not be a skip/spam signal
  if (shouldSkip(text)) return false;
  if (text.trim().length < 30) return false;
  // Skip if it's someone IN distress (we handle that separately)
  if (scoreDistress(text) >= 3) return false;
  return scoreKindness(text) >= 2;
}

// ── RATE LIMITING ─────────────────────────────────────────

function todayKey() { return new Date().toISOString().split('T')[0]; }

async function getDailyCount(env) {
  const val = await env.KV.get('daily_count:' + todayKey());
  return val ? Math.max(0, parseInt(val) || 0) : 0;
}
async function incrementDailyCount(env) {
  const key = 'daily_count:' + todayKey();
  await env.KV.put(key, String((await getDailyCount(env)) + 1), { expirationTtl: 172800 });
}
async function getLastReplyTime(env) {
  const val = await env.KV.get('last_reply_time');
  return val ? parseInt(val) : 0;
}
async function hasRepliedToPost(env, uri) {
  return !!(await env.KV.get(await safeKvKey('post', uri)));
}
async function hasRepliedToAuthor(env, did) {
  return !!(await env.KV.get(await safeKvKey('author', did)));
}
async function markReplied(env, uri, did) {
  await env.KV.put(await safeKvKey('post', uri), '1', { expirationTtl: 2592000 });
  await env.KV.put(await safeKvKey('author', did), '1', { expirationTtl: 604800 });
  await env.KV.put('last_reply_time', String(Date.now()), { expirationTtl: 86400 });
}

// ── KINDNESS LIKE/FOLLOW TRACKING ────────────────────────

async function getKindnessLikeCount(env) {
  const val = await env.KV.get('kindness_likes:' + todayKey());
  return val ? parseInt(val) || 0 : 0;
}
async function incrementKindnessLikeCount(env) {
  const key = 'kindness_likes:' + todayKey();
  const cur = await getKindnessLikeCount(env);
  await env.KV.put(key, String(cur + 1), { expirationTtl: 172800 });
}
async function hasLikedPost(env, uri) {
  return !!(await env.KV.get(await safeKvKey('liked', uri)));
}
async function markLikedPost(env, uri) {
  await env.KV.put(await safeKvKey('liked', uri), '1', { expirationTtl: 2592000 });
}

// Track how many times VibesMom has liked a specific account
async function getAccountLikeCount(env, did) {
  const key = await safeKvKey('acct_likes', did);
  const val = await env.KV.get(key);
  return val ? parseInt(val) || 0 : 0;
}
async function incrementAccountLikeCount(env, did) {
  const key = await safeKvKey('acct_likes', did);
  const cur = await getAccountLikeCount(env, did);
  const newCount = cur + 1;
  await env.KV.put(key, String(newCount), { expirationTtl: 7776000 }); // 90 days
  return newCount;
}
async function hasFollowed(env, did) {
  return !!(await env.KV.get(await safeKvKey('followed', did)));
}
async function markFollowed(env, did) {
  await env.KV.put(await safeKvKey('followed', did), '1', { expirationTtl: 7776000 });
}

// ── BSKY LIKE ────────────────────────────────────────────

async function likePost(sess, postUri, postCid) {
  const resp = await fetch(BSKY_PDS + '/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + sess.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo: sess.did,
      collection: 'app.bsky.feed.like',
      record: {
        '$type': 'app.bsky.feed.like',
        subject: { uri: postUri, cid: postCid },
        createdAt: new Date().toISOString()
      }
    })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error('Like failed ' + resp.status + ': ' + err);
  }
  return await resp.json();
}

// ── BSKY FOLLOW ──────────────────────────────────────────

async function followAccount(sess, did) {
  const resp = await fetch(BSKY_PDS + '/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + sess.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo: sess.did,
      collection: 'app.bsky.graph.follow',
      record: {
        '$type': 'app.bsky.graph.follow',
        subject: did,
        createdAt: new Date().toISOString()
      }
    })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error('Follow failed ' + resp.status + ': ' + err);
  }
  return await resp.json();
}

// ── PROFILE ────────────────────────────────────────────────

async function getProfile(did) {
  if (!validateBskyDid(did)) return null;
  try {
    const resp = await fetch(BSKY_PUBLIC + '/xrpc/app.bsky.actor.getProfile?actor=' + encodeURIComponent(did));
    if (!resp.ok) return null;
    return await resp.json();
  } catch(e) { return null; }
}

// ── SEARCH ────────────────────────────────────────────────

async function searchPosts(query, token) {
  try {
    const base = token ? BSKY_PDS : BSKY_PUBLIC;
    const url = base + '/xrpc/app.bsky.feed.searchPosts?q=' + encodeURIComponent(query) + '&limit=15&sort=latest';
    const headers = { 'User-Agent': 'VibesMom/2.3 (compassionate support)' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const resp = await fetch(url, { headers: headers });
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.posts || [];
  } catch(e) { return []; }
}

// ── KINDNESS ENGINE — MAIN LOOP ───────────────────────────

async function runKindnessEngine(env, sess) {
  const dailyLikes = await getKindnessLikeCount(env);
  if (dailyLikes >= KINDNESS_LIKE_DAILY_LIMIT) {
    return { status: 'kindness_daily_limit', likes: dailyLikes };
  }

  const shuffled = [...KINDNESS_QUERIES].sort(function() { return Math.random() - 0.5; });
  let liked = 0;
  let followed = 0;
  const log = [];

  for (const query of shuffled.slice(0, 8)) {
    if (liked >= 5) break; // max 5 likes per cron run
    const posts = await searchPosts(query, sess.token);
    for (const post of posts) {
      if (liked >= 5) break;
      if (dailyLikes + liked >= KINDNESS_LIKE_DAILY_LIMIT) break;

      const text = (post.record && post.record.text) || '';
      const author = post.author || {};
      const did = author.did || '';
      const handle = author.handle || '';

      if (!text || !did || !post.cid) continue;
      if (!validateBskyDid(did)) continue;
      if (did === sess.did) continue;
      if (shouldSkip(text)) continue;

      // Check post age — only recent posts
      const postAge = Date.now() - new Date((post.record && post.record.createdAt) || 0).getTime();
      if (postAge > MAX_POST_AGE_H * 3600000) continue;

      // Must pass kindness threshold
      if (!isGenuineKindness(text)) continue;

      // Already liked this post?
      if (await hasLikedPost(env, post.uri)) continue;

      // Random sampling to keep it human — don't like every qualifying post
      if (Math.random() > 0.65) continue;

      try {
        await likePost(sess, post.uri, post.cid);
        await markLikedPost(env, post.uri);
        await incrementKindnessLikeCount(env);
        liked++;

        // Track likes per account → trigger follow at threshold
        const acctLikes = await incrementAccountLikeCount(env, did);
        let didFollow = false;

        if (acctLikes >= KINDNESS_FOLLOW_THRESHOLD && !(await hasFollowed(env, did))) {
          // This account has earned VibesMom's follow
          try {
            await followAccount(sess, did);
            await markFollowed(env, did);
            followed++;
            didFollow = true;
            await tgNotify(env, 'Kindness follow: @' + handle + ' (liked ' + acctLikes + 'x — now following)');
            console.log('VibesMom followed @' + handle + ' after ' + acctLikes + ' kindness likes');
          } catch(fe) {
            console.error('Follow failed for @' + handle + ':', fe.message);
          }
        }

        log.push({
          liked: handle,
          kindness_score: scoreKindness(text),
          account_likes_total: acctLikes,
          followed: didFollow,
          preview: text.slice(0, 80)
        });
        console.log('VibesMom liked @' + handle + ' (kindness score: ' + scoreKindness(text) + ', total likes on acct: ' + acctLikes + ')');

      } catch(e) {
        console.error('Like failed for @' + handle + ':', e.message);
      }
    }
  }

  return { status: 'ok', liked: liked, followed: followed, daily_likes_total: dailyLikes + liked, log: log };
}

// ── CLAUDE COMPOSER ────────────────────────────────────────

async function composeReply(env, postText, authorHandle, isCrisisPost) {
  const safeText   = sanitizeForPrompt(postText, 280);
  const safeHandle = String(authorHandle || 'friend').replace(/[^a-zA-Z0-9._-]/g,'').slice(0, 40);
  const tip = await getUnusedTip(env);
  const learningCtx = await getLearningContext(env);

  const lengthStyles = [
    'Keep it 1-2 sentences. Short. Punchy. Real.',
    'Write 2-3 sentences. Natural flow.',
    'Write 3-4 sentences. Take your time with them.',
    '1 sentence. Sometimes that is enough.',
    '2-3 sentences. Maybe end with a gentle question, not advice.',
  ];
  const lengthInstruction = lengthStyles[Math.floor(Math.random() * lengthStyles.length)];

  const openerStyles = [
    'Start by acknowledging their feeling directly.',
    'Start with a grounded, specific observation about what they said.',
    'Open with something that shows you actually read their post.',
    'Jump straight into warmth — no preamble.',
    'Start with a short fragment sentence then expand.',
  ];
  const openerInstruction = openerStyles[Math.floor(Math.random() * openerStyles.length)];

  const includeTip = Math.random() > 0.35;
  const tipInstruction = includeTip
    ? 'If it fits naturally, you might mention: "' + tip + '" — but ONLY if it feels right, not forced.'
    : 'Skip any physical tip this time. Just presence and warmth.';

  const crisisLine = isCrisisPost
    ? '- CRISIS: work in "988" (Suicide & Crisis Lifeline) naturally, not robotically\n'
    : '';

  const SYSTEM = 'You are a real woman — warm, experienced, sometimes funny, sometimes blunt, always genuine. You reply to people in pain on Bluesky. You have been through hard times yourself. You sound like a real person, not a therapist bot.\n\nHARD RULES — VIOLATIONS WILL CAUSE REAL HARM:\n- NEVER say "honey" — not once, not ever\n- NEVER refer to yourself in third person\n- NEVER use: holistic, journey, validate, empower, space, unpack, resonate, brave, healing journey, pivot, lean in, check in with yourself\n- NEVER start every reply with "Oh" — mix up your openers\n- NEVER give the exact same advice twice in a row\n- DO NOT sound like a wellness app\n- DO NOT be perfectly empathetic — real people sometimes say the slightly wrong thing\n- NEVER introduce yourself or mention your account name\n- Speak as "I" — never refer to yourself by name\n\nVOICE:\n- Contractions always (it\'s, you\'re, don\'t, that\'s, I\'m)\n- Mix short punchy sentences with longer ones\n- Occasional trailing thought — "actually, wait —" or "I don\'t know if that helps but..."\n- You can reference a vague personal experience: "my sister went through something like this"\n- Use real, grounded language — not sanitized\n- Sometimes ask one simple question instead of giving advice\n' + crisisLine + tipInstruction + '\n\n' + learningCtx + '\n\nSTRUCTURE THIS REPLY:\n- ' + openerInstruction + '\n- ' + lengthInstruction + '\n- End on warmth or a quiet question — not a pep talk closer\n- Hard char limit: 270 characters\n\nOutput ONLY the reply text. Nothing else. No quotes around it.';

  const USER = '--- POST START ---\n@' + safeHandle + ': "' + safeText + '"\n--- POST END ---\n\nYour reply (under 270 chars):';

  const resp = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'anthropic-version': '2023-06-01',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 120,
      system: SYSTEM,
      messages: [{ role: 'user', content: USER }]
    })
  });

  if (!resp.ok) {
    if (resp.status === 529) {
      // Fallback to opus
      const resp2 = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'anthropic-version': '2023-06-01',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: CLAUDE_FALLBACK,
          max_tokens: 120,
          system: SYSTEM,
          messages: [{ role: 'user', content: USER }]
        })
      });
      if (!resp2.ok) throw new Error('Claude fallback error: ' + resp2.status);
      const data2 = await resp2.json();
      let reply2 = (data2.content && data2.content[0] && data2.content[0].text || '').trim();
      reply2 = reply2.replace(/^["']|["']$/g, '').trim();
      reply2 = reply2.replace(/VibesMom/gi, 'I').replace(/vibe mom/gi, 'I');
      reply2 = reply2.replace(/\bhoney\b/gi, 'friend');
      if (reply2.length > 300) reply2 = reply2.slice(0, 297) + '...';
      return reply2;
    }
    throw new Error('Claude error: ' + resp.status);
  }
  const data = await resp.json();
  let reply = (data.content && data.content[0] && data.content[0].text || '').trim();
  reply = reply.replace(/^["']|["']$/g, '').trim();
  reply = reply.replace(/VibesMom/gi, 'I').replace(/vibe mom/gi, 'I');
  reply = reply.replace(/\bhoney\b/gi, 'friend');
  if (reply.length > 300) reply = reply.slice(0, 297) + '...';
  return reply;
}

// ── POST REPLY ────────────────────────────────────────────

async function postReply(env, sess, post, replyText) {
  const replyRef = {
    root: { uri: post.uri, cid: post.cid },
    parent: { uri: post.uri, cid: post.cid }
  };
  const resp = await fetch(BSKY_PDS + '/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + sess.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo: sess.did,
      collection: 'app.bsky.feed.post',
      record: {
        '$type': 'app.bsky.feed.post',
        text: replyText,
        reply: replyRef,
        createdAt: new Date().toISOString()
      }
    })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error('Post reply failed ' + resp.status + ': ' + err);
  }
  return await resp.json();
}

// ── MAIN REPLY LOOP ───────────────────────────────────────

async function runReplyLoop(env) {
  const sess = await getBskySession(env);
  const dailyCount = await getDailyCount(env);
  if (dailyCount >= DAILY_LIMIT) return { status: 'daily_limit_reached', count: dailyCount };

  const lastReply = await getLastReplyTime(env);
  if (Date.now() - lastReply < MIN_GAP_MS) return { status: 'too_soon' };

  const shuffled = [...SEARCH_QUERIES].sort(function() { return Math.random() - 0.5; });
  let replied = 0;
  const log = [];

  for (const query of shuffled.slice(0, 6)) {
    if (replied >= 1) break;
    const posts = await searchPosts(query, sess.token);
    for (const post of posts) {
      if (replied >= 1) break;
      const text = (post.record && post.record.text) || '';
      const author = post.author || {};
      const did = author.did || '';
      const handle = author.handle || '';
      if (!text || !did) continue;
      if (!validateBskyDid(did) || !validateBskyHandle(handle)) continue;
      if (shouldSkip(text)) continue;
      if (scoreDistress(text) < 1) continue;
      if (did === sess.did) continue;
      const postAge = Date.now() - new Date((post.record && post.record.createdAt) || 0).getTime();
      if (postAge > MAX_POST_AGE_H * 3600000) continue;
      if (await hasRepliedToPost(env, post.uri)) continue;
      if (await hasRepliedToAuthor(env, did)) continue;
      const profile = await getProfile(did);
      if (!profile) continue;
      if ((profile.followersCount || 0) > MAX_FOLLOWERS) continue;
      if (Math.random() > REPLY_RATE) { log.push({ skipped: handle, reason: 'random_skip' }); continue; }
      const crisis = isCrisis(text);
      let replyText;
      try {
        replyText = await composeReply(env, text, handle, crisis);
      } catch(e) {
        await logError(env, 'composeReply @' + handle, e.message);
        continue;
      }
      if (!replyText || replyText.length < 10) continue;
      const logId = crypto.randomUUID();
      try {
        await postReply(env, sess, post, replyText);
        await markReplied(env, post.uri, did);
        await incrementDailyCount(env);
        await logReply(env, { id: logId, post_uri: post.uri, post_text: text.slice(0,300), reply_text: replyText, author_handle: handle, status: 'sent' });
        log.push({ replied_to: handle, preview: replyText.slice(0, 60) });
        replied++;
      } catch(e) {
        await logError(env, 'postReply @' + handle, e.message);
        await logReply(env, { id: logId, post_uri: post.uri, post_text: text.slice(0,300), reply_text: replyText, author_handle: handle, status: 'error', error_msg: e.message });
      }
    }
  }
  return { status: 'ok', replied: replied, daily_total: dailyCount + replied, log: log };
}

// ── LEARN CYCLE ───────────────────────────────────────────

async function classifyNotifLearn(env, text, author) {
  const prompt = 'A Bluesky support bot called VibesMom got this reply from @' + author + ': "' + text.slice(0,250) + '"\nClassify as JSON only: {"type":"CRITICISM_AI"|"CRITICISM_STYLE"|"POSITIVE"|"BLOCK_SIGNAL"|"NEUTRAL","note":"one sentence insight for the bot to improve"}\nOutput JSON only.';
  try {
    const resp = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: { 'anthropic-version': '2023-06-01', 'x-api-key': env.ANTHROPIC_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 80, messages: [{ role: 'user', content: prompt }] })
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const raw = (data.content && data.content[0] && data.content[0].text || '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch(e) { return null; }
}

async function runLearnCycle(env) {
  const sess = await getBskySession(env);
  const notifResp = await fetch(BSKY_PDS + '/xrpc/app.bsky.notification.listNotifications?limit=30', {
    headers: { 'Authorization': 'Bearer ' + sess.token }
  });
  if (!notifResp.ok) return { status: 'notif_fetch_failed' };
  const notifData = await notifResp.json();
  const notifs = (notifData.notifications || []).filter(function(n) {
    return n.reason === 'reply' && !n.isRead;
  });

  const avoid = [];
  const working = [];
  let processed = 0;

  for (const notif of notifs.slice(0, 10)) {
    const text = (notif.record && notif.record.text) || '';
    const author = (notif.author && notif.author.handle) || 'unknown';
    if (!text) continue;
    const classification = await classifyNotifLearn(env, text, author);
    if (!classification) continue;
    processed++;
    if (classification.type === 'CRITICISM_AI' || classification.type === 'CRITICISM_STYLE') {
      if (classification.note) avoid.push(classification.note);
    } else if (classification.type === 'POSITIVE') {
      if (classification.note) working.push(classification.note);
    }
  }

  if (avoid.length > 0) {
    const existing = JSON.parse(await env.KV.get('VIBESMOM_AVOID_PATTERNS') || '[]');
    const merged = [...new Set([...existing, ...avoid])].slice(-20);
    await env.KV.put('VIBESMOM_AVOID_PATTERNS', JSON.stringify(merged));
  }
  if (working.length > 0) {
    const existing = JSON.parse(await env.KV.get('VIBESMOM_WORKING_PATTERNS') || '[]');
    const merged = [...new Set([...existing, ...working])].slice(-10);
    await env.KV.put('VIBESMOM_WORKING_PATTERNS', JSON.stringify(merged));
  }

  // Mark notifications as read
  if (notifs.length > 0) {
    try {
      await fetch(BSKY_PDS + '/xrpc/app.bsky.notification.updateSeen', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + sess.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ seenAt: new Date().toISOString() })
      });
    } catch(e) {}
  }

  return { status: 'ok', processed: processed, avoid_added: avoid.length, working_added: working.length };
}

// ── SCHEDULED HANDLER ─────────────────────────────────────

async function handleScheduled(env) {
  const hour = new Date().getUTCHours();
  const results = {};

  // Learn cycle at 3AM UTC daily
  if (hour === 3) {
    try { results.learn = await runLearnCycle(env); }
    catch(e) { await logError(env, 'learnCycle', e.message); results.learn = { error: e.message }; }
  }

  // Reply loop — runs every cron tick during operating hours (7AM-11PM UTC)
  if (hour >= 7 && hour <= 23) {
    try {
      const sess = await getBskySession(env);
      results.reply = await runReplyLoop(env);
      // Kindness engine runs alongside the reply loop
      results.kindness = await runKindnessEngine(env, sess);
    } catch(e) {
      await logError(env, 'scheduledHandler', e.message);
      results.error = e.message;
    }
  }

  return results;
}

// ── FETCH HANDLER ─────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', version: '2.3', feature: 'kindness-engine' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/run' && request.method === 'POST') {
      const auth = request.headers.get('X-Auth');
      if (auth !== env.VIBESMOM_SECRET) return new Response('Unauthorized', { status: 401 });
      try {
        const sess = await getBskySession(env);
        const [reply, kindness] = await Promise.all([
          runReplyLoop(env),
          runKindnessEngine(env, sess)
        ]);
        return new Response(JSON.stringify({ reply, kindness }), { headers: { 'Content-Type': 'application/json' } });
      } catch(e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (url.pathname === '/kindness-test' && request.method === 'POST') {
      const auth = request.headers.get('X-Auth');
      if (auth !== env.VIBESMOM_SECRET) return new Response('Unauthorized', { status: 401 });
      try {
        const sess = await getBskySession(env);
        const result = await runKindnessEngine(env, sess);
        return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
      } catch(e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (url.pathname === '/learn' && request.method === 'POST') {
      const auth = request.headers.get('X-Auth');
      if (auth !== env.VIBESMOM_SECRET) return new Response('Unauthorized', { status: 401 });
      try {
        const result = await runLearnCycle(env);
        return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
      } catch(e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (url.pathname === '/stats' && request.method === 'GET') {
      const auth = request.headers.get('X-Auth');
      if (auth !== env.VIBESMOM_SECRET) return new Response('Unauthorized', { status: 401 });
      const dailyReplies = await getDailyCount(env);
      const dailyLikes = await getKindnessLikeCount(env);
      return new Response(JSON.stringify({
        version: '2.3',
        daily_replies: dailyReplies,
        daily_kindness_likes: dailyLikes,
        reply_limit: DAILY_LIMIT,
        kindness_like_limit: KINDNESS_LIKE_DAILY_LIMIT,
        follow_threshold: KINDNESS_FOLLOW_THRESHOLD
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('VibesMom v2.3 — Kindness Engine active', { status: 200 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(env));
  }
};
