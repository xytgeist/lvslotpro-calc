import { useLayoutEffect, useRef } from 'react'
import { DotLottie } from '@lottiefiles/dotlottie-web'
import wasmUrl from '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url'
import edgeSplashData from '../assets/lottie/edge-splash-v2.json'

DotLottie.setWasmUrl(wasmUrl)
const EDGE_SPLASH_DATA = JSON.stringify(edgeSplashData)

// Black Solid 1 ends at frame 157 → D fly-through begins.
// Overlay fully transparent at frame 190 (~1 s before animation ends at 251).
const FLY_THROUGH_START = 157
const FLY_THROUGH_END = 190

// Frame at which the status bar flips from black to the app theme color.
// Tune this if the flip happens too early or too late relative to when the D crosses the top.
const STATUS_BAR_FLIP_FRAME = 175

// 251 frames @ 60 fps ≈ 4.2 s. Force-dismiss after 7 s if complete event is late.
const SPLASH_MAX_MS = 7000

// Derive the correct theme color from the current <html> class.
function splashThemeColor() {
  const isDark = document.documentElement.classList.contains('dark')
  return { bg: isDark ? '#09090b' : '#fafafa', meta: isDark ? '#09090b' : '#ffffff' }
}

/**
 * Cold-boot Lottie splash.
 *
 * Layer stack (bottom → top inside the fixed container):
 *   1. overlay div  — bg-black, opacity driven by direct DOM ref (not React state).
 *                     Shows through the transparent D-hole pixels in the canvas.
 *                     Fades 1→0 during frames 157–190 to reveal the feed behind.
 *   2. canvas       — DotLottie renders here via OffscreenCanvas so the WASM path
 *                     calls set_background(0,0,0,0) → true transparent D-hole pixels.
 *   3. preFrameCover — always bg-black. Hides the blank canvas while WASM boots,
 *                     and keeps the iOS translucent status bar dark from the start.
 *                     Removed one rAF after the first Lottie frame to avoid a
 *                     transparent-canvas white flash.
 *
 * Status bar control:
 *   On mount we force body/html background + theme-color meta to #000 so iOS's
 *   translucent status bar appears black. At STATUS_BAR_FLIP_FRAME we restore both
 *   to the app's theme values, triggering iOS to re-evaluate the status bar tint.
 *   The overlay's opacity fade then reveals the white feed, completing the transition.
 */
export default function LoungeAppSplash({ dismissing = false, onAnimationComplete }) {
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const preFrameCoverRef = useRef(null)
  const onCompleteRef = useRef(onAnimationComplete)
  onCompleteRef.current = onAnimationComplete

  useLayoutEffect(() => {
    // Force black body/html background + theme-color so iOS translucent status bar is dark.
    const root = document.documentElement
    const body = document.body
    const themeMeta = document.querySelector('meta[name="theme-color"]')
    root.style.setProperty('background', '#000', 'important')
    body.style.setProperty('background', '#000', 'important')
    if (themeMeta) themeMeta.setAttribute('content', '#000000')

    // Restore body/html background + theme-color to the current app theme.
    // Explicitly setting (not just removeProperty) triggers iOS to re-evaluate the status bar.
    function restoreStatusBar() {
      const { bg, meta } = splashThemeColor()
      root.style.setProperty('background', bg, 'important')
      body.style.setProperty('background', bg, 'important')
      if (themeMeta) themeMeta.setAttribute('content', meta)
    }

    // Remove inline overrides entirely once the splash is fully gone.
    function removeInlineOverrides() {
      root.style.removeProperty('background')
      body.style.removeProperty('background')
    }

    const canvas = canvasRef.current
    if (!canvas) {
      removeInlineOverrides()
      return
    }

    // getBoundingClientRect() measures the actual rendered CSS size after layout —
    // correct on iOS PWA with viewport-fit:cover where window.innerHeight ≠ full screen.
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)

    // OffscreenCanvas forces the dotlottie-web WASM rendering path which calls
    // set_background(0,0,0,0) → genuinely transparent clear color → D-hole pixels
    // in the visible canvas are transparent, letting the overlay show through.
    const offscreen = new OffscreenCanvas(canvas.width, canvas.height)
    const ctx = canvas.getContext('2d')

    const player = new DotLottie({
      canvas: offscreen,
      data: EDGE_SPLASH_DATA,
      autoplay: true,
      loop: false,
      useFrameInterpolation: false,
      backgroundColor: '#00000000',
      layout: { fit: 'cover', align: [0.5, 0.5] },
      renderConfig: { autoResize: false },
    })

    let barFlipped = false
    const done = () => {
      if (!barFlipped) { barFlipped = true; restoreStatusBar() }
      removeInlineOverrides()
      onCompleteRef.current?.()
    }
    const fallback = setTimeout(done, SPLASH_MAX_MS)

    player.addEventListener('frame', ({ currentFrame }) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(offscreen, 0, 0)

      // Delay hiding the preFrameCover by one rAF so the canvas drawImage has been
      // composited to screen first — prevents a transparent-canvas white flash.
      if (preFrameCoverRef.current) {
        const cover = preFrameCoverRef.current
        preFrameCoverRef.current = null
        requestAnimationFrame(() => { cover.style.display = 'none' })
      }

      // Flip status bar from black to theme color as the D crosses the top of the screen.
      // Explicitly setting background + theme-color triggers iOS to re-evaluate the tint.
      if (!barFlipped && currentFrame >= STATUS_BAR_FLIP_FRAME) {
        barFlipped = true
        restoreStatusBar()
      }

      // Fade the overlay via direct DOM mutation — not setState — so it works
      // reliably inside DotLottie's native event listener on iOS PWA.
      if (currentFrame >= FLY_THROUGH_START && overlayRef.current) {
        const t = Math.min(1, (currentFrame - FLY_THROUGH_START) / (FLY_THROUGH_END - FLY_THROUGH_START))
        overlayRef.current.style.opacity = String(1 - t)
      }
    })

    player.addEventListener('complete', () => {
      clearTimeout(fallback)
      done()
    })

    return () => {
      removeInlineOverrides()
      clearTimeout(fallback)
      player.destroy()
    }
  }, [])

  return (
    <div
      className={`lounge-cold-boot-splash fixed inset-0 z-[120] pointer-events-none ${
        dismissing ? 'lounge-cold-boot-splash--out' : ''
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading Lounge"
    >
      {/* 1. Overlay — behind canvas, shows through transparent D-hole */}
      <div ref={overlayRef} className="absolute inset-0 bg-black pointer-events-none" aria-hidden />

      {/* 2. Canvas — Lottie renders here via OffscreenCanvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden />

      {/* 3. Pre-frame cover — on top, hides blank canvas until WASM boots.
               Always black regardless of theme: the Lottie opens with a black
               Black Solid 1 layer anyway, so preFrame→frame-1 is seamless, and
               the black content makes the iOS translucent status bar appear black. */}
      <div ref={preFrameCoverRef} className="absolute inset-0 bg-black" aria-hidden />
    </div>
  )
}
