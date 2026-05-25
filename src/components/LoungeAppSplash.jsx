import { useLayoutEffect, useRef, useState } from 'react'
import { DotLottie } from '@lottiefiles/dotlottie-web'
import wasmUrl from '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url'
import edgeSplashData from '../assets/lottie/edge-splash-v2.json'

DotLottie.setWasmUrl(wasmUrl)
const EDGE_SPLASH_DATA = JSON.stringify(edgeSplashData)

/** D zoom + counter hole begins in edge-splash-v2 (60fps comp, 219 frames). */
const ZOOM_PHASE_FRAME = 168

/**
 * Edge cold-boot splash: draw-on then fly through the D counter into the feed.
 *
 * Phase 1 — draw: full-viewport Lottie on solid dark bg.
 * Phase 2 — zoom: `mix-blend-mode: destination-in` punches the D hole transparent so
 *   the Lounge feed beneath z-[120] shows through while the letter body keeps the cover.
 *
 * @param {{ dismissing?: boolean, onAnimationComplete?: () => void }} props
 */
export default function LoungeAppSplash({ dismissing = false, onAnimationComplete }) {
  const canvasRef = useRef(null)
  const shellRef = useRef(null)
  const onCompleteRef = useRef(onAnimationComplete)
  onCompleteRef.current = onAnimationComplete
  const [phase, setPhase] = useState('draw') // 'draw' | 'zoom'

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let player = null
    let zoomStarted = false

    const beginZoomPhase = () => {
      if (zoomStarted) return
      zoomStarted = true
      if (shellRef.current) {
        shellRef.current.style.isolation = 'isolate'
      }
      canvas.style.mixBlendMode = 'destination-in'
      setPhase('zoom')
    }

    player = new DotLottie({
      canvas,
      data: EDGE_SPLASH_DATA,
      autoplay: true,
      loop: false,
      useFrameInterpolation: false,
      backgroundColor: 'transparent',
      layout: { fit: 'cover', align: [0.5, 0.5] },
      renderConfig: { autoResize: true },
    })

    player.addEventListener('frame', (event) => {
      if (event.currentFrame >= ZOOM_PHASE_FRAME) {
        beginZoomPhase()
      }
    })

    player.addEventListener('complete', () => onCompleteRef.current?.())

    return () => player?.destroy()
  }, [])

  const isZoom = phase === 'zoom'

  return (
    <div
      ref={shellRef}
      className={`lounge-cold-boot-splash fixed inset-0 z-[120] ${
        dismissing ? 'lounge-cold-boot-splash--out' : ''
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        isolation: isZoom ? 'isolate' : 'auto',
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading Lounge"
    >
      <div
        className={`pointer-events-none absolute inset-0 ${isZoom ? '' : 'bg-zinc-950'}`}
        style={isZoom ? { backgroundColor: '#09090b' } : undefined}
        aria-hidden
      />
      {!isZoom ? (
        <div className="lounge-cold-boot-splash__glow pointer-events-none absolute inset-0" aria-hidden />
      ) : null}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{
          background: 'transparent',
          mixBlendMode: isZoom ? 'destination-in' : 'normal',
        }}
        aria-hidden
      />
    </div>
  )
}
