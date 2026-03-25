import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Main inputs
  const [currentX, setCurrentX] = useState(1400)
  const [betSize, setBetSize] = useState(25)
  const [denom, setDenom] = useState(1.00)

  // Advanced settings
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

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

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

    const spinsToAvg = Math.max(0, (avgTrig - X) / inc)
    const spinsToFull = Math.max(0, (must - X) / inc)

    const he = 1 - oRTP

    const avgEV = B - he * spinsToAvg
    const fullEV = B - he * spinsToFull

    const breakevenAvg = Math.round(avgTrig - (B / he) * inc)
    const breakevenFull = Math.round(must - (B / he) * inc)

    setEvAvg(avgEV)
    setEvFullRun(fullEV)
    setBeAvg(breakevenAvg)
    setBeFullRun(breakevenFull)

    const table = []
    for (let c = 1150; c <= 1875; c += 25) {
      const sAvg = Math.max(0, (avgTrig - c) / inc)
      const sFull = Math.max(0, (must - c) / inc)

      table.push({
        counter: c,
        avgEV: B - he * sAvg,
        fullEV: B - he * sFull,
        avgDollar: (B - he * sAvg) * bet,
        fullDollar: (B - he * sFull) * bet
      })
    }
    setEvTable(table)
  }

  useEffect(() => {
    calculate()
  }, [overallRTP, baseRTP, increment, allBonusFreq, avgTrigger, mustHit, currentX, betSize, denom, maxMajor])

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
        {/* Logo + Title */}
        <div className="flex items-center mb-6">
          <img 
            src="/phoenix-link-logo.png" 
            alt="Phoenix Link" 
            className="w-12 h-12 flex-shrink-0 rounded-xl object-contain mr-3"
          />
          <h1 
            className="flex-1 text-[29px] font-black tracking-[-1.6px] text-black"
            style={{
              textShadow: `
                -1.6px -1.6px 0 #f97316,
                 1.6px -1.6px 0 #f97316,
                -1.6px  1.6px 0 #f97316,
                 1.6px  1.6px 0 #f97316
              `
            }}
          >
            PHOENIX LINK EV CALC
          </h1>
        </div>

        {/* Current EV */}
        <div className="bg-gray-900 p-6 rounded-3xl mb-6">
          <h2 className="text-xl font-semibold mb-4 text-orange-400">Current EV</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-2xl">
              <div className="text-gray-400 text-sm">Average Case</div>
              <div className={`text-3xl font-bold ${evAvg >= 0 ? 'text-green-400' : 'text-red-400'}`}>{evAvg.toFixed(1)}×</div>
              <div className="text-sm">${(evAvg * betSize).toFixed(2)}</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-2xl">
              <div className="text-gray-400 text-sm">Full Run (to 1888)</div>
              <div className={`text-3xl font-bold ${evFullRun >= 0 ? 'text-green-400' : 'text-red-400'}`}>{evFullRun.toFixed(1)}×</div>
              <div className="text-sm">${(evFullRun * betSize).toFixed(2)}</div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl text-center text-base font-bold mb-8 ${currentX >= beAvg ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
            {currentX >= beAvg ? '✅ PLAY — +EV Expected' : '❌ Still -EV — keep waiting'}
          </div>

          <h2 className="text-xl font-semibold mb-5 text-orange-400">Break Even Points</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-400 text-sm">Average</div>
              <div className="text-4xl font-bold text-green-400">{beAvg}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Full Run (to 1888)</div>
              <div className="text-4xl font-bold text-yellow-400">{beFullRun}</div>
            </div>
          </div>
        </div>

        {/* ==================== NEW WALK-AWAY ADVISOR ==================== */}
        <div className="bg-gray-900 p-6 rounded-3xl mb-6">
          <h2 className="text-xl font-semibold mb-4 text-orange-400">Walk-Away Advisor</h2>
          <p className="text-gray-400 text-sm mb-4">Recommended profit level to consider locking in gains (based on current counter)</p>
          
          <div className="relative h-64 bg-gray-950 rounded-2xl overflow-hidden border border-gray-700 mb-4">
            <svg viewBox="0 0 400 240" className="w-full h-full">
              {/* Background grid */}
              <line x1="40" y1="20" x2="40" y2="220" stroke="#374151" strokeWidth="1"/>
              <line x1="40" y1="220" x2="380" y2="220" stroke="#374151" strokeWidth="1"/>
              
              {/* Y-axis labels */}
              <text x="25" y="30" fontSize="10" fill="#9CA3AF" textAnchor="end">300</text>
              <text x="25" y="90" fontSize="10" fill="#9CA3AF" textAnchor="end">200</text>
              <text x="25" y="150" fontSize="10" fill="#9CA3AF" textAnchor="end">100</text>
              <text x="25" y="210" fontSize="10" fill="#9CA3AF" textAnchor="end">0</text>

              {/* X-axis labels */}
              <text x="45" y="235" fontSize="10" fill="#9CA3AF">1300</text>
              <text x="150" y="235" fontSize="10" fill="#9CA3AF">1500</text>
              <text x="255" y="235" fontSize="10" fill="#9CA3AF">1700</text>
              <text x="360" y="235" fontSize="10" fill="#9CA3AF">1888</text>

              {/* Walk-away curve */}
              <polyline 
                points="45,195 80,185 120,165 160,145 200,125 240,110 280,95 320,75 360,55"
                fill="none" 
                stroke="#f97316" 
                strokeWidth="4" 
                strokeLinejoin="round"
              />

              {/* Current counter indicator */}
              <line 
                x1={40 + ((currentX - 1300) / 588) * 340} 
                y1="20" 
                x2={40 + ((currentX - 1300) / 588) * 340} 
                y2="220" 
                stroke="#22c55e" 
                strokeWidth="2" 
                strokeDasharray="4 2"
              />
              <circle 
                cx={40 + ((currentX - 1300) / 588) * 340} 
                cy={220 - ((currentX - 1300) / 588) * 140} 
                r="5" 
                fill="#22c55e"
              />

              {/* Label */}
              <text x="200" y="35" fontSize="12" fill="#f97316" textAnchor="middle" fontWeight="bold">
                WALK AWAY HERE
              </text>
            </svg>
          </div>

          <div className="text-center text-sm text-gray-400">
            At counter <span className="text-orange-400 font-semibold">{currentX}</span>, consider walking away around 
            <span className="text-green-400 font-bold"> +{Math.round(300 * (1888 - currentX) / 588 + 60)} bets</span>
          </div>
        </div>

        {/* Advanced Settings & EV Table remain the same as your previous version */}
        {/* ... (keep your existing advanced dropdown and EV table here) ... */}

      </div>
    </div>
  )
}

export default App