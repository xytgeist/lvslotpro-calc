# Lounge bot — sports odds / +EV plays (planned)

**Status:** Design only ... not implemented. **Dedicated Edge account** ... posts **sports betting only** (The Odds API). **Self-contained** ... no morning editorial inbox. Roster: `docs/lounge-bot-editorial-queue.md` § two automation modes.

**Product fit:** Mixed gambling feed ... slot/AP Lounge content plus **sharp betting plays** (line movement, +EV props, best bets). Posts go live on a **fixed schedule** after rule-based caption generation ... Ryan tunes config and audits, does not review every post.

---

## Self-contained workflow (no morning inbox)

```text
Odds ingest (cron)  →  rule engine + template  →  auto-schedule  →  publish worker  →  feed
```

**`review_mode`:** `automatic` on `lounge_bot_accounts`. Target volume: **~2 posts/day** (morning + evening run), not live odds ticker spam.

**Audit:** optional `lounge_bot_auto_log` or published rows in admin **Bot ops** panel ... not a `pending_review` queue.

---

## API choice (locked for v1)

| Provider | Role |
| --- | --- |
| **The Odds API** | **v1** ... REST, JSON, fits Supabase Edge + cache table |
| SharpAPI, OddsJam, SharpSports | **Later** if we need sharper real-time movement or built-in +EV |

**Secret:** `THE_ODDS_API_KEY` on Edge only (never in repo).

### Credit math (2 posts/day ≈ 60 posts/month)

Each `GET /v4/sports/{sport}/odds` call costs:

**credits = (# markets) × (# regions)**

Efficient defaults for one daily pick:

- **1 region:** `us` (or `us2` per docs)
- **2–3 markets:** `h2h`, `spreads`, `totals` (skip props until v2)
- **1–2 in-season sports** per run (NFL Sun/Mon, NBA winter, MLB summer, etc.)

| Scenario | Credits/call | Calls/month (2/day) | Monthly credits |
| --- | --- | --- | --- |
| Lean (1 market, 1 region) | 1 | ~60 | ~60 |
| Balanced (2–3 markets, 1 region) | 2–3 | ~60 | ~120–180 |
| Heavy (3 markets, 2 regions) | 6 | ~60 | ~360 |

**Expected cost:** **$0 on free tier** (500 credits/mo) if calls stay lean. Monitor `x-requests-remaining` response header; cache in Supabase 15–60 min between runs.

**Upgrade trigger:** more than 2 posts/day, props on every sport, or multi-region book shopping every run → ~$30/mo (20K credits) per Odds API pricing (verify on site before prod).

---

## Ingest architecture

### Edge Function: `lounge-odds-ingest` (cron, service role)

1. Load config from **`lounge_bot_odds_config`** (or JSON row on `lounge_bot_sources` with `source_type = odds_api`).
2. For each enabled sport key (`americanfootball_nfl`, `basketball_nba`, `baseball_mlb`, ...):
   - Optional cheap pre-filter: `GET /v4/sports/{sport}/events` if needed.
   - `GET /v4/sports/{sport}/odds?regions=us&markets=h2h,spreads,totals&oddsFormat=american`
3. **Cache** raw JSON in **`lounge_odds_snapshots`** (`sport`, `fetched_at`, `payload jsonb`) ... avoid re-fetch for UI preview.
4. **Detect candidates** (rules engine, v1 can be simple):
   - Best line vs consensus (median across books)
   - Spread/total move vs prior snapshot (store last line per event)
   - Optional min edge threshold (e.g. implied prob gap > 4%) ... tune with Ryan
5. **Template + optional LLM polish** → final caption + structured metadata.
6. **Auto-select** top 1–2 candidates per run (score by edge, line move, sport priority) → insert as **`scheduled`** with `scheduled_at` from `run_hours_pt` → publish worker posts at due time.

### Dedupe

- Unique on `(source_type, external_key)` e.g. `odds_api:{sport}:{event_id}:{market}:{pick_type}:{snapshot_date}`
- Do not re-queue same play after Ryan skipped unless line moved materially (configurable delta).

---

## Bot persona (one account, one niche)

**One Edge profile** owns all posts from this pipeline. Voice: concise, data-forward, sports-betting only ... no stock tips, no crypto, no slot AP.

- **`lounge_bot_accounts.pipeline`** = `odds_api`
- **`review_mode`** = `automatic`

**Disclaimer:** posts are informational, not advice ... footer line in persona prompt or pinned profile `about_me` (legal review before prod).

---

## Example post templates (from Grok brainstorm)

Use as **caption templates** filled from API JSON. Published as-is unless LLM polish is enabled in config.

### 1. Sharp line movement (NFL)

**Title line (first sentence):**  
`Sharp money alert: Chiefs -3.5 dropping fast`

**Body:**  
`Line moved from -2.5 to -3.5 at DraftKings/FanDuel after heavy action. Consensus still -2. Best available: Chiefs -3 (-110) at BetMGM. Edge if you like KC covering.`

**Metadata for UI (future):** team logos, mini line chart, "Sharp action" badge.

### 2. +EV NBA prop (v2 when props market enabled)

**Title:**  
`+EV tonight: Luka over 28.5 points`

**Body:**  
`Books clustered 27.5–28.5; model + injury news suggest ~30+. Best: +105 Caesars. Implied ~49% vs est. ~57%.`

### 3. MLB best bet (moneyline)

**Title:**  
`Best bet tonight: Dodgers ML @ -135`

**Body:**  
`Weak bullpen matchup + home edge. Top books price LA shorter than open. Consensus ~68% implied vs est. ~74%.`

### 4. Arb / middle (rare, only if real)

**Title:**  
`Arb alert: [Player A] moneyline`

**Body:**  
`FanDuel +140 vs Bet365 +155 on same side — split stake locks small profit. Verify limits before firing.`

**v1 scope:** templates **1** and **3** only (main markets). Props and arbs after props API usage is costed.

---

## Caption format in Lounge

Plain-text captions first (matches current feed). Optional later:

- **`market_embeds`** or cashtag-style `$DKNG` if we tie to existing Lounge market chart infra (gaming stocks, not game lines)
- Link preview to ESPN/game page or Odds API event URL if available
- Custom card component ... **deferred** (big UI lift); v1 is text post + category pill

**Cap:** 500 chars (`LOUNGE_CAPTION_MAX`).

---

## Config table sketch: `lounge_bot_odds_config`

| Column | Example |
| --- | --- |
| `enabled` | true |
| `bot_user_id` | uuid |
| `sports_keys` | `['americanfootball_nfl','basketball_nba']` |
| `regions` | `['us']` |
| `markets` | `['h2h','spreads','totals']` |
| `runs_per_day` | 2 |
| `run_hours_pt` | `[8, 17]` |
| `min_edge_pct` | 4 |
| `min_line_move_pts` | 0.5 |
| `max_queue_candidates_per_run` | 3 |

---

## Phased rollout

| Phase | Scope |
| --- | --- |
| **0** | Hard-coded template + manual cron trigger on **test** → auto-publish one post |
| **1** | Odds API fetch + rule-based caption + scheduled publish (~2/day) |
| **2** | LLM polish pass + line-move vs snapshot |
| **3** | Props market, richer cards, optional SharpAPI upgrade |

**Legal/compliance (before prod):** Nevada/gambling content policy, no guaranteed-profit claims, age-gated app, terms alignment with `docs/access-tiers.md` and counsel-reviewed guidelines.

---

## Repo touchpoints (when building)

| Piece | Location |
| --- | --- |
| X editorial queue (not used here) | `docs/lounge-bot-editorial-queue.md` |
| Ingest Edge fn | `supabase/functions/lounge-odds-ingest/` |
| Odds cache | migration `lounge_odds_snapshots` |
| Templates | `scripts/lib/loungeBotOddsTemplates.mjs` (TBD) |
| Publish | `lounge-bot-publish-due` (automatic rows) |
| Admin UI | Edge Monitor **Bot ops** ... last post, enable/disable, config |

---

## Open questions

- [ ] New category pill **`sports-betting`** vs reuse **`trading`**?
- [ ] Affiliate / sportsbook deep links allowed?
- [ ] Which sports in season for launch window?
- [ ] LLM on every draft or only when rule engine fires?
- [ ] Responsible gaming disclaimer on every post vs profile-only?

---

_Prior conversation: Grok + Ryan, The Odds API, ~2 posts/day, example sharp/+EV/arb templates. Captured 2026-07-03._
