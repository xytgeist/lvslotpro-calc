/**
 * Lounge dock FAB neon preview palette — super-saturated glows for quick visual decisions.
 */

/** @typedef {{ bgIdle: string, bgLit: string, borderIdle: string, borderLit: string, ringLit: string, shadowIdle: string, shadowLit: string, textIdle: string, textLit: string }} LoungeDockItemGlow */

/** @type {Record<string, LoungeDockItemGlow>} */
export const LOUNGE_DOCK_ITEM_GLOW_BY_ID = {
  compose: {
    bgIdle: 'bg-[#1a0010]/92',
    bgLit: 'bg-[#2d0018]/96',
    borderIdle: 'border-[#ff2d7a]/80',
    borderLit: 'border-[#ff6eb4]',
    ringLit: 'ring-2 ring-[#ff2d7a]/70',
    shadowIdle: 'shadow-[0_0_20px_rgba(255,45,122,0.65),0_0_40px_rgba(255,45,122,0.28)]',
    shadowLit: 'shadow-[0_0_24px_rgba(255,80,150,0.95),0_0_48px_rgba(255,45,122,0.5)]',
    textIdle: 'text-[#ff8fc4]',
    textLit: 'text-white',
  },
  home: {
    bgIdle: 'bg-[#001318]/92',
    bgLit: 'bg-[#002028]/96',
    borderIdle: 'border-[#00f5ff]/80',
    borderLit: 'border-[#7ffbff]',
    ringLit: 'ring-2 ring-[#00f5ff]/70',
    shadowIdle: 'shadow-[0_0_20px_rgba(0,245,255,0.62),0_0_40px_rgba(0,245,255,0.26)]',
    shadowLit: 'shadow-[0_0_24px_rgba(0,255,255,0.95),0_0_48px_rgba(0,245,255,0.48)]',
    textIdle: 'text-[#7ffbff]',
    textLit: 'text-white',
  },
  search: {
    bgIdle: 'bg-[#001028]/92',
    bgLit: 'bg-[#001840]/96',
    borderIdle: 'border-[#3d9bff]/80',
    borderLit: 'border-[#7ec8ff]',
    ringLit: 'ring-2 ring-[#3d9bff]/70',
    shadowIdle: 'shadow-[0_0_20px_rgba(61,155,255,0.62),0_0_40px_rgba(61,155,255,0.26)]',
    shadowLit: 'shadow-[0_0_24px_rgba(100,180,255,0.95),0_0_48px_rgba(61,155,255,0.48)]',
    textIdle: 'text-[#9fd4ff]',
    textLit: 'text-white',
  },
  following: {
    bgIdle: 'bg-[#001408]/92',
    bgLit: 'bg-[#002210]/96',
    borderIdle: 'border-[#39ff14]/75',
    borderLit: 'border-[#8fff6a]',
    ringLit: 'ring-2 ring-[#39ff14]/65',
    shadowIdle: 'shadow-[0_0_20px_rgba(57,255,20,0.58),0_0_40px_rgba(57,255,20,0.24)]',
    shadowLit: 'shadow-[0_0_24px_rgba(100,255,80,0.92),0_0_48px_rgba(57,255,20,0.45)]',
    textIdle: 'text-[#b8ff9e]',
    textLit: 'text-white',
  },
  notifications: {
    bgIdle: 'bg-[#181000]/92',
    bgLit: 'bg-[#281800]/96',
    borderIdle: 'border-[#ffe600]/80',
    borderLit: 'border-[#fff566]',
    ringLit: 'ring-2 ring-[#ffe600]/70',
    shadowIdle: 'shadow-[0_0_20px_rgba(255,230,0,0.62),0_0_40px_rgba(255,230,0,0.26)]',
    shadowLit: 'shadow-[0_0_24px_rgba(255,245,80,0.95),0_0_48px_rgba(255,230,0,0.48)]',
    textIdle: 'text-[#fff3a0]',
    textLit: 'text-white',
  },
  chat: {
    bgIdle: 'bg-[#100018]/92',
    bgLit: 'bg-[#1a0028]/96',
    borderIdle: 'border-[#c44dff]/80',
    borderLit: 'border-[#e08cff]',
    ringLit: 'ring-2 ring-[#c44dff]/70',
    shadowIdle: 'shadow-[0_0_20px_rgba(196,77,255,0.62),0_0_40px_rgba(196,77,255,0.26)]',
    shadowLit: 'shadow-[0_0_24px_rgba(220,140,255,0.95),0_0_48px_rgba(196,77,255,0.48)]',
    textIdle: 'text-[#e4b0ff]',
    textLit: 'text-white',
  },
  settings: {
    bgIdle: 'bg-[#180018]/92',
    bgLit: 'bg-[#280028]/96',
    borderIdle: 'border-[#ff3dff]/80',
    borderLit: 'border-[#ff8af8]',
    ringLit: 'ring-2 ring-[#ff3dff]/70',
    shadowIdle: 'shadow-[0_0_20px_rgba(255,61,255,0.62),0_0_40px_rgba(255,61,255,0.26)]',
    shadowLit: 'shadow-[0_0_24px_rgba(255,120,255,0.95),0_0_48px_rgba(255,61,255,0.48)]',
    textIdle: 'text-[#ffaeff]',
    textLit: 'text-white',
  },
}

const FALLBACK_GLOW = LOUNGE_DOCK_ITEM_GLOW_BY_ID.home

export function loungeDockItemGlow(itemId) {
  return LOUNGE_DOCK_ITEM_GLOW_BY_ID[itemId] ?? FALLBACK_GLOW
}

/** Center menu (+) button — solid neon green fill, black icon, no border. */
export const LOUNGE_DOCK_FAB_CENTER_GLOW = {
  bg: 'bg-[#39ff14]',
  bgOpen: 'bg-[#4dff2e]',
  text: 'text-black',
  shadow: 'shadow-[0_0_26px_rgba(57,255,20,0.75),0_0_52px_rgba(57,255,20,0.35)]',
  shadowOpen: 'shadow-[0_0_32px_rgba(100,255,80,1),0_0_64px_rgba(57,255,20,0.55)]',
}
