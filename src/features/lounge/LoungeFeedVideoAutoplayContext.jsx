import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { createAutoplayStore } from './loungeFeedVideoAutoplayStore.js'

const LoungeFeedVideoAutoplayContext = createContext(null)

/**
 * Wrap the main lounge scroll area (children of the `overflow-y-auto` feed column).
 * @param {{ scrollRootRef: React.RefObject<HTMLElement | null>, children: React.React.ReactNode }} props
 */
export function LoungeFeedVideoAutoplayProvider({ scrollRootRef, children }) {
  const [store] = useState(() => createAutoplayStore())

  /** Shared across feed/embed Stream tiles: one “Tap for sound” enables inline audio on whichever tile is autoplaying. */
  const [feedInlineSoundUnmuted, setFeedInlineSoundUnmuted] = useState(false)
  const toggleFeedInlineSound = useCallback(() => {
    setFeedInlineSoundUnmuted((m) => !m)
  }, [])

  useEffect(() => {
    store.setScrollRootRef(scrollRootRef)
  }, [store, scrollRootRef])

  useEffect(() => {
    const onScrollOrResize = () => store.schedule()
    const el = scrollRootRef?.current
    if (el) {
      el.addEventListener('scroll', onScrollOrResize, { passive: true })
    }
    window.addEventListener('resize', onScrollOrResize)

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => store.schedule())
        : null
    if (ro && el) ro.observe(el)

    store.schedule()
    const kick = requestAnimationFrame(() => {
      store.schedule()
    })

    return () => {
      cancelAnimationFrame(kick)
      if (el) el.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      if (ro && el) ro.disconnect()
    }
  }, [store, scrollRootRef])

  const resetFeedInlineSound = useCallback(() => {
    setFeedInlineSoundUnmuted(false)
  }, [])

  const value = useMemo(
    () => ({
      store,
      feedInlineSoundUnmuted,
      toggleFeedInlineSound,
      resetFeedInlineSound,
    }),
    [store, feedInlineSoundUnmuted, toggleFeedInlineSound, resetFeedInlineSound],
  )

  return <LoungeFeedVideoAutoplayContext.Provider value={value}>{children}</LoungeFeedVideoAutoplayContext.Provider>
}

/**
 * Binds `resetRef.current` to `resetFeedInlineSound` from the nearest provider (for callers outside the subtree).
 * @param {{ resetRef: React.MutableRefObject<() => void> }} props
 */
export function LoungeFeedInlineSoundResetBinder({ resetRef }) {
  const ctx = useContext(LoungeFeedVideoAutoplayContext)
  useLayoutEffect(() => {
    const fn = ctx?.resetFeedInlineSound
    resetRef.current = typeof fn === 'function' ? fn : () => {}
    return () => {
      resetRef.current = () => {}
    }
  }, [ctx, resetRef])
  return null
}

/**
 * Single-feed autoplay: only `clientId` matching the mid-scroll winner may attach/play inline.
 * @param {string | null | undefined} clientId stable id per post+asset (e.g. `${postId}:${streamUid}`)
 * @param {() => HTMLElement | null} getContainerEl
 */
// eslint-disable-next-line react-refresh/only-export-components -- colocated store hook for this context module
export function useLoungeFeedVideoAutoplay(clientId, getContainerEl) {
  const ctx = useContext(LoungeFeedVideoAutoplayContext)
  const getEl = useCallback(() => getContainerEl(), [getContainerEl])

  useLayoutEffect(() => {
    if (!ctx?.store || !clientId) return undefined
    return ctx.store.register(clientId, getEl)
  }, [ctx, clientId, getEl])

  const winnerId = useSyncExternalStore(
    ctx?.store ? ctx.store.subscribe : () => () => {},
    ctx?.store ? ctx.store.getSnapshot : () => null,
    () => null,
  )

  const coordinatorActive = Boolean(ctx && clientId)
  const isWinner = Boolean(ctx && clientId && winnerId === clientId)

  return {
    coordinatorActive,
    isWinner,
    scheduleRecompute: ctx?.store?.schedule ?? (() => {}),
    feedSoundFromProvider: Boolean(ctx),
    feedInlineSoundUnmuted: ctx?.feedInlineSoundUnmuted ?? false,
    toggleFeedInlineSound: ctx?.toggleFeedInlineSound ?? (() => {}),
  }
}
