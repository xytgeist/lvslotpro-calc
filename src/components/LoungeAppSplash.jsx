import { useEffect, useRef, useState } from 'react'
import { DotLottie } from '@lottiefiles/dotlottie-web'
import wasmUrl from '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url'
import edgeSplashData from '../assets/lottie/edge-splash-v1.json'

// Set WASM URL once at module load — must happen before any DotLottie instance is created
DotLottie.setWasmUrl(wasmUrl)
const SPLASH_DATA = JSON.stringify(edgeSplashData)

/**
 * Full-screen Edge logo Lottie splash. Shown during Lounge cold boot / long resume.
 *
 * Compositing: the dark bg is a separate child div so it can be faded out once the
 * zooming D has grown large enough to cover the screen. At that point the canvas is
 * transparent everywhere except the D letter body, so the D's counter (hole) becomes
 * a window straight through to the app behind the splash — the intended reveal effect.
 *
 * @param {{ dismissing?: boolean, onAnimationComplete?: () => void }} props
 */
export default function LoungeAppSplash({ dismissing = false, onAnimationComplete }) {
  const canvasRef = useRef(null)
  const onCompleteRef = useRef(onAnimationComplete)
  onCompleteRef.current = onAnimationComplete
  const [bgVisible, setBgVisible] = useState(true)
  const bgTimerRef = useRef(null)

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

    // When animation actually starts playing, schedule the bg fade-out to coincide
    // with the D growing large enough to fill the screen (~400ms into the 820ms anim).
    dotLottie.addEventListener('play', () => {
      bgTimerRef.current = setTimeout(() => setBgVisible(false), 400)
    })

    dotLottie.addEventListener('complete', () => {
      onCompleteRef.current?.()
    })

    return () => {
      clearTimeout(bgTimerRef.current)
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
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading Lounge"
    >
      {/* Dark background fades out when the D fills the screen, revealing app through the hole */}
      <div
        className={`absolute inset-0 bg-zinc-950 transition-opacity duration-300 pointer-events-none ${
          bgVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden
      />
      <div className="lounge-cold-boot-splash__glow pointer-events-none absolute inset-0" aria-hidden />
      <canvas
        ref={canvasRef}
        className="pointer-events-none relative h-[80vw] w-[80vw] max-h-[380px] max-w-[380px]"
        style={{ transform: 'scale(1.5)', transformOrigin: 'center' }}
        aria-hidden
      />
    </div>
  )
}
