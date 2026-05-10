# Access tiers — your definitions (source draft)

**Purpose:** Lock in what **no account**, **free account**, and **paid subscriber** mean for *this* app before entitlements + RLS + UI gates are coded. Edit this file as the product truth; implementation should mirror it.

**Related:** `docs/social-feed-roadmap.md` (Freemium & subscriptions), `docs/frontend-architecture.md` (Access model), `AGENTS.md` (when to update docs).

---

## 1. Tier names & one-line intent

| Tier | Internal label (optional) | One sentence: who is this? |
| --- | --- | --- |
| **No account** | `anonymous` | |
| **Free** | `free` | |
| **Paid** | `subscriber` (or `pro`) | |

---

## 2. Global rules (cross-cutting)

Fill anything that applies everywhere (not per tab).

| Topic | Your rule |
| --- | --- |
| **Signup** | e.g. open signup / invite-only / `allowed_emails` whitelist forever / hybrid |
| **Email verification** | required before “free” counts? |
| **Free → paid** | one Stripe product or multiple? trial? |
| **Downgrade / cancel** | what happens to saved data, offers, posts? |
| **Moderators / admins** | separate from these three tiers? (recommended: yes, `role`-based) |

---

## 3. Per-surface matrix

Use **R** = read/browse, **W** = write / personal actions (post, save, sync, react, etc.), **—** = not available, **Teaser** = limited read or capped feature.

Copy the pattern in each cell: `R: …` / `W: …` / `—` as needed.

| Surface | No account | Free | Paid |
| --- | --- | --- | --- |
| **Lounge (Home feed)** | R: _e.g. feed + post detail read_ · W: _—_ | R: _…_ · W: _…_ | R: _…_ · W: _…_ |
| **AP Guides** | R: _…_ · W: _…_ | R: _…_ · W: _…_ | R: _…_ · W: _…_ |
| **Ask community → feed** | R: _…_ · W: _…_ | R: _…_ · W: _…_ | R: _…_ · W: _…_ |
| **Offers calendar** | R: _…_ · W: _…_ | R: _…_ · W: _…_ | R: _…_ · W: _…_ |
| **Push / reminders** | R: _…_ · W: _…_ | R: _…_ · W: _…_ | R: _…_ · W: _…_ |
| **Local Intel** | R: _…_ · W: _…_ | R: _…_ · W: _…_ | R: _…_ · W: _…_ |
| **Bankroll** | R: _…_ · W: _…_ | R: _…_ · W: _…_ | R: _…_ · W: _…_ |
| **Calculators** (picker + each game) | R: _…_ · W: _…_ | R: _…_ · W: _…_ | R: _…_ · W: _…_ |
| **Team / deals** | R: _…_ · W: _…_ | R: _…_ · W: _…_ | R: _…_ · W: _…_ |
| **Account / profile** | R: _…_ · W: _…_ | R: _…_ · W: _…_ | R: _…_ · W: _…_ |

**Add rows** below for anything else (e.g. future `/u/:handle`, search, notifications):

| Surface | No account | Free | Paid |
| --- | --- | --- | --- |
| _…_ | | | |

---

## 4. UX expectations (optional)

Short notes: what should **anonymous** see when they hit a **W** action (modal copy, blur, paywall screen, redirect to signup vs checkout)?

---

## 5. Revision log

| Date | Change |
| --- | --- |
| _today_ | Template created; fill sections 1–3. |
