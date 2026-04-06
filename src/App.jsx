import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import PhoenixLink from './calculators/PhoenixLink'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  const [user, setUser] = useState(null)
  const [isAllowed, setIsAllowed] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [currentView, setCurrentView] = useState('dashboard')

  // Login form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Password Reset
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isResetMode, setIsResetMode] = useState(false)

  // Auth + Whitelist
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const isRecovery = window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token')

      if (isRecovery && session?.user) {
        setIsResetMode(true)
        setUser(session.user)
        setIsChecking(false)
        return
      }

      setUser(session?.user ?? null)
      if (session?.user?.email && !isRecovery) {
        checkEmailAllowed(session.user.email)
      } else {
        setIsChecking(false)
      }
    }

    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsAllowed(false)
        setCurrentView('dashboard')
        setIsChecking(false)
      } else if (event === 'PASSWORD_RECOVERY') {
        setIsResetMode(true)
        setUser(session?.user)
        setIsChecking(false)
      } else {
        checkSession()
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const checkEmailAllowed = async (userEmail) => {
    const cleanEmail = userEmail.toLowerCase().trim()
    const { data, error } = await supabase
      .from('allowed_emails')
      .select('email')
      .eq('email', cleanEmail)
      .single()
    setIsAllowed(!!data && !error)
    setIsChecking(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (isChecking) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="text-orange-500 text-xl">Loading...</div></div>
  }

  if (isResetMode) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-3xl w-full max-w-sm">
          <h1 className="text-3xl font-bold text-orange-500 text-center mb-8">Set New Password</h1>
          <input 
            type="password" 
            placeholder="New Password (min 6 characters)" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            className="w-full p-4 bg-gray-800 rounded-2xl mb-6 text-white text-lg" 
          />
          <button 
            onClick={async () => {
              const { error } = await supabase.auth.updateUser({ password: newPassword })
              if (error) alert(error.message)
              else {
                alert("Password updated successfully!")
                setIsResetMode(false)
                window.location.reload()
              }
            }} 
            className="w-full bg-orange-600 py-4 rounded-2xl font-bold text-lg"
          >
            Update Password
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-3xl w-full max-w-sm">
          <h1 className="text-3xl font-bold text-orange-500 text-center mb-8">Phoenix Link EV Calc</h1>
          
          {showForgotPassword ? (
            <>
              <h2 className="text-xl text-center mb-6">Reset Password</h2>
              <input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full p-4 bg-gray-800 rounded-2xl mb-4 text-white text-lg" 
              />
              <button 
                onClick={async () => {
                  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://lvslotpro.com' })
                  if (error) alert(error.message)
                  else {
                    setResetEmailSent(true)
                    alert('Password reset link sent!')
                  }
                }} 
                className="w-full bg-orange-600 py-4 rounded-2xl font-bold text-lg mb-3"
              >
                Send Reset Link
              </button>
              <button onClick={() => setShowForgotPassword(false)} className="w-full bg-gray-700 py-4 rounded-2xl font-bold text-lg">Back to Login</button>
              {resetEmailSent && <p className="text-green-400 text-center mt-4">Reset link sent!</p>}
            </>
          ) : (
            <>
              <input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full p-4 bg-gray-800 rounded-2xl mb-4 text-white text-lg" 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-4 bg-gray-800 rounded-2xl mb-6 text-white text-lg" 
              />
              <button 
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithPassword({ email, password })
                  if (error) alert(error.message)
                }} 
                className="w-full bg-orange-600 py-4 rounded-2xl font-bold text-lg mb-3"
              >
                Login
              </button>
              <button 
                onClick={async () => {
                  const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: 'https://lvslotpro.com' } })
                  if (error) alert(error.message)
                  else alert('Check your email')
                }} 
                className="w-full bg-gray-700 py-4 rounded-2xl font-bold text-lg mb-4"
              >
                Sign Up
              </button>
              <button onClick={() => setShowForgotPassword(true)} className="text-orange-400 text-sm underline block text-center">Forgot Password?</button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-3xl w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">Your email is not on the approved list.<br />Please contact the owner for access.</p>
          <button onClick={handleSignOut} className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-2xl font-bold">Sign Out</button>
        </div>
      </div>
    )
  }

  // Main view after successful login
  return (
    <div className="min-h-screen bg-gray-950">
      {currentView === 'dashboard' ? (
        <div className="max-w-lg mx-auto px-4 pt-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black text-orange-400">Slot Pro Tools</h1>
            <button onClick={handleSignOut} className="text-gray-400 hover:text-red-400">Log Out</button>
          </div>

          <button 
            onClick={() => setCurrentView('phoenix')} 
            className="w-full bg-gray-900 hover:bg-gray-800 border border-orange-500/30 rounded-3xl p-6 text-left transition-all active:scale-[0.985]"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-4xl">🔥</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">Phoenix Link EV Calc</h2>
                <p className="text-gray-400 mt-1">Must-hit counter bonus • Real-time EV</p>
              </div>
            </div>
          </button>
        </div>
      ) : (
        <PhoenixLink onBack={() => setCurrentView('dashboard')} />
      )}
    </div>
  )
}

export default App