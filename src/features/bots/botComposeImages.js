import { isProbablyImageFile } from '../../utils/compressImageForUpload'

export const BOT_COMPOSE_MAX_IMAGES = 6

export function newBotComposeImageId() {
  return `bci-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** @param {Array<{ id: string, file: File, preview: string }>} prevItems */
export function mergeBotComposeImageItems(prevItems, fileList) {
  const next = [...prevItems]
  const cap = BOT_COMPOSE_MAX_IMAGES
  let room = Math.max(0, cap - next.length)
  let limitDialog = ''
  if (room === 0) {
    limitDialog = `You can attach up to ${cap} images.`
    return { next, limitDialog }
  }
  let skipped = 0
  for (const file of fileList) {
    if (!isProbablyImageFile(file)) continue
    if (room <= 0) {
      skipped += 1
      continue
    }
    next.push({ id: newBotComposeImageId(), file, preview: URL.createObjectURL(file) })
    room -= 1
  }
  if (skipped > 0) {
    limitDialog = `You can attach up to ${cap} images. Extra files were not added.`
  }
  return { next, limitDialog }
}

/** @param {Array<{ preview?: string }>} items */
export function revokeBotComposeImagePreviews(items) {
  for (const item of items || []) {
    if (item?.preview?.startsWith?.('blob:')) {
      try {
        URL.revokeObjectURL(item.preview)
      } catch {
        // ignore
      }
    }
  }
}
