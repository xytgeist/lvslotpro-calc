import { useEffect, useRef } from 'react'

const GLITCH_BANDS = [
  { heightRatio: 0.34, speed: 34, phase: 0, delay: 0, kind: 'hero' },
  { heightRatio: 0.16, speed: 46, phase: 3.8, delay: 2.2, kind: 'secondary' },
]

const HERO_COLORS = [
  [255, 96, 180],
  [255, 238, 120],
  [6, 206, 252],
  [255, 255, 255],
  [255, 64, 120],
  [120, 255, 200],
]

function hashNoise(x, y, seed = 0) {
  const v = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.758) * 43758.5453
  return v - Math.floor(v)
}

function snowStrength(y, height) {
  const t = y / height
  if (t < 0.12) return 0.04
  if (t < 0.28) return 0.04 + (t - 0.12) * 1.4
  return Math.min(1, 0.26 + (t - 0.28) * 1.35)
}

function blockShift(y, time, phase, blockSize = 11) {
  const block = Math.floor(y / blockSize)
  return (
    Math.sin(block * 2.17 + time * 7.5 + phase) * 20 +
    Math.sin(block * 0.63 + time * 2.1 + phase * 1.4) * 12 +
    Math.sin(y * 0.041 + time * 1.4 + phase) * 10
  )
}

function microJitter(y, time, phase) {
  return Math.sin(y * 0.72 + time * 19 + phase) * 3 + (hashNoise(y, time * 100, phase) - 0.5) * 5
}

function createBands(height) {
  return GLITCH_BANDS.map((preset) => ({
    ...preset,
    height: Math.max(44, height * preset.heightRatio),
    y: height + preset.delay * preset.speed * 0.4,
  }))
}

function drawRgbSnowField(ctx, width, height, time, reducedMotion) {
  const rowStep = reducedMotion ? 3 : 2

  for (let y = 0; y < height; y += rowStep) {
    const strength = snowStrength(y, height)
    if (strength < 0.06) continue

    const shift = blockShift(y, time, 1.7, 9) + microJitter(y, time, 2.2)
    const flicker = 0.55 + hashNoise(y, Math.floor(time * 24), 9.1) * 0.45
    const alpha = strength * flicker * 0.28

    const rAlpha = alpha * (0.7 + hashNoise(y, time, 3.2))
    const gAlpha = alpha * (0.65 + hashNoise(y, time, 6.4))
    const bAlpha = alpha * (0.68 + hashNoise(y, time, 8.8))

    ctx.lineWidth = 1

    ctx.strokeStyle = `rgba(255, 48, 96, ${rAlpha * 0.85})`
    ctx.beginPath()
    ctx.moveTo(-16 + shift - 2, y)
    ctx.lineTo(width + 16 + shift - 2, y)
    ctx.stroke()

    ctx.strokeStyle = `rgba(48, 255, 120, ${gAlpha * 0.75})`
    ctx.beginPath()
    ctx.moveTo(-16 + shift, y)
    ctx.lineTo(width + 16 + shift, y)
    ctx.stroke()

    ctx.strokeStyle = `rgba(32, 170, 255, ${bAlpha * 0.8})`
    ctx.beginPath()
    ctx.moveTo(-16 + shift + 2, y)
    ctx.lineTo(width + 16 + shift + 2, y)
    ctx.stroke()

    if (Math.floor(y / rowStep) % 4 === 0 && strength > 0.35) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.35})`
      ctx.beginPath()
      ctx.moveTo(-16 + shift - 1, y)
      ctx.lineTo(width + 16 + shift - 1, y)
      ctx.stroke()
    }
  }
}

function pickHeroColor(y, rel, time, phase) {
  const idx =
    Math.floor(rel * 14 + y * 0.17 + time * 9 + phase * 2 + hashNoise(y, time, phase) * 3) %
    HERO_COLORS.length
  return HERO_COLORS[idx]
}

function drawGlitchBand(ctx, width, band, time, reducedMotion) {
  const bandTop = band.y
  const bandBottom = band.y + band.height
  const rowStep = reducedMotion ? 3 : 2
  const isHero = band.kind === 'hero'

  for (let y = Math.floor(bandTop); y < bandBottom; y += rowStep) {
    if (y < -6 || y > ctx.canvas.height + 6) continue

    const rel = (y - bandTop) / band.height
    if (rel < 0 || rel > 1) continue

    const envelope = Math.sin(Math.min(1, Math.max(0, rel)) * Math.PI)
    const edgeBoost = isHero ? 1.15 : 0.85
    const shift = blockShift(y, time, band.phase, isHero ? 8 : 12) + microJitter(y, time, band.phase)
    const [r, g, b] = isHero
      ? pickHeroColor(y, rel, time, band.phase)
      : [157, 0, 255]

    const mixWhite = isHero ? 0.25 + hashNoise(y, time, band.phase + 4) * 0.35 : 0.12
    const cr = Math.round(r + (255 - r) * mixWhite * envelope)
    const cg = Math.round(g + (255 - g) * mixWhite * envelope)
    const cb = Math.round(b + (255 - b) * mixWhite * envelope)

    const coreAlpha = envelope * edgeBoost * (isHero ? 0.62 : 0.38)
    const scanEvery = isHero ? 2 : 3
    const scanBright = Math.floor(y / rowStep) % scanEvery === 0

    ctx.lineWidth = isHero ? rowStep + 0.5 : rowStep
    ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${coreAlpha * (scanBright ? 1 : 0.55)})`
    ctx.beginPath()
    ctx.moveTo(-28 + shift, y)
    ctx.lineTo(width + 28 + shift, y)
    ctx.stroke()

    if (scanBright && isHero) {
      ctx.lineWidth = 1
      ctx.strokeStyle = `rgba(255, 255, 255, ${envelope * 0.42})`
      ctx.beginPath()
      ctx.moveTo(-28 + shift, y)
      ctx.lineTo(width + 28 + shift, y)
      ctx.stroke()

      if (!reducedMotion) {
        ctx.strokeStyle = `rgba(255, 48, 96, ${envelope * 0.22})`
        ctx.beginPath()
        ctx.moveTo(-32 + shift - 3, y)
        ctx.lineTo(width + 24 + shift - 3, y)
        ctx.stroke()

        ctx.strokeStyle = `rgba(32, 200, 255, ${envelope * 0.2})`
        ctx.beginPath()
        ctx.moveTo(-24 + shift + 3, y)
        ctx.lineTo(width + 32 + shift + 3, y)
        ctx.stroke()
      }
    }
  }
}

function paintFrame(ctx, width, height, bands, time, reducedMotion) {
  ctx.clearRect(0, 0, width, height)
  drawRgbSnowField(ctx, width, height, time, reducedMotion)

  for (const band of bands) {
    drawGlitchBand(ctx, width, band, time, reducedMotion)
  }
}

export default function GuideLockWavySurgeCanvas({ className = '' }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return undefined

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return undefined

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true

    let width = 0
    let height = 0
    let bands = []
    let rafId = 0
    let lastTs = 0
    let time = 0

    const resize = () => {
      const rect = root.getBoundingClientRect()
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      const dpr = Math.min(2, window.devicePixelRatio || 1)

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      bands = createBands(height)
    }

    const tick = (ts) => {
      if (!lastTs) lastTs = ts
      const dt = Math.min(0.05, (ts - lastTs) / 1000)
      lastTs = ts

      if (!reducedMotion) {
        time += dt
        for (const band of bands) {
          band.y -= band.speed * dt
          if (band.y + band.height < -height * 0.1) {
            band.y = height + band.height * 0.12
          }
        }
      } else if (bands.length === 2) {
        bands[0].y = height * 0.38
        bands[1].y = height * 0.62
      }

      paintFrame(ctx, width, height, bands, time, reducedMotion)
      rafId = window.requestAnimationFrame(tick)
    }

    resize()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    observer?.observe(root)

    rafId = window.requestAnimationFrame(tick)

    return () => {
      observer?.disconnect()
      window.cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div ref={rootRef} className={className} aria-hidden>
      <canvas ref={canvasRef} className="guide-lock-glitch__wavy-canvas h-full w-full" />
    </div>
  )
}
