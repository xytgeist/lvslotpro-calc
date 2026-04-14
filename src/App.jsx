import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import PhoenixLink from './calculators/PhoenixLink'
import BuffaloLink from './calculators/BuffaloLink'
import StackUpPays from './calculators/StackUpPays'

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
        <div className="bg-gray-900 p-8 rounded-3xl max-w-sm w-full">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Las Vegas Slot Pro</h2>
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
            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 py-4 rounded-2xl font-bold">Log In</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div>
        {currentView === 'dashboard' ? (
          <div className="max-w-lg mx-auto px-4 py-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-black text-white tracking-tight">Las Vegas Slot Pro</h1>
              <p className="text-zinc-400 mt-3">Select a calculator</p>
            </div>

            {/* Phoenix Link */}
            <button
              onClick={() => setCurrentView('phoenix')}
              className="w-full bg-gray-900 hover:bg-gray-800 transition-colors p-8 rounded-3xl text-left flex items-center gap-5 mb-4 h-28"
            >
              <img 
                src="/phoenix-link-logo.png" 
                alt="Phoenix" 
                className="w-16 h-16 rounded-xl flex-shrink-0" 
              />
              <div>
                <div className="font-semibold text-2xl text-orange-400">Phoenix Link EV Calc</div>
                <div className="text-base text-gray-400">Must-hit counter bonus analyzer</div>
              </div>
            </button>

            {/* Buffalo Link */}
            <button
              onClick={() => setCurrentView('buffalo')}
              className="w-full bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 hover:from-amber-500 hover:via-orange-500 hover:to-red-600 p-8 rounded-3xl text-left flex items-center gap-5 mb-4 h-28 transition-all active:scale-[0.985]"
            >
              <div className="w-16 h-16 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-inner flex-shrink-0">
                <img 
                  src="/buffalo-icon.png" 
                  alt="Buffalo" 
                  className="w-14 h-14 object-contain" 
                />
              </div>
              <div>
                <div className="font-semibold text-2xl text-amber-100">Buffalo Link EV Calc</div>
                <div className="text-base text-amber-200">Midpoint-based counter analyzer</div>
              </div>
            </button>

            {/* Stack Up Pays - now same height */}
            <button
              onClick={() => setCurrentView('stackup')}
              className="w-full bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-500 hover:via-sky-500 hover:to-blue-600 p-8 rounded-3xl text-left flex items-center gap-5 mb-4 h-28 transition-all active:scale-[0.985]"
            >
              <img 
                src="/stackup-icon.jpg" 
                alt="Stack Up Pays" 
                className="w-16 h-16 object-cover rounded-2xl shadow-lg flex-shrink-0" 
              />
              <div>
                <div className="font-semibold text-2xl text-cyan-100">Stack Up Pays</div>
                <div className="text-base text-cyan-200">Ascending Fortunes • 5-meter analyzer</div>
              </div>
            </button>
          </div>
        ) : currentView === 'phoenix' ? (
          <PhoenixLink onBack={() => setCurrentView('dashboard')} />
        ) : currentView === 'buffalo' ? (
          <BuffaloLink onBack={() => setCurrentView('dashboard')} />
        ) : (
          <StackUpPays onBack={() => setCurrentView('dashboard')} />
        )}
      </div>
    </div>
  )
}

export default App