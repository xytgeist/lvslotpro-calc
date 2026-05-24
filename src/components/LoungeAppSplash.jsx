import { useEffect, useRef } from 'react'
import edgeSplashData from '../assets/lottie/edge-splash-v1.json'

/**
 * Full-screen Edge logo Lottie splash. Shown during Lounge cold boot / long resume.
 * @param {{ dismissing?: boolean, onAnimationComplete?: () => void }} props
 */
export default function LoungeAppSplash({ dismissing = false, onAnimationComplete }) {
  const containerRef = useRef(null)
  const onAnimationCompleteRef = useRef(onAnimationComplete)
  onAnimationCompleteRef.current = onAnimationComplete

  useEffect(() => {
    let animation = null
    let cancelled = false

    import('lottie-web').then(({ default: lottie }) => {
      if (cancelled || !containerRef.current) return
      animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'canvas',
        loop: false,
        autoplay: true,
        animationData: edgeSplashData,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
          clearCanvas: true,
        },
      })
      animation.addEventListener('complete', () => {
        onAnimationCompleteRef.current?.()
      })
    })

    return () => {
      cancelled = true
      animation?.destroy()
    }
  }, [])

  return (
    <div
      className={`lounge-cold-boot-splash fixed inset-0 z-[120] flex flex-col items-center justify-center bg-zinc-950 ${
        dismissing ? 'lounge-cold-boot-splash--out' : ''
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading Lounge"
    >
      <div className="lounge-cold-boot-splash__glow pointer-events-none absolute inset-0" aria-hidden />
      <div
        ref={containerRef}
        className="pointer-events-none h-56 w-56 sm:h-64 sm:w-64"
        aria-hidden
      />
    </div>
  )
}
