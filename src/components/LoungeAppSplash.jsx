import { useEffect, useRef } from 'react'
import { DotLottie } from '@lottiefiles/dotlottie-web'
import wasmUrl from '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url'
import edgeSplashData from '../assets/lottie/edge-splash-v1.json'

// Set WASM URL once at module load — must happen before any DotLottie instance is created
DotLottie.setWasmUrl(wasmUrl)
const SPLASH_DATA = JSON.stringify(edgeSplashData)

/**
 * Full-screen Edge logo Lottie splash. Shown during Lounge cold boot / long resume.
 *
 * Compositing trick for the D hole reveal:
 *   - The container uses `isolation: isolate` to create a self-contained compositing group.
 *   - Inside that group, the canvas uses `mix-blend-mode: destination-in`.
 *   - destination-in keeps the dark bg wherever the canvas is OPAQUE (D letter body)
 *     and punches it transparent wherever the canvas is TRANSPARENT (the D hole).
 *   - Transparent pixels in the isolated group fall through to the app beneath z-120,
 *     so the hole becomes a live window into the feed — immediately, no fade needed.
 *
 * @param {{ dismissing?: boolean, onAnimationComplete?: () => void }} props
 */
export default function LoungeAppSplash({ dismissing = false, onAnimationComplete }) {
  const canvasRef = useRef(null)
  const onCompleteRef = useRef(onAnimationComplete)
  onCompleteRef.current = onAnimationComplete

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dotLottie = new DotLottie({
      canvas,
      data: SPLASH_DATA,
      autoplay: true,
      loop: false,
      useFrameInterpolation: false,
    })

    dotLottie.addEventListener('complete', () => {
      onCompleteRef.current?.()
    })

    return () => {
      dotLottie.destroy()
    }
  }, [])

  return (
    <div
      className={`lounge-cold-boot-splash fixed inset-0 z-[120] flex flex-col items-center justify-center ${
        dismissing ? 'lounge-cold-boot-splash--out' : ''
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        isolation: 'isolate',
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading Lounge"
    >
      {/* Dark background — kept opaque wherever the D body covers it */}
      <div className="absolute inset-0 bg-zinc-950 pointer-events-none" aria-hidden />
      <div className="lounge-cold-boot-splash__glow pointer-events-none absolute inset-0" aria-hidden />
      {/*
        destination-in: canvas is the "source", dark bg is the "destination".
        Opaque D pixels → keep destination (dark) | Transparent hole pixels → punch through.
      */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none relative h-[80vw] w-[80vw] max-h-[380px] max-w-[380px]"
        style={{ transform: 'scale(1.5)', transformOrigin: 'center', mixBlendMode: 'destination-in' }}
        aria-hidden
      />
    </div>
  )
}
