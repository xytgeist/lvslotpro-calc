const STATUS_BAR_META = 'apple-mobile-web-app-status-bar-style'
const THEME_COLOR_META = 'theme-color'

/**
 * Best-effort: make the iOS status bar translucent while a surface is mounted
 * (chat conversation), then restore.
 *
 * Note: installed Home Screen PWAs often cache status-bar-style at install and
 * ignore runtime flips. Safari tabs are more likely to honor this. Prefer this
 * over a global index.html meta so Lounge/other tabs stay on the default bar.
 *
 * @param {'default' | 'black' | 'black-translucent'} style
 * @param {{ themeColor?: string | null }} [opts]
 * @returns {() => void} cleanup
 */
export function applyTemporaryIosStatusBarStyle(style, opts = {}) {
  if (typeof document === 'undefined') return () => {}

  let statusMeta = document.querySelector(`meta[name="${STATUS_BAR_META}"]`)
  const createdStatus = !statusMeta
  if (!statusMeta) {
    statusMeta = document.createElement('meta')
    statusMeta.setAttribute('name', STATUS_BAR_META)
    document.head.appendChild(statusMeta)
  }
  const prevStatus = statusMeta.getAttribute('content')
  statusMeta.setAttribute('content', style)

  let themeMeta = null
  let prevTheme = null
  let createdTheme = false
  if (opts.themeColor) {
    themeMeta = document.querySelector(`meta[name="${THEME_COLOR_META}"]`)
    if (!themeMeta) {
      themeMeta = document.createElement('meta')
      themeMeta.setAttribute('name', THEME_COLOR_META)
      document.head.appendChild(themeMeta)
      createdTheme = true
    }
    prevTheme = themeMeta.getAttribute('content')
    themeMeta.setAttribute('content', opts.themeColor)
  }

  return () => {
    if (createdStatus) {
      statusMeta.remove()
    } else if (prevStatus != null) {
      statusMeta.setAttribute('content', prevStatus)
    } else {
      statusMeta.removeAttribute('content')
    }
    if (themeMeta) {
      if (createdTheme) themeMeta.remove()
      else if (prevTheme != null) themeMeta.setAttribute('content', prevTheme)
    }
  }
}
