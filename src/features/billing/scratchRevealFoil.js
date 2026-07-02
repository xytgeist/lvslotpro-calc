const FOIL_LOGO_SRC = '/edge-lounge-logo-transparent.png'

/** @type {Promise<HTMLImageElement | null> | null} */
let foilLogoPromise = null

/** @returns {Promise<HTMLImageElement | null>} */
export function loadScratchFoilLogo() {
  if (foilLogoPromise) return foilLogoPromise
  foilLogoPromise = new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = FOIL_LOGO_SRC
  })
  return foilLogoPromise
}

/**
 * @param {number} seed
 * @returns {() => number}
 */
function createSeededRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {() => number} rand
 */
function paintCrinkles(ctx, width, height, rand) {
  ctx.save()
  ctx.lineCap = 'round'

  for (let i = 0; i < 32; i += 1) {
    const x0 = rand() * width
    const y0 = rand() * height
    ctx.strokeStyle = rand() > 0.5 ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.09)'
    ctx.lineWidth = 0.45 + rand() * 1.4
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    const segments = 2 + Math.floor(rand() * 4)
    let px = x0
    let py = y0
    for (let s = 0; s < segments; s += 1) {
      px += (rand() - 0.5) * width * 0.38
      py += (rand() - 0.5) * height * 0.28
      ctx.lineTo(px, py)
    }
    ctx.stroke()
  }

  for (let i = 0; i < 48; i += 1) {
    const x = rand() * width
    const y = rand() * height
    const len = 5 + rand() * 20
    const angle = rand() * Math.PI
    ctx.strokeStyle = rand() > 0.4 ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 0.35 + rand() * 0.5
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len)
    ctx.stroke()
  }

  ctx.restore()
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} img
 * @param {number} cx
 * @param {number} cy
 * @param {number} logoW
 * @param {number} rotation
 * @param {() => number} rand
 */
function drawEmbossedLogo(ctx, img, cx, cy, logoW, rotation, rand) {
  const aspect = img.naturalWidth / img.naturalHeight || 4.05
  const w = logoW
  const h = w / aspect

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rotation)
  ctx.transform(1, rand() * 0.1 - 0.05, rand() * 0.08 - 0.04, 1, 0, 0)
  ctx.translate(-w / 2, -h / 2)

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 0.5
  ctx.filter = 'brightness(0.28) contrast(1.15)'
  ctx.drawImage(img, 2.5, 2.5, w, h)

  ctx.globalAlpha = 0.58
  ctx.filter = 'brightness(2.1) contrast(0.85)'
  ctx.drawImage(img, -1.5, -1.5, w, h)

  ctx.globalAlpha = 0.46
  ctx.filter = 'brightness(1.12) contrast(1.3) saturate(0.65)'
  ctx.drawImage(img, 0, 0, w, h)

  ctx.restore()
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {HTMLImageElement | null | undefined} logoImage
 */
export function paintScratchFoil(ctx, width, height, logoImage = null) {
  const base = ctx.createLinearGradient(0, 0, width, height)
  base.addColorStop(0, '#929baa')
  base.addColorStop(0.18, '#dde3eb')
  base.addColorStop(0.4, '#b4bdc9')
  base.addColorStop(0.55, '#eef2f7')
  base.addColorStop(0.72, '#a6b0be')
  base.addColorStop(1, '#c2cad6')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, width, height)

  const sheen = ctx.createLinearGradient(width * 0.15, 0, width * 0.85, height)
  sheen.addColorStop(0, 'rgba(249,115,22,0.1)')
  sheen.addColorStop(0.45, 'rgba(6,182,212,0.07)')
  sheen.addColorStop(1, 'rgba(249,115,22,0.06)')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, width, height)

  const seed = Math.imul(width, 73856093) ^ Math.imul(height, 19349663) ^ 0xed6e000
  const rand = createSeededRandom(seed)

  if (logoImage?.naturalWidth) {
    const count = Math.max(7, Math.min(16, Math.floor((width * height) / 10500)))
    for (let i = 0; i < count; i += 1) {
      const cx = rand() * width
      const cy = rand() * height
      const logoW = width * (0.2 + rand() * 0.2)
      const rot = (rand() - 0.5) * 1.05
      drawEmbossedLogo(ctx, logoImage, cx, cy, logoW, rot, rand)
    }
  }

  paintCrinkles(ctx, width, height, rand)

  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.32)'
  for (let i = 0; i < 14; i += 1) {
    const x = rand() * width
    const y = rand() * height
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rand() * Math.PI)
    ctx.fillRect(-0.75, -6 - rand() * 12, 1.5, 12 + rand() * 18)
    ctx.restore()
  }
  ctx.restore()

  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.18,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.78,
  )
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.14)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, width, height)

  ctx.filter = 'none'
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}
