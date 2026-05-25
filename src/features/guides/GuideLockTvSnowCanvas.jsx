import { useEffect, useRef } from 'react'

function hashNoise(x, y, seed = 0) {
  const v = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.758) * 43758.5453
  return v - Math.floor(v)
}

/** Mostly grey/white with rare faint cool or warm tint. */
function pickSnowColor(t, chromaBias) {
  const base = 198 + Math.floor(t * 42)

  if (chromaBias > 0.88) {
    return [base + 6, base - 2, base + 8]
  }
  if (chromaBias > 0.8) {
    return [base + 4, base + 2, base - 3]
  }
  return [base + 2, base + 3, base + 4]
}

function rowIntensity(y, height) {
  const t = y / height
  if (t < 0.08) return 0.42
  return Math.min(1, 0.42 + t * 0.58)
}

function fillBlock(data, width, height, x, y, blockW, blockH, r, g, b, a) {
  const xEnd = Math.min(width, x + blockW)
  const yEnd = Math.min(height, y + blockH)
  const alpha = Math.round(Math.min(255, a))

  for (let py = Math.max(0, y); py < yEnd; py++) {
    for (let px = Math.max(0, x); px < xEnd; px++) {
      const i = (py * width + px) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = alpha
    }
  }
}

function paintTvSnow(imageData, width, height, frameSeed) {
  const data = imageData.data
  data.fill(0)

  let y = 0
  while (y < height) {
    const lineSeed = hashNoise(0, y * 0.17 + frameSeed, 1.7)
    const lineThickness = 1 + Math.floor(lineSeed * 3.8)
    const scanBand = 0.78 + 0.22 * Math.sin(y * 0.07 + frameSeed * 0.11)
    const intensity = rowIntensity(y, height)
    const isHeavyLine = hashNoise(y, frameSeed, 9.4) > 0.93

    if (isHeavyLine) {
      const lineAlpha = intensity * scanBand * 0.34
      const grey = 214 + Math.floor(hashNoise(y, frameSeed, 4.2) * 28)
      fillBlock(data, width, height, 0, y, width, lineThickness, grey, grey + 2, grey + 4, lineAlpha * 255)
    }

    for (let rowY = y; rowY < Math.min(height, y + lineThickness); rowY++) {
      const rowSeed = hashNoise(0, rowY + frameSeed, 2.1)
      const density = 0.52 + rowIntensity(rowY, height) * 0.34

      for (let x = 0; x < width; ) {
        const flakeSeed = hashNoise(x * 0.08 + rowSeed * 5, rowY + frameSeed, 0.4)
        const flakeStep = 2 + Math.floor(hashNoise(x, rowY, frameSeed + 0.8) * 3)
        const flakeW = 2 + Math.floor(hashNoise(x + 1, rowY, frameSeed + 1.1) * 2.6)
        const flakeH = Math.min(lineThickness, 1 + Math.floor(hashNoise(x + 2, rowY, frameSeed + 1.4) * lineThickness))

        if (flakeSeed > density) {
          x += flakeStep
          continue
        }

        const colorT = hashNoise(x * 0.21 + rowSeed * 2, rowY * 0.11 + frameSeed, 5.6)
        const chromaBias = hashNoise(x, rowY + frameSeed, 6.3)
        const [r, g, b] = pickSnowColor(colorT, chromaBias)
        const flicker = 0.58 + hashNoise(x, rowY + frameSeed, 7.2) * 0.38
        const bright = hashNoise(x * 0.7, rowY * 0.4 + frameSeed, 3.1)
        const alpha = intensity * scanBand * flicker * (bright > 0.8 ? 0.82 : 0.62)

        fillBlock(data, width, height, x, rowY, flakeW, flakeH, r, g, b, alpha * 255)
        x += flakeStep
      }
    }

    y += lineThickness
  }
}

export default function GuideLockTvSnowCanvas({ className = '' }) {
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

    let imageData = null
    let rafId = 0
    let lastTs = 0
    let frameSeed = 0

    const resize = () => {
      const rect = root.getBoundingClientRect()
      const width = Math.max(1, Math.round(rect.width))
      const height = Math.max(1, Math.round(rect.height))
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const pixelWidth = Math.round(width * dpr)
      const pixelHeight = Math.round(height * dpr)

      canvas.width = pixelWidth
      canvas.height = pixelHeight
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      imageData = ctx.createImageData(pixelWidth, pixelHeight)
    }

    const tick = (ts) => {
      if (!lastTs) lastTs = ts
      const dt = Math.min(0.05, (ts - lastTs) / 1000)
      lastTs = ts

      if (!reducedMotion) {
        frameSeed += dt * 28
      }

      if (imageData && imageData.width > 0 && imageData.height > 0) {
        paintTvSnow(imageData, imageData.width, imageData.height, frameSeed)
        ctx.putImageData(imageData, 0, 0)
      }

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
      <canvas ref={canvasRef} className="guide-lock-glitch__tv-snow-canvas h-full w-full" />
    </div>
  )
}
