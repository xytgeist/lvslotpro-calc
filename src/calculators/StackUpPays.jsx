import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import PhoenixLink from './calculators/PhoenixLink'
import BuffaloLink from './calculators/BuffaloLink'
import StackUpPays from './calculators/StackUpPays'   // ← New import

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
        <div className="bg-gray-900 p-8 rounded-3xl max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">Las Vegas Slot Pro</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-gray-800 rounded-2xl text-white"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-gray-800 rounded-2xl text-white"
              required
            />
            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-2xl font-bold text-lg">
              Log In
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {currentView === 'dashboard' ? (
        <div className="p-6 max-w-lg mx-auto">
          <h1 className="text-4xl font-black text-center mb-10 text-white tracking-tight">Las Vegas Slot Pro</h1>

          <div className="space-y-4">
            {/* Phoenix Link Button */}
            <button
              onClick={() => setCurrentView('phoenix')}
              className="w-full bg-gray-900 hover:bg-gray-800 p-8 rounded-3xl text-left flex items-center gap-4"
            >
              <img src="/phoenix-link-logo.png" alt="Phoenix" className="w-14 h-14 rounded-xl" />
              <div>
                <div className="font-semibold text-2xl text-orange-400">Phoenix Link</div>
                <div className="text-sm text-gray-400">Must-hit by 1888</div>
              </div>
            </button>

            {/* Buffalo Link Button */}
            <button
              onClick={() => setCurrentView('buffalo')}
              className="w-full bg-gray-900 hover:bg-gray-800 p-8 rounded-3xl text-left flex items-center gap-4"
            >
              <img src="/buffalo-icon.png" alt="Buffalo" className="w-14 h-14 rounded-xl" />
              <div>
                <div className="font-semibold text-2xl text-amber-400">Buffalo Link</div>
                <div className="text-sm text-gray-400">Midpoint counter analyzer</div>
              </div>
            </button>

            {/* Stack Up Pays Button - Blue Surfer Theme */}
            <button
              onClick={() => setCurrentView('stackup')}
              className="w-full bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-500 hover:via-sky-500 hover:to-blue-600 p-8 rounded-3xl text-left flex items-center gap-4 shadow-lg"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-300 to-sky-400 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                🌊
              </div>
              <div>
                <div className="font-semibold text-2xl text-cyan-100">Stack Up Pays</div>
                <div className="text-sm text-cyan-200">5-meter expansion analyzer</div>
              </div>
            </button>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-400 text-sm underline"
            >
              Log Out
            </button>
          </div>
        </div>
      ) : currentView === 'phoenix' ? (
        <PhoenixLink onBack={() => setCurrentView('dashboard')} />
      ) : currentView === 'buffalo' ? (
        <BuffaloLink onBack={() => setCurrentView('dashboard')} />
      ) : (
        <StackUpPays onBack={() => setCurrentView('dashboard')} />
      )}
    </div>
  )
}

export default App