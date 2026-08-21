// vibesmom-learn — Daily notification auditor + self-learning engine
// Runs: once daily at 11PM ET (03:00 UTC)
// Reads Bluesky notifications, classifies criticism, updates KV learning store,
// sends Telegram digest to the operator

const AI_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const BSKY_PDS      = 'https://bsky.social';

const CRITICISM_KEYWORDS = [
  'bot','ai','artificial','robot','fake','generated','chatgpt','automated',
  'script','algorithm','third person','not real','llm','machine','template',
  'same thing every time','honey','repeated','copy paste','corporate',
  'cringe','generic','rehearsed','sounds fake','not human','obvious'
];

const POSITIVE_KEYWORDS = [
  'thank','love','needed','sweet','beautiful','appreciate','wonderful',
  'amazing','made my day','smile','this helped','you\'re amazing',
  'needed this','you understood','this is real','made me feel'
];

const BLOCK_SIGNALS = [
  'blocking','blocked you','muting','muted','reported','spam','stop replying',
  'leave me alone','don\'t reply','unfollow','go away'
];

// ── TELEGRAM ──────────────────────────────────────────────

async function tgSend(env, msg) {
  try {
    // Suppress noisy Anthropic/Workers AI quota errors — the operator asked not to be paged
    const msgStr = String(msg || '');
    if (msgStr.includes('credit balance') || msgStr.includes('credit_balance')
        || (msgStr.includes('failed') && (msgStr.includes('400') || msgStr.includes('402') || msgStr.includes('429')))
        || msgStr.includes('AiError') || msgStr.includes('neurons')) {
      console.warn('[tg suppressed]', msgStr.slice(0,200));
      return;
    }
    const token = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_PETE_ID || '';  // no hardcoded fallback (sanitized)
  if (!chatId) return;  // no destination configured — nothing to send
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' })
    });
  } catch (e) {
    console.error('TG send failed:', e.message);
  }
}

// ── BSKY AUTH ─────────────────────────────────────────────

async function getBskySession(env) {
  const resp = await fetch(`${BSKY_PDS}/xrpc/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: env.BSKY_HANDLE, password: env.BSKY_APP_PASS })
  });
  if (!resp.ok) throw new Error(`Bsky auth failed: ${resp.status}`);
  const data = await resp.json();
  return { token: data.accessJwt, did: data.did };
}

// ── FETCH NOTIFICATIONS ───────────────────────────────────

async function fetchNotifications(token, limit = 50) {
  const resp = await fetch(
    `${BSKY_PDS}/xrpc/app.bsky.notification.listNotifications?limit=${limit}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  if (!resp.ok) throw new Error(`Notifications fetch failed: ${resp.status}`);
  const data = await resp.json();
  return data.notifications || [];
}

// ── CLASSIFY WITH CLAUDE ──────────────────────────────────

async function classifyNotification(env, notif) {
  const text = notif.record?.text || '';
  if (!text || text.length < 5) return null;

  const author = notif.author?.handle || 'unknown';
  const reason = notif.reason || 'reply';

  const prompt = `A user replied to a Bluesky bot called VibesMom (a support bot).

Reply from @${author}: "${text.slice(0, 300)}"

Classify this reply and extract lessons. Return JSON only:
{
  "type": "CRITICISM_AI" | "CRITICISM_CONTENT" | "CRITICISM_REPETITIVE" | "BLOCK_SIGNAL" | "POSITIVE" | "NEUTRAL",
  "is_block_threat": boolean,
  "extracted_lesson": "one sentence — what should VibesMom change or keep doing?",
  "severity": 1-5
}

If POSITIVE: extracted_lesson = what specifically resonated.
If CRITICISM: extracted_lesson = exactly what pattern to avoid.
If NEUTRAL: extracted_lesson = null.

Return ONLY valid JSON.`;

  try {
    const aiResp = await env.AI.run(AI_MODEL, {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    });
    let raw = (aiResp.response || '').trim();
    // Strip markdown fences if model wraps in ```json ... ```
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    // Repair smart quotes
    raw = raw.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
    const jsonMatch = raw.match(/\{[\s\S]+\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('[classify] AI error:', e.message);
    return null;
  }
}

// ── UPDATE KV PATTERNS ────────────────────────────────────

async function updateKvPatterns(env, allClassified) {
  const avoid = [];
  const working = [];

  for (const item of allClassified) {
    if (!item.classification || !item.classification.extracted_lesson) continue;
    const c = item.classification;
    const lesson = c.extracted_lesson;

    if (['CRITICISM_AI','CRITICISM_CONTENT','CRITICISM_REPETITIVE','BLOCK_SIGNAL'].includes(c.type)) {
      if (lesson && !avoid.includes(lesson)) avoid.push(lesson);
    } else if (c.type === 'POSITIVE') {
      if (lesson && !working.includes(lesson)) working.push(lesson);
    }
  }

  // HARDENED May 13 2026: validate arrays of non-empty strings, reject anything else
  const cleanArr = (v) => {
    if (!Array.isArray(v)) return [];
    return v.filter(x => typeof x === 'string' && x.trim().length >= 8 && x.trim().length <= 500)
            .map(x => x.trim());
  };
  const existingAvoid = cleanArr(JSON.parse(await env.KV.get('VIBESMOM_AVOID_PATTERNS') || '[]'));
  const existingWorking = cleanArr(JSON.parse(await env.KV.get('VIBESMOM_WORKING_PATTERNS') || '[]'));
  const cleanNewAvoid = cleanArr(avoid);
  const cleanNewWorking = cleanArr(working);

  // Prepend new lessons so recent ones win in slice
  const mergedAvoid = [...new Set([...cleanNewAvoid, ...existingAvoid])].slice(0, 10);
  const mergedWorking = [...new Set([...cleanNewWorking, ...existingWorking])].slice(0, 8);

  await env.KV.put('VIBESMOM_AVOID_PATTERNS', JSON.stringify(mergedAvoid));
  await env.KV.put('VIBESMOM_WORKING_PATTERNS', JSON.stringify(mergedWorking));

  return { avoid: mergedAvoid, working: mergedWorking };
}

// ── D1 SAVE LESSONS ───────────────────────────────────────

async function saveLessons(env, allClassified) {
  for (const item of allClassified) {
    if (!item.classification) continue;
    const c = item.classification;
    if (c.type === 'NEUTRAL') continue;
    try {
      await env.DB.prepare(
        `INSERT OR IGNORE INTO vibesmom_lessons
         (id, detected_at, lesson_type, critic_comment, extracted_lesson, applied)
         VALUES (?, ?, ?, ?, ?, 0)`
      ).bind(
        crypto.randomUUID(),
        new Date().toISOString(),
        c.type,
        item.text?.slice(0, 300) || '',
        c.extracted_lesson || ''
      ).run();
    } catch (e) {
      console.error('D1 lesson save failed:', e.message);
    }
  }
}

// ── MAIN ──────────────────────────────────────────────────


// ── KV INTEGRITY GUARD (added May 13 2026) ────────────────
async function kvIntegrityCheck(env) {
  const issues = [];
  for (const key of ['VIBESMOM_AVOID_PATTERNS', 'VIBESMOM_WORKING_PATTERNS']) {
    try {
      const raw = await env.KV.get(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        issues.push(`${key}: not an array`);
        continue;
      }
      const bad = parsed.filter(x => typeof x !== 'string' || x.trim().length < 8 || x.trim().length > 500);
      if (bad.length > 0) {
        issues.push(`${key}: ${bad.length} corrupt entries (e.g. ${JSON.stringify(bad[0]).slice(0,40)})`);
        // Auto-heal: keep only valid entries
        const clean = parsed.filter(x => typeof x === 'string' && x.trim().length >= 8 && x.trim().length <= 500).map(x => x.trim());
        await env.KV.put(key, JSON.stringify(clean));
        issues.push(`  → auto-healed to ${clean.length} valid entries`);
      }
    } catch (e) {
      issues.push(`${key}: parse error — ${e.message}`);
      await env.KV.put(key, '[]');
      issues.push(`  → reset to empty`);
    }
  }
  if (issues.length > 0) {
    await tgSend(env, `🛡️ <b>VibesMom KV Integrity Alert</b>\n\n${issues.join('\n')}`);
  }
  return issues;
}

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

// ── WORKER ────────────────────────────────────────────────


// ─── TELEGRAM ERROR ALERT ─────────────────────────────────────────────────────
async function sendTelegramAlert(env, msg, prefix) {
  try {
    const BOT  = (env && env.TELEGRAM_BOT_TOKEN) || "__REDACTED_TG_BOT__";
    const CHAT = (env && env.TELEGRAM_PETE_ID) || '';  // no hardcoded fallback (sanitized)
    const tag  = prefix || 'WORKER';
    await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT, text: `[${tag}] ${msg}`.slice(0, 4000) }),
    });
  } catch(_) {}
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', worker: 'vibesmom-learn', version: '1.1' });
    }


    if (url.pathname === '/smoke-test' && request.method === 'POST') {
      const auth = request.headers.get('Authorization') || '';
      if (auth !== `Bearer ${env.SMOKE_TEST_SECRET}`) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
      const start = Date.now();
      try {
        await env.KV.get('smoke_ping').catch(() => null);
        return Response.json({ ok: true, elapsed_ms: Date.now() - start, worker: 'vibesmom-learn', model: AI_MODEL });
      } catch(e) {
        return Response.json({ ok: false, error: e.message });
      }
    }

    // One-shot manual drain — for emergencies
    if (url.pathname === '/drain' && url.searchParams.get('key') === env.MGMT_SECRET) {
      try {
        const result = await runLearnCycle(env);
        return Response.json({ ok: true, ...result });
      } catch (e) {
        return Response.json({ ok: false, error: e.message }, { status: 500 });
      }
    }

    if (url.pathname === '/run' && request.method === 'POST') {
      const auth = request.headers.get('Authorization') || '';
      if (auth !== `Bearer ${env.MGMT_SECRET}`) {
        return Response.json({ error: 'unauthorized' }, { status: 401 });
      }
      try {
        const result = await runLearnCycle(env);
        return Response.json(result);
      } catch (e) {
        await tgSend(env, `❌ vibesmom-learn manual run failed: ${e.message}`);
        return Response.json({ error: e.message }, { status: 500 });
      }
    }

    return Response.json({ error: 'not found' }, { status: 404 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        const result = await runLearnCycle(env);
        console.log('vibesmom-learn cycle complete:', JSON.stringify(result));
      } catch (e) {
        const errStr = String(e.message || '');
        const isQuota = errStr.includes('credit balance') || errStr.includes('credit_balance') 
                     || errStr.includes('400') || errStr.includes('402') || errStr.includes('429')
                     || errStr.includes('AiError') || errStr.includes('neurons');
        if (!isQuota) {
          await tgSend(env, `❌ vibesmom-learn scheduled run failed: ${e.message}`);
        } else {
          console.warn('[learn] Quota error suppressed:', errStr);
        }
      }
    })());
  }
};