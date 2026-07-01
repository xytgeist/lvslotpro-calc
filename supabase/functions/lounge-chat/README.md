# `lounge-chat`

Authenticated Edge API for **DM open**, **subscriber channel join**, **small group create** (2–10 members), and **send message**.

## Deploy

From repo root (with Supabase CLI linked):

```bash
supabase functions deploy lounge-chat --no-verify-jwt false
```

Uses the caller JWT; validates profile (`handle` + `display_name`) before mutating.

## Actions (JSON body)

| `action` | Fields | Notes |
| --- | --- | --- |
| `open_dm` | `peer_user_id` | Creates or returns existing 1:1 room (`dm_key`). |
| `join_channel` | `slug` | Requires `profiles.has_active_subscription` or staff `role`. |
| `create_group` | `title`, `member_user_ids[]` | 2–10 unique members including caller; all must have min profile. |
| `send_message` | `room_id`, `body`, `image_urls?` | Member check; subscriber rooms require paid tier. Max 4 image URLs (HTTPS strings); v1 UI is mostly text. |

## SQL prerequisite

Run **`supabase/chat_phase1.sql`** on the project (test, then prod) so `chat_rooms`, `chat_room_members`, and `chat_messages` exist with RLS.

If you deployed chat before the **members RLS recursion** fix, also run **`supabase/chat_room_members_rls_recursion_fix.sql`** (replaces `chat_room_members` SELECT policy so it only allows `user_id = auth.uid()` — the app resolves DM peer labels from **`chat_rooms.dm_key`**, not by listing other members).

## Security (phase 1)

- **In transit:** HTTPS/TLS to Supabase and this function.
- **At rest:** Supabase / Postgres provider encryption; message **`body`** is plaintext in DB for v1. Columns **`content_encoding`**, **`body_cipher`**, **`nonce`** are reserved for a future app-level ciphertext phase (see `docs/test-buildout-backlog.md` → *Planned (messaging)*).

## Secrets

Uses default `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` only (no extra Vault keys for v1).

## Troubleshooting (`Failed to send a request to the Edge function`)

That message usually means the browser never got a normal HTTP response from **`/functions/v1/lounge-chat`** (undeployed function, wrong project URL, or blocked request).

1. **Deploy** from repo root (CLI linked to the same project as the app’s `VITE_SUPABASE_URL`):  
   `supabase functions deploy lounge-chat`
2. In **Supabase Dashboard → Edge Functions**, confirm **`lounge-chat`** is listed.
3. Confirm the app’s **`VITE_SUPABASE_URL`** (and anon key) target the **same** Supabase project where you deployed.
4. Retry in a private window or with extensions disabled (some ad blockers block `functions/v1`).

The client sends an explicit **`Authorization: Bearer <session>`** header (same pattern as Stream upload) so the gateway can verify JWT when `verify_jwt` is enabled.
