// vibesmom-learn — Daily notification auditor + self-learning engine
// Runs: once daily at 11PM ET (03:00 UTC)
// Reads Bluesky notifications, classifies criticism, updates KV learning store,
// sends Telegram digest to Pete

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
    // Suppress noisy Anthropic/Workers AI quota errors — Pete asked not to be paged
    const msgStr = String(msg || '');
    if (msgStr.includes('credit balance') || msgStr.includes('credit_balance')
        || (msgStr.includes('failed') && (msgStr.includes('400') || msgStr.includes('402') || msgStr.includes('429')))
        || msgStr.includes('AiError') || msgStr.includes('neurons')) {
      console.warn('[tg suppressed]', msgStr.slice(0,200));
      return;
    }
    const token = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_PETE_ID || '1484600451403091981';
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
  await kvIntegrityCheck(env);
  const sess = await getBskySession(env);
  const notifs = await fetchNotifications(sess.token, 50);

  // Only process reply/mention/quote types from last 24h
  const cutoff = Date.now() - 24 * 3600 * 1000;
  const relevant = notifs.filter(n => {
    if (!['reply','mention','quote'].includes(n.reason)) return false;
    const t = new Date(n.indexedAt || 0).getTime();
    return t > cutoff;
  });

  console.log(`Found ${relevant.length} relevant notifications in last 24h`);

  // Quick classify pass first (no Claude — just keyword)
  const quickStats = { ai: 0, positive: 0, block: 0, neutral: 0 };
  for (const n of relevant) {
    const text = (n.record?.text || '').toLowerCase();
    if (CRITICISM_KEYWORDS.some(k => text.includes(k))) quickStats.ai++;
    else if (POSITIVE_KEYWORDS.some(k => text.includes(k))) quickStats.positive++;
    else if (BLOCK_SIGNALS.some(k => text.includes(k))) quickStats.block++;
    else quickStats.neutral++;
  }

  // Deep classify only actionable ones (criticism + positive) — save Claude calls
  const toClassify = relevant.filter(n => {
    const text = (n.record?.text || '').toLowerCase();
    return CRITICISM_KEYWORDS.some(k => text.includes(k)) ||
           POSITIVE_KEYWORDS.some(k => text.includes(k)) ||
           BLOCK_SIGNALS.some(k => text.includes(k));
  });

  const allClassified = [];
  for (const notif of toClassify.slice(0, 12)) { // max 12 Claude calls per cycle
    const text = notif.record?.text || '';
    const classification = await classifyNotification(env, notif);
    allClassified.push({ text, author: notif.author?.handle, classification });
    // Small delay between Claude calls
    await new Promise(r => setTimeout(r, 300));
  }

  // Update KV and D1
  const { avoid, working } = await updateKvPatterns(env, allClassified);
  await saveLessons(env, allClassified);

  // Also check reply stats from D1
  let replyStats = { sent: 0, errors: 0 };
  try {
    const rows = await env.DB.prepare(
      `SELECT status, COUNT(*) as cnt FROM vibesmom_replies
       WHERE replied_at > datetime('now', '-1 day') GROUP BY status`
    ).all();
    for (const row of rows.results || []) {
      if (row.status === 'sent') replyStats.sent = row.cnt;
      if (row.status === 'error') replyStats.errors = row.cnt;
    }
  } catch {}

  // Build Telegram digest
  const criticisms = allClassified.filter(c => c.classification &&
    ['CRITICISM_AI','CRITICISM_CONTENT','CRITICISM_REPETITIVE','BLOCK_SIGNAL'].includes(c.classification.type));
  const positives = allClassified.filter(c => c.classification?.type === 'POSITIVE');

  let digest = `🤖 <b>VibesMom Daily Learn Report</b>\n`;
  digest += `📅 ${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})}\n\n`;
  digest += `<b>24hr Activity:</b>\n`;
  digest += `✅ Replies sent: ${replyStats.sent}\n`;
  digest += `❌ Errors: ${replyStats.errors}\n`;
  digest += `🔔 Notifications: ${relevant.length}\n\n`;

  digest += `<b>Engagement Breakdown:</b>\n`;
  digest += `🚨 AI/Bot complaints: ${quickStats.ai}\n`;
  digest += `💕 Positive reactions: ${quickStats.positive}\n`;
  digest += `⛔ Block signals: ${quickStats.block}\n\n`;

  if (criticisms.length > 0) {
    digest += `<b>What to fix:</b>\n`;
    criticisms.slice(0, 4).forEach(c => {
      digest += `• ${c.classification.extracted_lesson || c.text?.slice(0,80)}\n`;
    });
    digest += '\n';
  }

  if (positives.length > 0) {
    digest += `<b>What's working:</b>\n`;
    positives.slice(0, 3).forEach(c => {
      digest += `• ${c.classification.extracted_lesson || 'Positive engagement'}\n`;
    });
    digest += '\n';
  }

  digest += `<b>Active avoid patterns:</b> ${avoid.length}\n`;
  digest += `<b>Active working patterns:</b> ${working.length}`;

  await tgSend(env, digest);

  return {
    notifications_processed: relevant.length,
    classified: allClassified.length,
    avoid_patterns: avoid.length,
    working_patterns: working.length,
    reply_stats: replyStats,
    quick_stats: quickStats
  };
}

// ── WORKER ────────────────────────────────────────────────


// ─── TELEGRAM ERROR ALERT ─────────────────────────────────────────────────────
async function sendTelegramAlert(env, msg, prefix) {
  try {
    const BOT  = (env && env.TELEGRAM_BOT_TOKEN) || '';
    const CHAT = (env && env.TELEGRAM_PETE_ID)   || '1484600451403091981';
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
      if (auth !== 'Bearer smoke-9f8e7d6c5b4a3f2e1d0c') return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
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