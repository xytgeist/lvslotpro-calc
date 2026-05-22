import { APP_BUILD_SHA } from '../utils/appBuildInfo.js'

/**
 * Muted title-bar status: optional feed refresh copy + git build SHA.
 * SHA: local dev always; deploys when staff enables Settings → Build SHA in title bar.
 */
export default function TitleBarStatusLine({ loading = false, showBuildBadge = false }) {
  const showBuild = import.meta.env.DEV || showBuildBadge
  if (!loading && !showBuild) return null

  return (
    <div className="pointer-events-none min-w-0 shrink-0 text-right text-zinc-600 text-[13px]">
      {loading ? 'Updating…' : null}
      {loading && showBuild ? ' · ' : null}
      {showBuild ? (
        <span className="font-mono text-amber-600/90" title={`Build ${APP_BUILD_SHA}`}>
          {APP_BUILD_SHA}
        </span>
      ) : null}
    </div>
  )
}
