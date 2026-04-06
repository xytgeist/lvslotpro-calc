import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import PhoenixLink from './calculators/PhoenixLink'
import BuffaloLink from './calculators/BuffaloLink'

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

  // Password Reset states
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isResetMode, setIsResetMode] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) checkWhitelist(session.user.email)
      else setIsChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkWhitelist(session.user.email)
      } else {
        setIsAllowed(false)
        setIsChecking(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkWhitelist = async (userEmail) => {
    const { data } = await supabase
      .from('allowed_emails')
      .select('email')
      .eq('email', userEmail)
      .single()
    setIsAllowed(!!data)
    setIsChecking(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsChecking(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert('Login failed: ' + error.message)
      setIsChecking(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) alert(error.message)
    else setResetEmailSent(true)
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user || !isAllowed) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 rounded-3xl p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">Las Vegas Slot Pro</h1>
          
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <h2 className="text-xl text-center">Reset Password</h2>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-zinc-800 rounded-2xl text-white"
                required
              />
              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 py-4 rounded-2xl font-bold text-lg transition-colors"
              >
                Send Reset Link
              </button>
              {resetEmailSent && <p className="text-green-400 text-center">Reset link sent!</p>}
              <button
                type="button"
                onClick={() => { setShowForgotPassword(false); setResetEmailSent(false); }}
                className="w-full text-gray-400 hover:text-white"
              >
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-zinc-800 rounded-2xl text-white"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-zinc-800 rounded-2xl text-white"
                required
              />
              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 py-4 rounded-2xl font-bold text-lg transition-colors"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-gray-400 hover:text-white text-sm"
              >
                Forgot Password?
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Title Bar - only on calculators */}
      {currentView !== 'dashboard' && (
        <div className="fixed top-0 left-0 right-0 bg-zinc-950 border-b border-zinc-800 z-50">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="text-3xl text-amber-400 hover:text-amber-300 transition-colors"
            >
              ←
            </button>
            <div className="text-xl font-semibold tracking-wide">Las Vegas Slot Pro</div>
            <div className="w-8"></div>
          </div>
        </div>
      )}

      <div className={currentView !== 'dashboard' ? 'pt-20' : 'pt-8'}>

        {currentView === 'dashboard' && (
          <div className="max-w-lg mx-auto px-4 py-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-black tracking-tighter text-white">Las Vegas Slot Pro</h1>
              <p className="text-gray-400 mt-2">Progressive Link EV Calculators</p>
            </div>

            <div className="space-y-6">
              {/* Phoenix Link Button */}
              <button
                onClick={() => setCurrentView('phoenix')}
                className="w-full bg-gradient-to-br from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 p-8 rounded-3xl flex items-center gap-6 transition-all active:scale-[0.985]"
              >
                <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0">🔥</div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-white">Phoenix Link</div>
                  <div className="text-orange-200 text-sm">Must-hit by 1888</div>
                </div>
              </button>

              {/* Buffalo Link Button - Updated with your image colors */}
              <button
                onClick={() => setCurrentView('buffalo')}
                className="w-full bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 hover:from-amber-500 hover:via-orange-500 hover:to-red-600 p-8 rounded-3xl flex items-center gap-6 transition-all active:scale-[0.985]"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0 shadow-inner border border-amber-300">🦬</div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-amber-100">Buffalo Link</div>
                  <div className="text-amber-200 text-sm">Must-hit by 1800 • Midpoint EV</div>
                </div>
              </button>
            </div>

            {/* Logout */}
            <div className="text-center mt-16">
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-400 text-sm underline"
              >
                Log Out
              </button>
            </div>
          </div>
        )}

        {currentView === 'phoenix' && <PhoenixLink onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'buffalo' && <BuffaloLink onBack={() => setCurrentView('dashboard')} />}

      </div>
    </div>
  )
}

export default App