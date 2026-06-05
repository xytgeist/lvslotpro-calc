/** @typedef {{ id?: string, file?: File, preview?: string, remoteUrl?: string }} ThreadComposeImageItem */

/** @typedef {object | null} ThreadComposeVideoSlot */

/** @typedef {{ progress: number, status: string, detail: string } | null} ThreadComposeVideoPrepHud */

/**
 * @typedef {{
 *   imageItems: ThreadComposeImageItem[],
 *   gifUrl: string,
 *   videoSlot: ThreadComposeVideoSlot,
 *   videoPrepHud: ThreadComposeVideoPrepHud,
 * }} ThreadComposePartMedia
 */

export function emptyThreadComposePartMedia() {
  return { imageItems: [], gifUrl: '', videoSlot: null, videoPrepHud: null }
}

/** @param {ThreadComposePartMedia | null | undefined} part */
export function revokeThreadComposePartMedia(part) {
  for (const it of part?.imageItems || []) {
    try {
      if (it?.preview?.startsWith?.('blob:')) URL.revokeObjectURL(it.preview)
    } catch {
      // ignore
    }
  }
}

/** @param {ThreadComposeVideoSlot | null | undefined} slot @param {Set<string> | null | undefined} [skipUrls] */
export function revokeThreadComposePartVideoSlot(slot, skipUrls) {
  if (!slot) return
  const skip = skipUrls instanceof Set ? skipUrls : null
  const p = slot.preview
  const po = slot.posterUrl
  if (p && !skip?.has(p)) {
    try {
      URL.revokeObjectURL(p)
    } catch {
      // ignore
    }
  }
  if (po && po !== p && !skip?.has(po)) {
    try {
      URL.revokeObjectURL(po)
    } catch {
      // ignore
    }
  }
}

/** @param {ThreadComposePartMedia | null | undefined} part @param {Set<string> | null | undefined} [skipUrls] */
export function revokeThreadComposePartMediaFull(part, skipUrls) {
  revokeThreadComposePartMedia(part)
  revokeThreadComposePartVideoSlot(part?.videoSlot, skipUrls)
}

/** @param {ThreadComposePartMedia | null | undefined} part */
export function threadComposePartHasMedia(part) {
  if (!part) return false
  if ((part.imageItems?.length ?? 0) > 0) return true
  return Boolean(String(part.gifUrl || '').trim())
}

/** @param {ThreadComposePartMedia | null | undefined} part */
export function threadComposePartHasVideo(part) {
  return part?.videoSlot != null
}

/** @param {ThreadComposePartMedia | null | undefined} part */
export function threadComposePartCarouselUrls(part) {
  const gif = String(part?.gifUrl || '').trim()
  const imgs = (part?.imageItems || []).map((it) => it.preview || it.remoteUrl).filter(Boolean)
  return gif ? [...imgs, gif] : imgs
}

/**
 * @param {string} caption
 * @param {ThreadComposePartMedia | null | undefined} part
 */
export function threadComposePartHasContent(caption, part) {
  if (threadComposePartHasVideo(part)) return true
  if (String(caption || '').trim()) return true
  return threadComposePartHasMedia(part)
}

/**
 * @param {string[]} captions
 * @param {ThreadComposePartMedia[]} partMedia
 */
export function normalizeThreadComposePartsForSubmit(captions, partMedia) {
  const cap = Array.isArray(captions) ? captions : ['']
  const media = Array.isArray(partMedia) ? partMedia : [emptyThreadComposePartMedia()]
  const rows = cap.map((text, i) => {
    const m = media[i] || emptyThreadComposePartMedia()
    return {
      body: String(text || '').trim(),
      gifUrl: String(m.gifUrl || '').trim(),
      imageFiles: (m.imageItems || []).map((it) => it.file).filter((f) => f instanceof File),
      existingImageUrls: (m.imageItems || [])
        .map((it) => String(it.remoteUrl || '').trim())
        .filter(Boolean),
      _part: m,
    }
  })
  let end = rows.length
  while (end > 1 && !threadComposePartHasContent(rows[end - 1].body, rows[end - 1]._part)) {
    end -= 1
  }
  return rows.slice(0, end).map(({ body, gifUrl, imageFiles, existingImageUrls, _part }) => ({
    body,
    gifUrl,
    imageFiles,
    existingImageUrls,
    videoSlot: _part?.videoSlot ?? null,
  }))
}
