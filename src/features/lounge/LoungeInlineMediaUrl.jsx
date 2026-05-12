/**
 * GIF/photo URL shown below the post caption (always under the final line of text).
 * @param {string} [marginTopClass] — Tailwind margin-top on the wrapper (default `mt-2` after caption).
 */
export function LoungeInlineMediaUrl({ url, variant = 'feed', marginTopClass = 'mt-2' }) {
  if (!url) return null
  const isEmbed = variant === 'embed'
  const isDetail = variant === 'detail'
  const imgClass = isDetail
    ? 'block max-h-56 w-auto max-w-full h-auto object-contain sm:max-h-60'
    : isEmbed
      ? 'block max-h-40 w-auto max-w-full h-auto object-contain sm:max-h-44'
      : 'block max-h-48 w-auto max-w-full h-auto object-contain sm:max-h-52'
  const rounding = isEmbed ? 'rounded-lg' : 'rounded-xl'
  const border = isEmbed ? 'border-zinc-600/40' : 'border-zinc-700/60'

  return (
    <div className={`${marginTopClass} flex justify-start`}>
      <div className={`inline-block max-w-full overflow-hidden ${rounding} border ${border} bg-zinc-950/40`}>
        <img src={url} alt="" className={imgClass} loading="lazy" decoding="async" />
      </div>
    </div>
  )
}

/**
 * Renders `media_url` then optional `gif_url` (image + external GIF), or a single legacy URL in `media_url`.
 * @param {string} [firstMarginTopClass]
 */
export function LoungePostMediaPair({ mediaUrl, gifUrl, variant = 'feed', firstMarginTopClass = 'mt-2' }) {
  const m = mediaUrl != null ? String(mediaUrl).trim() : ''
  const g = gifUrl != null ? String(gifUrl).trim() : ''
  if (!m && !g) return null
  if (m && g) {
    return (
      <>
        <LoungeInlineMediaUrl url={m} variant={variant} marginTopClass={firstMarginTopClass} />
        <LoungeInlineMediaUrl url={g} variant={variant} marginTopClass="mt-2" />
      </>
    )
  }
  const single = m || g
  return <LoungeInlineMediaUrl url={single} variant={variant} marginTopClass={firstMarginTopClass} />
}
