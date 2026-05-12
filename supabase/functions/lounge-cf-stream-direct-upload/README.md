# lounge-cf-stream-direct-upload

Authenticated users receive a **one-time Cloudflare Stream direct upload URL** and asset **`uid`** so the browser can upload video **without** exposing your Cloudflare API token.

Used by **`src/utils/loungeVideoUpload.js`** via `supabase.functions.invoke('lounge-cf-stream-direct-upload')`.

## Required secrets (Supabase Edge Function)

Set in **Supabase Dashboard → Edge Functions → Secrets** (or CLI), per environment (test / production):

| Name | Description |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID (Dashboard sidebar). |
| `CLOUDFLARE_STREAM_API_TOKEN` | API token with **Stream → Write** or **Stream → Edit** (not the Global API Key). |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically by Supabase to Edge Functions.

**Do not commit token values.** Rotate in Cloudflare if leaked.

## Database

Run **`supabase/lounge_feed_post_stream_video.sql`** on the same Supabase project so inserts can set **`community_feed_posts.stream_video_uid`**.

## Deploy

```bash
supabase functions deploy lounge-cf-stream-direct-upload --project-ref YOUR_PROJECT_REF
```

## Product limits (enforced in app + upload token)

- **60 seconds** max duration (`maxDurationSeconds` on direct upload).
- **200 MB** max file size for the basic POST upload path (Cloudflare; see Stream direct upload docs).

## References

- [Cloudflare Stream — Direct creator uploads](https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/)
