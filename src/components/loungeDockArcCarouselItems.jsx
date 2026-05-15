/** Dock-style glyphs for the arc carousel prototype (mirrors `LoungeDockFooterBar` strokes). */

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.65,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
}

const cyanStroke = {
  stroke: '#22d3ee',
  strokeWidth: 1.85,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
}

function IconHome() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden>
      <path {...stroke} d="M4.5 10.25 12 4l7.5 6.25V19a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5h-4v4.5a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75v-8.75z" />
      <path {...cyanStroke} d="M4.5 10.25 12 4 19.5 10.25" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden>
      <circle {...stroke} cx="10.25" cy="10.25" r="6.25" />
      <path {...stroke} d="M15.5 15.5 21 21" />
    </svg>
  )
}

function IconFollowing({ active }) {
  const c = active ? '#22d3ee' : 'currentColor'
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden>
      <circle cx="9" cy="7.5" r="3.25" fill="none" stroke={c} strokeWidth="1.65" />
      <path
        fill="none"
        stroke={c}
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.5 19.5c0-3.1 2.46-5.25 5.5-5.25s5.5 2.15 5.5 5.25"
      />
      <path stroke="#22d3ee" strokeWidth="1.65" strokeLinecap="round" d="M16.5 14.5h4M18.5 12.5v4" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden>
      <path
        {...stroke}
        d="M10.5 6.75a3.75 3.75 0 017.5 0v.75c0 4.25 1.75 6.5 1.75 6.5H8.75S10.5 12.75 10.5 8.5v-.75z"
      />
      <circle cx="12" cy="19.25" r="1.35" className="fill-cyan-400" stroke="none" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden>
      <path
        {...stroke}
        d="M6.75 5.25h10.5a2.25 2.25 0 012.25 2.25v6a2.25 2.25 0 01-2.25 2.25h-5.03l-3.72 2.48V15.75H6.75a2.25 2.25 0 01-2.25-2.25v-6a2.25 2.25 0 012.25-2.25z"
      />
      <circle cx="9" cy="10.5" r="1.05" className="fill-cyan-400" stroke="none" />
      <circle cx="12" cy="10.5" r="1.05" className="fill-cyan-400" stroke="none" />
      <circle cx="15" cy="10.5" r="1.05" className="fill-cyan-400" stroke="none" />
    </svg>
  )
}

export function buildLoungeDockArcCarouselItems({
  onHome,
  onSearch,
  onFollowingFilterToggle,
  followingFilterOn,
  followingFilterDisabled,
  onNotifications,
  onChat,
  activePanel,
}) {
  return [
    {
      id: 'home',
      label: 'Home',
      icon: <IconHome />,
      onSelect: onHome,
      active: false,
    },
    {
      id: 'search',
      label: 'Search',
      icon: <IconSearch />,
      onSelect: onSearch,
      active: activePanel === 'search',
    },
    {
      id: 'following',
      label: 'Following',
      icon: <IconFollowing active={followingFilterOn} />,
      onSelect: onFollowingFilterToggle,
      active: followingFilterOn,
      disabled: followingFilterDisabled,
    },
    {
      id: 'notifications',
      label: 'Alerts',
      icon: <IconBell />,
      onSelect: onNotifications,
      active: activePanel === 'notifications',
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: <IconChat />,
      onSelect: onChat,
      active: activePanel === 'chat',
    },
  ]
}
