/**
 * Node-side hero accent extraction (sharp). Same algorithm as browser canvas sampling.
 */
import sharp from 'sharp'
import { dominantAccentFromRgba } from '../../src/utils/dominantAccentFromRgba.js'

/**
 * @param {Buffer} input
 * @returns {Promise<string | null>} #rrggbb
 */
export async function extractAccentFromImageBuffer(input) {
  if (!input?.length) return null
  const { data } = await sharp(input)
    .resize(32, 32, { fit: 'cover' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return dominantAccentFromRgba(data)
}

/**
 * @param {string} filePath
 * @returns {Promise<string | null>}
 */
export async function extractAccentFromImageFile(filePath) {
  const buf = await sharp(filePath).toBuffer()
  return extractAccentFromImageBuffer(buf)
}
