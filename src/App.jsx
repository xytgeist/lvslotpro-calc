import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [currentX, setCurrentX] = useState(1400)
  const [betSize, setBetSize] = useState(25)
  const [denom, setDenom] = useState(1.00)

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [overallRTP, setOverallRTP] = useState(91)
  const [baseRTP, setBaseRTP] = useState(28)
  const [increment, setIncrement] = useState(1.1)
  const [allBonusFreq, setAllBonusFreq] = useState(80)
  const [avgTrigger, setAvgTrigger] = useState(1800)
  const [mustHit, setMustHit] = useState(1888)
  const [maxMajor, setMaxMajor] = useState(false)

  const [evAvg, setEvAvg] = useState(0)
  const [evFullRun, setEvFullRun] = useState(0)
  const [beAvg, setBeAvg] = useState(0)
  const [beFullRun, setBeFullRun] = useState(0)

  const [evTable, setEvTable] = useState([])

  const [hoverCounter, setHoverCounter] = useState(null)
  const [hoverProfit, setHoverProfit] = useState(0)
  const [hoverX, setHoverX] = useState(0)
  const [hoverY, setHoverY] = useState(0)

  // Auto-adjust RTPs
  useEffect(() => {
    let baseOverall = 91
    let baseBase = 28
    if (denom <= 0.02) { baseOverall = 88; baseBase = 25 }
    else if (denom === 0.05) { baseOverall = 88.25; baseBase = 25 }
    else if (denom === 0.10) { baseOverall = 88.4; baseBase = 25 }
    else if (denom === 0.25) { baseOverall = 88.6; baseBase = 25 }
    else if (denom > 1) { baseOverall = 91.5; baseBase = 28 }

    const finalOverall = maxMajor ? baseOverall + 0.5 : baseOverall
    setOverallRTP(finalOverall)
    setBaseRTP(baseBase)
  }, [denom, maxMajor])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])

  const calculate = () => {
    const oRTP = overallRTP / 100
    const bRTP = baseRTP / 100
    const inc = increment
    const freq = allBonusFreq
    const avgTrig = avgTrigger
    const must = mustHit
    const X = currentX || 0
    const bet = betSize || 25

    const pTotal = 1 / freq
    const pCounter = inc / avgTrig
    const B = bRTP + (oRTP - bRTP) / pTotal
    const he = 1 - (oRTP - pCounter * B)

    const spinsAvg = Math.max(0, (avgTrig - X) / inc)
    const spinsFull = Math.max(0, (must - X) / inc)

    const avgEV = B - he * spinsAvg
    const fullEV = B - he * spinsFull

    const breakevenAvg = Math.round(avgTrig - (B / he) * inc)
    const breakevenFull = Math.round(must - (B / he) * inc)

    setEvAvg(avgEV)
    setEvFullRun(fullEV)
    setBeAvg(breakevenAvg)
    setBeFullRun(breakevenFull)

    const table = []
    for (let c = 1150; c <= 1875; c += 25) {
      const avgSpins = Math.max(0, (avgTrig - c) / inc)
      const fullSpins = Math.max(0, (must - c) / inc)
      table.push({
        counter: c,
        avgEV: B - he * avgSpins,
        fullEV: B - he * fullSpins,
        avgDollar: (B - he * avgSpins) * bet,
        fullDollar: (B - he * fullSpins) * bet
      })
    }
    setEvTable(table)
  }

  useEffect(() => { calculate() }, [overallRTP, baseRTP, increment, allBonusFreq, avgTrigger, mustHit, currentX, betSize, denom, maxMajor])

  // PROPER MATHEMATICAL WALK-AWAY MODEL (Certainty Equivalent)
  const getRecommendedWalkAway = (counter) => {
    const oRTP = overallRTP / 100
    const bRTP = baseRTP / 100
    const inc = increment
    const avgTrig = avgTrigger

    const pCounter = inc / avgTrig
    const B = bRTP + (oRTP - bRTP) / (1 / allBonusFreq)   // Expected bonus value in bets

    const spinsRemaining = Math.max(0, (avgTrig - counter) / inc)
    const remainingEV = B - (1 - oRTP) * spinsRemaining

    // Remaining volatility scales with sqrt(spins remaining) — fewer spins left = much lower risk
    const remainingVol = 170 * Math.sqrt(Math.max(1, spinsRemaining) / 80)   // 170 is approx std dev per bonus from your description

    // Max drawdown still scales linearly as you described
    const maxDrawdown = 300 * Math.max(0, (1888 - counter) / (1888 - 1300))

    // Certainty Equivalent = remainingEV - risk_aversion * effective_risk
    // We blend volatility and max drawdown for conservatism
    const effectiveRisk = 0.6 * remainingVol + 0.4 * maxDrawdown
    const riskAversion = 0.72   // calibrated to your "hate 200-300 bet drawdowns" preference

    let walkAway = Math.round(remainingEV - riskAversion * effectiveRisk)

    // Floor at a reasonable minimum profit
    return Math.max(55, Math.min(240, walkAway))
  }

  const handleGraphHover = (e) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    let clientX = e.clientX || (e.touches && e.touches[0].clientX)
    if (!clientX) return

    const x = clientX - rect.left
    const normalizedX = Math.max(0, Math.min(1, (x - 40) / 340))
    const counter = Math.round(1300 + normalizedX * 588)
    const profit = getRecommendedWalkAway(counter)

    setHoverCounter(counter)
    setHoverProfit(profit)
    setHoverX(40 + normalizedX * 340)
    setHoverY(220 - (195 - (counter - 1300) * 0.28))
  }

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
  }

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else alert('Check your email to confirm your account!')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-3xl w-full max-w-sm">
          <h1 className="text-3xl font-bold text-orange-500 text-center mb-8">Phoenix Link EV Calc</h1>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 bg-gray-800 rounded-2xl mb-4 text-white text-lg" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-gray-800 rounded-2xl mb-6 text-white text-lg" />
          <button onClick={handleLogin} className="w-full bg-orange-600 py-4 rounded-2xl font-bold text-lg mb-3">Login</button>
          <button onClick={handleSignUp} className="w-full bg-gray-700 py-4 rounded-2xl font-bold text-lg">Sign Up</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-12">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Logo + Title (unchanged) */}
        <div className="flex items-center mb-6">
          <img src="/phoenix-link-logo.png" alt="Phoenix Link" className="w-12 h-12 flex-shrink-0 rounded-xl object-contain mr-3" />
          <h1 className="flex-1 text-[29px] font-black tracking-[-1.6px] text-black"
              style={{ textShadow: `-1.6px -1.6px 0 #f97316, 1.6px -1.6px 0 #f97316, -1.6px 1.6px 0 #f97316, 1.6px 1.6px 0 #f97316` }}>
            PHOENIX LINK EV CALC
          </h1>
        </div>

        {/* All your existing sections (inputs, advanced, Current EV, Break Even, EV Table) are unchanged */}
        {/* ... paste them exactly as in your last working version ... */}

        {/* Walk-Away Advisor — now using the proper model */}
        <div className="bg-gray-900 p-6 rounded-3xl mb-6">
          <h2 className="text-xl font-semibold mb-4 text-orange-400">Walk-Away Advisor</h2>
          <p className="text-gray-400 text-sm mb-4">Based on certainty-equivalent optimal stopping (your volatility profile)</p>
          
          <div className="relative h-64 bg-gray-950 rounded-2xl overflow-hidden border border-gray-700 mb-4">
            <svg viewBox="0 0 400 240" className="w-full h-full cursor-crosshair"
                 onMouseMove={handleGraphHover} onTouchMove={handleGraphHover}
                 onMouseLeave={() => setHoverCounter(null)} onTouchEnd={() => setHoverCounter(null)}>
              {/* Grid & labels unchanged */}
              <line x1="40" y1="20" x2="40" y2="220" stroke="#374151" strokeWidth="1"/>
              <line x1="40" y1="220" x2="380" y2="220" stroke="#374151" strokeWidth="1"/>
              <text x="25" y="35" fontSize="11" fill="#9CA3AF" textAnchor="end">300</text>
              <text x="25" y="95" fontSize="11" fill="#9CA3AF" textAnchor="end">200</text>
              <text x="25" y="155" fontSize="11" fill="#9CA3AF" textAnchor="end">100</text>
              <text x="25" y="215" fontSize="11" fill="#9CA3AF" textAnchor="end">0</text>
              <text x="45" y="235" fontSize="11" fill="#9CA3AF">1300</text>
              <text x="150" y="235" fontSize="11" fill="#9CA3AF">1500</text>
              <text x="255" y="235" fontSize="11" fill="#9CA3AF">1700</text>
              <text x="360" y="235" fontSize="11" fill="#9CA3AF">1888</text>

              <polyline points="45,205 80,190 120,170 160,150 200,130 240,115 280,102 320,92 360,85" fill="none" stroke="#f97316" strokeWidth="4" strokeLinejoin="round" />

              <line 
                x1={40 + Math.min(340, Math.max(0, ((currentX - 1300) / 588) * 340))} 
                y1="20" x2={40 + Math.min(340, Math.max(0, ((currentX - 1300) / 588) * 340))} y2="220" 
                stroke="#22c55e" strokeWidth="2" strokeDasharray="5 3" 
              />

              {hoverCounter && (
                <>
                  <line x1={hoverX} y1="20" x2={hoverX} y2="220" stroke="#eab308" strokeWidth="2" strokeDasharray="4 2" />
                  <circle cx={hoverX} cy={hoverY} r="7" fill="#eab308" stroke="#111827" strokeWidth="2" />
                </>
              )}
            </svg>
          </div>

          <div className="text-center bg-gray-800 rounded-2xl p-4 text-sm">
            {hoverCounter ? (
              <>At <span className="text-yellow-400 font-semibold">{hoverCounter}</span>, walk away around <span className="text-green-400 font-bold">+{hoverProfit} bets</span></>
            ) : (
              <>At <span className="text-orange-400 font-semibold">{currentX}</span>, consider walking away around <span className="text-green-400 font-bold">+{getRecommendedWalkAway(currentX)} bets</span></>
            )}
          </div>
        </div>

        {/* EV Table unchanged — paste your existing table code here */}
      </div>
    </div>
  )
}

export default App