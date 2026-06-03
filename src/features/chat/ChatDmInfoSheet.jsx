import { createPortal } from 'react-dom'
import { useState } from 'react'
import { chatMuteRoom, chatRoomIsMuted, chatUnmuteRoom } from './chatApi.js'
import { SectionLabel, SettingsGroup, SettingsToggleRow } from './chatSettingsUi.jsx'

/**
 * DM chat info — opened from the header avatar / name pill.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   supabaseClient: import('@supabase/supabase-js').SupabaseClient,
 *   room: { id: string, muted_until?: string | null },
 *   peerDisplayName: string,
 *   peerAvatarUrl?: string | null,
 *   peerHandle?: string | null,
 *   peerUserId?: string | null,
 *   onViewProfile?: ((userId: string) => void) | null,
 *   onRoomUpdated?: ((patch: Record<string, unknown>) => void) | null,
 *   viewerReadReceiptsEnabled: boolean,
 *   onViewerReadReceiptsEnabledChange?: ((enabled: boolean) => void | Promise<void>) | null,
 *   readReceiptsBusy?: boolean,
 * }} props
 */
export default function ChatDmInfoSheet({
  open,
  onClose,
  supabaseClient,
  room,
  peerDisplayName,
  peerAvatarUrl = null,
  peerHandle = null,
  peerUserId = null,
  onViewProfile = null,
  onRoomUpdated = null,
  viewerReadReceiptsEnabled,
  onViewerReadReceiptsEnabledChange = null,
  readReceiptsBusy = false,
}) {
  const [err, setErr] = useState('')
  const [muteBusy, setMuteBusy] = useState(false)
  const muted = chatRoomIsMuted(room.muted_until)
  const initial = (peerDisplayName || '?').replace(/^@/, '')[0]?.toUpperCase() || '?'

  if (typeof document === 'undefined' || !open) return null

  const handleToggleMute = async () => {
    setMuteBusy(true)
    setErr('')
    try {
      if (muted) {
        await chatUnmuteRoom(supabaseClient, room.id)
        onRoomUpdated?.({ muted_until: null })
      } else {
        await chatMuteRoom(supabaseClient, room.id, 8)
        onRoomUpdated?.({ muted_until: new Date(Date.now() + 8 * 3600000).toISOString() })
      }
    } catch (e) {
      setErr(e?.message || 'Could not update mute.')
    } finally {
      setMuteBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[95] flex flex-col bg-zinc-950" data-chat-feature>
      <div
        className="flex shrink-0 items-center gap-3 border-b border-zinc-800/60 px-3 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 touch-manipulation active:bg-zinc-800"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="flex-1 text-[17px] font-semibold text-zinc-100">Chat info</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-10">
        {err ? (
          <div className="mx-4 mt-3 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2.5 text-[13px] text-rose-300">
            {err}
          </div>
        ) : null}

        <div className="flex flex-col items-center px-4 pb-5 pt-6">
          {peerAvatarUrl ? (
            <img
              src={peerAvatarUrl}
              alt={peerDisplayName}
              className="h-[84px] w-[84px] rounded-full object-cover shadow-lg ring-2 ring-white/15"
            />
          ) : (
            <div className="grid h-[84px] w-[84px] place-items-center rounded-full bg-zinc-700 text-[28px] font-bold text-zinc-300 shadow-lg ring-2 ring-white/15">
              {initial}
            </div>
          )}
          <h2 className="mt-3 text-center text-[20px] font-bold text-zinc-50">{peerDisplayName}</h2>
          {peerHandle ? (
            <p className="mt-0.5 text-[14px] text-zinc-500">@{peerHandle.replace(/^@/, '')}</p>
          ) : null}
        </div>

        {peerUserId && onViewProfile ? (
          <>
            <SectionLabel>Profile</SectionLabel>
            <SettingsGroup>
              <button
                type="button"
                onClick={() => { onClose(); onViewProfile(peerUserId) }}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left touch-manipulation active:bg-zinc-800"
              >
                <span className="flex-1 text-[14px] font-medium text-zinc-100">View profile</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-zinc-600">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </SettingsGroup>
          </>
        ) : null}

        <SectionLabel>Privacy</SectionLabel>
        <SettingsGroup>
          <SettingsToggleRow
            label="Read receipts"
            hint="When off, you won't send or see read receipts."
            enabled={viewerReadReceiptsEnabled}
            busy={readReceiptsBusy}
            onToggle={() => onViewerReadReceiptsEnabledChange?.(!viewerReadReceiptsEnabled)}
          />
        </SettingsGroup>

        <SectionLabel>Notifications</SectionLabel>
        <SettingsGroup>
          <button
            type="button"
            disabled={muteBusy}
            onClick={() => void handleToggleMute()}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left touch-manipulation active:bg-zinc-800 disabled:opacity-50"
          >
            <span className="flex-1 text-[14px] font-medium text-zinc-100">
              {muted ? 'Unmute notifications' : 'Mute notifications'}
            </span>
            <span className={`text-[13px] ${muted ? 'text-amber-400' : 'text-zinc-500'}`}>
              {muted ? 'On' : 'Off'}
            </span>
          </button>
        </SettingsGroup>
      </div>
    </div>,
    document.body,
  )
}
