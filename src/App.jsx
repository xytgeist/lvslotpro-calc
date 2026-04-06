import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import PhoenixLink from './calculators/PhoenixLink'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAllowed, setIsAllowed] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [currentView, setCurrentView] = useState('dashboard')
  const [showMenu, setShowMenu] = useState(false)   // ← Added for hamburger

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) checkWhitelist(session.user.email)
      else setIsChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) checkWhitelist(session.user.email)
      else {
        setIsAllowed(false)
        setIsChecking(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkWhitelist = async (userEmail) => {
    const { data } = await supabase.from('allowed_emails').select('email').eq('email', userEmail).single()
    setIsAllowed(!!data)
    setIsChecking(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (isChecking) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>
  }

  if (!user || !isAllowed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-3xl max-w-sm w-full">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Las Vegas Slot Pro</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 bg-gray-800 rounded-2xl text-white" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-gray-800 rounded-2xl text-white" required />
            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 py-4 rounded-2xl font-bold">Log In</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Title Bar - Hamburger only, no text, no logout */}
      {currentView !== 'dashboard' && (
        <div className="fixed top-0 left-0 right-0 bg-zinc-950 border-b border-zinc-800 z-50">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-3xl text-orange-400 hover:text-orange-300"
            >
              ☰
            </button>
            <div className="w-8" /> {/* spacer */}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={currentView !== 'dashboard' ? 'pt-12' : ''}>
        {currentView === 'dashboard' ? (
          <div className="max-w-lg mx-auto px-4 py-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-black text-white tracking-tight">Las Vegas Slot Pro</h1>
              <p className="text-zinc-400 mt-3">Select a calculator</p>
            </div>
            <button
              onClick={() => setCurrentView('phoenix')}
              className="w-full bg-gray-900 hover:bg-gray-800 transition-colors p-8 rounded-3xl text-left flex items-center gap-4"
            >
              <img src="/phoenix-link-logo.png" alt="Phoenix" className="w-12 h-12 rounded-xl" />
              <div>
                <div className="font-semibold text-xl text-orange-400">Phoenix Link EV Calc</div>
                <div className="text-sm text-gray-400">Must-hit counter bonus analyzer</div>
              </div>
            </button>
          </div>
        ) : (
          <PhoenixLink 
            onBack={() => setCurrentView('dashboard')} 
            showMenu={showMenu} 
            setShowMenu={setShowMenu} 
          />
        )}
      </div>
    </div>
  )
}

export default App