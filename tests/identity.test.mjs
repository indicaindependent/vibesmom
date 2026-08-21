/**
 * identity.test.mjs — guards the account-identity layer.
 *
 * WHY THIS EXISTS. On 2026-08-21 the account handle moved from
 * vibesmom.bsky.social to vibesmom.osintnet.uk. That single rename broke three
 * things at once, and none of them threw an error:
 *
 *   1. LOGIN. createSession was called with env.BSKY_HANDLE. The old handle
 *      began returning HTTP 401 the instant the rename landed, so a deployed
 *      worker still holding the old value could not authenticate at all.
 *      Verified by direct API call: old handle 401, new handle and DID both OK.
 *
 *   2. SELF-DETECTION. Two filters excluded the account's own posts by
 *      comparing a hardcoded handle string. After the rename those comparisons
 *      stopped matching, so the bot became eligible to reply to and quote
 *      ITSELF. A self-reply loop on a mental-health account is the worst
 *      possible place for this class of bug.
 *
 *   3. REPORT URLS. Three URLs were built from the old handle, which no longer
 *      resolves.
 *
 * The fix is to key identity on the DID, which is permanent, and to treat the
 * handle as a display detail. These tests assert that the shipped bundle
 * actually does that — they read vibesmom-bsky.js rather than a copy, so they
 * fail if someone reintroduces a handle-based comparison.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(here, "..", "vibesmom-bsky.js"), "utf8");
const DID = "did:plc:auiv6mgq7utz763uquvcfmv2";

let pass = 0;
const fail = [];
function ok(name, cond) {
  if (cond) pass++;
  else fail.push(name);
}

/* ---------- extract isSelfActor from the shipping bundle ---------- */
const m = SRC.match(/var SELF_DID[\s\S]*?function isSelfActor\(a\) \{[\s\S]*?\n\}/);
ok("identity block is present in the bundle", !!m);
let isSelfActor = null;
if (m) {
  // eslint-disable-next-line no-new-func
  isSelfActor = new Function(`${m[0]}; return isSelfActor;`)();
}

if (isSelfActor) {
  /* ---------- the regressions the rename caused ---------- */
  ok("own DID as actor object is self", isSelfActor({ did: DID, handle: "anything" }));
  ok("CURRENT handle is self", isSelfActor({ did: "did:plc:other", handle: "vibesmom.osintnet.uk" }));
  ok("OLD handle is still self (cached candidate lists carry it)",
     isSelfActor({ did: "did:plc:other", handle: "vibesmom.bsky.social" }));
  ok("own DID as a bare string is self", isSelfActor(DID));
  ok("current handle as a bare string is self", isSelfActor("vibesmom.osintnet.uk"));
  ok("old handle as a bare string is self", isSelfActor("vibesmom.bsky.social"));

  /* ---------- must NOT over-match: other people are not self ---------- */
  ok("a different account is not self", !isSelfActor({ did: "did:plc:zzz", handle: "someone.bsky.social" }));
  ok("a lookalike handle is not self", !isSelfActor({ did: "did:plc:zzz", handle: "vibesmom.bsky.social.evil.com" }));
  ok("a different vibesmom subdomain is not self",
     !isSelfActor({ did: "did:plc:zzz", handle: "vibesmom.example.com" }));
  ok("empty actor is not self", !isSelfActor(null));
  ok("undefined actor is not self", !isSelfActor(undefined));
  ok("empty object is not self", !isSelfActor({}));
  ok("empty string is not self", !isSelfActor(""));
}

/* ---------- structural assertions on the call sites ---------- */
ok("login authenticates by DID, not by handle",
   SRC.includes("identifier: SELF_DID"));
ok("no login site still uses env.BSKY_HANDLE",
   !SRC.includes("identifier: env.BSKY_HANDLE"));
ok("both login call sites were converted",
   (SRC.match(/identifier: SELF_DID/g) || []).length === 2);

ok("no self-filter compares a raw handle string any more",
   !/(author\?\.handle|c\.handle)\s*!==\s*"vibesmom\./.test(SRC));
ok("self-filters route through isSelfActor",
   (SRC.match(/isSelfActor\(/g) || []).length >= 3);

ok("no profile URL hardcodes the old handle",
   !SRC.includes("bsky.app/profile/vibesmom.bsky.social"));
ok("profile URLs are built from SELF_HANDLE",
   SRC.includes("bsky.app/profile/${SELF_HANDLE}"));

/* ---------- the disclosure regression ---------- */
ok("the \"She's not a bot\" denial is gone",
   !SRC.includes("She's not a bot"));
ok("no prompt instructs the model to deny being a bot",
   !/not a bot|isn't a bot|never admit|deny being/i.test(SRC));
ok("a prompt now instructs plain disclosure when asked",
   /never claims otherwise/.test(SRC));

/* ---------- report ---------- */
console.log(`\nidentity regression suite: ${pass}/${pass + fail.length} passed`);
if (fail.length) {
  console.error("FAILED:");
  for (const f of fail) console.error("  - " + f);
  process.exit(1);
}
console.log("all assertions passed\n");
