# Crisis prevention protocol

**Operator:** Vulnerable Persons Defense League of New York (VPDLNY)
**System:** VibesMom, an automated account on Bluesky operating as
[@vibesmom.osintnet.uk](https://bsky.app/profile/vibesmom.osintnet.uk)
**Published:** 2026-08-21
**Last reviewed:** 2026-08-21

This document is published to satisfy the publication requirement in California
**SB 243** (Business and Professions Code, Chapter 22.6), which requires an
operator of a companion chatbot to maintain a protocol for preventing suicidal
ideation and self-harm content and to **publish details of that protocol**.

It is written to be read by anyone: a person deciding whether to talk to her, a
partner organisation deciding whether to work with us, or a regulator.

---

## If you are in crisis right now

**Do not wait for this document, and do not wait for a bot.**

| Where | How |
| :--- | :--- |
| United States | Call or text **988** — the Suicide & Crisis Lifeline. Free, confidential, 24/7/365. Chat at [988lifeline.org/chat](https://988lifeline.org/chat) |
| Immediate danger | Call **911** |
| Outside the US | [findahelpline.com](https://findahelpline.com) lists verified services by country |

---

## 1. What this system is, plainly

VibesMom is an **automated account**. It is software. It is not a person, not a
counsellor, not a clinician, and not a substitute for any of them.

| Property | Statement |
| :--- | :--- |
| Automated | Yes. The account carries Bluesky's automated-account label, which renders beside her name on the profile and on every post |
| Human review | No human reads incoming messages in real time |
| Emergency service | **No.** She cannot dispatch help, cannot call anyone, and cannot escalate to a human on request |
| Clinical service | **No.** She does not assess, diagnose, treat, or advise |
| What she does | Responds warmly in public replies, and points to verified, human-run services |

**Suitability warning, required by SB 243:** a companion chatbot **may not be
suitable for some minors**, and may not be suitable for some adults either. If
you are in acute distress, please use **988** or another human-staffed service
rather than an automated account.

## 2. Outbound calling is disabled

The codebase contains an unfinished capability for placing outbound telephone
calls to verify agency information. **It is disabled and has never been
enabled.**

| Control | State |
| :--- | :--- |
| Feature flag | Hardcoded to `false` in source — it is not an environment variable and cannot be switched on by configuration or by a secret |
| Function body | An inert stub that returns a failure result even if reached |
| Enabling it | Requires a source change, a code review, an adversarial testing pass, and the operator's express authorisation |

This is recorded here because a capability that exists in source is a capability
the public deserves to know the status of.

## 3. How the system detects crisis content

Detection is **layered**, so that no single technique is the only thing standing
between a person and a referral.

| Layer | What it does |
| :--- | :--- |
| 1. Explicit language | Matches plain-language expressions of suicidal intent and self-harm |
| 2. Coded and evasive language | Matches the coded vocabulary people use to get past automated moderation. This layer exists because layer 1 is exactly what such vocabulary is designed to defeat, and it is maintained against the published research literature on the subject |
| 3. Semantic model | A language model scores text for suicidal intent, catching phrasings no keyword list contains |

Two deliberate design properties:

- **Layer 3 fails closed.** If the model is unavailable, layers 1 and 2 have
  already run. Detection can degrade; it cannot silently switch off.
- **Layers are ordered cheapest first**, so the model is consulted only on text
  the earlier layers did not already resolve.

**Why the specific terms and thresholds are not published here.** Publishing the
exact match lists would hand anyone wishing to evade the safety net a precise
guide to doing so, and would tell a person in crisis exactly which words cause
them to be seen. SB 243 requires publication of the **protocol**; it does not
require publication of an evasion manual. Details are available to regulators and
to partner organisations on request.

## 4. What happens when crisis content is detected

| Step | Behaviour |
| :--- | :--- |
| 1 | The **988 Suicide & Crisis Lifeline** is offered in her reply, in plain language rather than as a canned block |
| 2 | Ordinary reticence gates are **bypassed**, so a reply is not subject to the sampling that governs her non-crisis behaviour |
| 3 | Where a specific practical need is identified, she offers a **verified, human-run service** with a real contact route |
| 4 | The exchange is logged for safety review with the minimum data needed (see section 7) |

**She refers outward. She does not attempt to provide care herself.** The design
intent is that the most useful thing an automated account can do for a person in
crisis is hand them, quickly and specifically, to humans who are equipped to
help.

## 5. Restraint is part of the safety design

An automated account that replies to every sad-sounding stranger is itself a
harm. It intrudes on private grief, it trains people to distrust the platform,
and Bluesky's own safety guidance names unsolicited replies as an enforcement
target.

So outside of detected crisis, she is **deliberately reticent**: she requires a
genuine first-person expression of distress, she requires the post to read as
open to a stranger responding, and even then she does not always reply. There are
daily volume limits and minimum gaps between replies.

**Detected crisis overrides that reticence.** That asymmetry is the point.

## 6. Known limitations, stated honestly

No automated detector catches everything, and any document claiming otherwise
should be distrusted.

| Limitation | Consequence |
| :--- | :--- |
| Language evolves faster than any list | New coded vocabulary will be missed until the list is updated |
| Irony, humour and hyperbole | Figurative phrases can produce false positives; we bias toward answering kindly rather than missing a real one |
| Public posts only | She sees public content on one platform. She is not monitoring anyone |
| No real-time human | Nothing in this system reaches a human being who can intervene within minutes. **988 does** |

## 7. Data handling

| Practice | Detail |
| :--- | :--- |
| What is stored | Public post text, the account handle, and the reply, retained for safety review and quality auditing |
| What is not stored | No private messages, no health information, no attempt at identification or profiling of individuals |
| Reporting | From **1 July 2027**, SB 243 requires annual reporting to California's Office of Suicide Prevention on crisis referral volumes and detection protocols. Those reports contain **no user identifiers** |
| Removal | To have an interaction removed from our logs, open an issue on this repository or contact the operator |

## 8. Governance

| Item | Detail |
| :--- | :--- |
| Review cadence | This protocol is reviewed when detection logic changes, and at least every 90 days |
| Regression testing | The crisis detector has an automated test suite covering explicit language, coded vocabulary, false-positive suppression, and fail-closed behaviour. It runs before any change to detection logic is accepted |
| Reporting a failure | If she missed someone, or replied where she should not have, please open an issue. **Safety reports are treated as the highest priority work in this project** |

## 9. Applicable law

This protocol is maintained with reference to:

| Instrument | Relevance |
| :--- | :--- |
| California **SB 243**, Bus. & Prof. Code ch. 22.6, in effect 1 January 2026 | Companion chatbot disclosure, crisis protocol, protocol publication, minor protections, annual reporting from 1 July 2027 |
| **EU AI Act** Article 50, applicable from 2 August 2026 | Transparency obligations — informing people they are interacting with an AI system |

**This document is a description of operational practice, not legal advice, and
not a legal opinion on the applicability of any statute to this project.**
