# guide-cf-r2-upload

Mints a presigned S3 PUT URL for uploading AP Guide hero and diagram images directly to Cloudflare R2 from the browser or the ingest API.

## Object key format

```
guides/{slug}/{filename}
```

Examples:
- `guides/buffalo-link/hero.webp`
- `guides/buffalo-link/buffalo-link-diagram.webp`

## Auth

Two modes accepted:

| Caller | Header |
|---|---|
| Browser (guide editor) | `Authorization: Bearer <supabase-user-jwt>` — user must have `profiles.role = 'admin'` |
| Ingest API (Vercel) | `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` — trusted server caller |

## Request

```json
POST /functions/v1/guide-cf-r2-upload
{
  "slug": "buffalo-link",
  "contentType": "image/webp",
  "filename": "hero.webp"
}
```

## Response

```json
{
  "uploadURL": "https://...(presigned PUT URL, expires 1h)...",
  "publicUrl": "https://media-test.lvslotpro.com/guides/buffalo-link/hero.webp",
  "objectKey": "guides/buffalo-link/hero.webp"
}
```

## Secrets required (shared with `lounge-cf-r2-direct-upload`)

- `CLOUDFLARE_ACCOUNT_ID`
- `LOUNGE_CF_R2_ACCESS_KEY_ID`
- `LOUNGE_CF_R2_SECRET_ACCESS_KEY`
- `LOUNGE_CF_R2_BUCKET`
- `LOUNGE_CF_R2_PUBLIC_BASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (auto-injected by Supabase)

## Deploy

```bash
supabase functions deploy guide-cf-r2-upload --project-ref jtjgtucumuoswnbauxry
```

Returns 503 if R2 credentials are not configured — callers should fall back to Supabase Storage in that case.
