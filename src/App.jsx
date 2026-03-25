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

  // Tuned walk-away model
  const getRecommendedWalkAway = (counter) => {
    const oRTP = overallRTP / 100
    const bRTP = baseRTP / 100
    const inc = increment
    const avgTrig = avgTrigger

    const pCounter = inc / avgTrig
    const B = bRTP + (oRTP - bRTP) / (1 / allBonusFreq)

    const spinsRemaining = Math.max(0, (avgTrig - counter) / inc)
    const remainingEV = B - (1 - oRTP) * spinsRemaining

    const EV_MULTIPLIER = 2.2     // Lower = less aggressive
    const COUNTER_BONUS = 0.15

    let walkAway = Math.round(remainingEV * EV_MULTIPLIER + (counter - 1300) * COUNTER_BONUS)

    return Math.max(60, Math.min(230, walkAway))
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

        {/* Logo + Title */}
        <div className="flex items-center mb-6">
          <img src="/phoenix-link-logo.png" alt="Phoenix Link" className="w-12 h-12 flex-shrink-0 rounded-xl object-contain mr-3" />
          <h1 className="flex-1 text-[29px] font-black tracking-[-1.6px] text-black"
              style={{ textShadow: `-1.6px -1.6px 0 #f97316, 1.6px -1.6px 0 #f97316, -1.6px 1.6px 0 #f97316, 1.6px 1.6px 0 #f97316` }}>
            PHOENIX LINK EV CALC
          </h1>
        </div>

        {/* Compact Top Input Frame */}
        <div className="bg-gray-900 p-3 rounded-3xl mb-4 space-y-3">
          <div>
            <label className="block text-gray-400 mb-1 text-xs">Counter</label>
            <input 
              type="text"
              inputMode="numeric"
              value={currentX} 
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setCurrentX(val === '' ? '' : parseInt(val, 10));
              }} 
              className="w-full p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center border-2 border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="block text-gray-400 mb-1 text-xs">Bet Size</label>
              <div className="absolute left-4 top-9 text-2xl font-bold text-gray-400 pointer-events-none">$</div>
              <input 
                type="number" 
                step="0.01" 
                value={betSize} 
                onChange={(e) => setBetSize(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                className="w-full pl-8 p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 text-xs">Denomination</label>
              <select 
                value={denom} 
                onChange={(e) => setDenom(parseFloat(e.target.value))}
                className="w-full p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center"
              >
                <option value={0.01}>$0.01</option>
                <option value={0.02}>$0.02</option>
                <option value={0.05}>$0.05</option>
                <option value={0.10}>$0.10</option>
                <option value={0.25}>$0.25</option>
                <option value={1}>$1</option>
                <option value={2}>$2</option>
                <option value={5}>$5</option>
                <option value={10}>$10</option>
                <option value={25}>$25</option>
                <option value={50}>$50</option>
                <option value={100}>$100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Settings Dropdown */}
        <div className="bg-gray-900 rounded-3xl mb-6 overflow-hidden">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800 transition-colors"
          >
            <span className="text-base font-semibold">Advanced Settings</span>
            <span className={`text-xl transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showAdvanced && (
            <div className="p-4 pt-0 space-y-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm">Max Major</span>
                <button
                  onClick={() => setMaxMajor(!maxMajor)}
                  className={`px-6 py-2 rounded-xl font-semibold text-sm ${maxMajor ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                  {maxMajor ? 'YES' : 'NO'}
                </button>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 text-xs">Overall RTP (%)</label>
                <input type="number" step="0.01" value={overallRTP} onChange={(e) => setOverallRTP(parseFloat(e.target.value) || 91)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-xs">Base RTP (%)</label>
                <input type="number" step="0.01" value={baseRTP} onChange={(e) => setBaseRTP(parseFloat(e.target.value) || 28)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-xs">Balls per Spin</label>
                <input type="number" step="0.01" value={increment} onChange={(e) => setIncrement(parseFloat(e.target.value) || 1.1)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-xs">Avg Spins to Bonus</label>
                <input type="number" value={allBonusFreq} onChange={(e) => setAllBonusFreq(parseFloat(e.target.value) || 80)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-xs">Avg Counter Trigger</label>
                <input type="number" value={avgTrigger} onChange={(e) => setAvgTrigger(parseFloat(e.target.value) || 1800)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-xs">Must Hit By</label>
                <input type="number" value={mustHit} onChange={(e) => setMustHit(parseFloat(e.target.value) || 1888)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
            </div>
          )}
        </div>

        {/* Current EV Results */}
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

        {/* Walk-Away Advisor */}
        <div className="bg-gray-900 p-6 rounded-3xl mb-6">
          <h2 className="text-xl font-semibold mb-4 text-orange-400">Walk-Away Advisor</h2>
          <p className="text-gray-400 text-sm mb-4">Certainty-equivalent optimal stopping</p>
          
          <div className="relative h-64 bg-gray-950 rounded-2xl overflow-hidden border border-gray-700 mb-4">
            <svg 
              viewBox="0 0 400 240" 
              className="w-full h-full cursor-crosshair"
              onMouseMove={handleGraphHover}
              onTouchMove={handleGraphHover}
              onMouseLeave={() => setHoverCounter(null)}
              onTouchEnd={() => setHoverCounter(null)}
            >
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

              <polyline 
                points="45,205 80,190 120,170 160,150 200,130 240,115 280,102 320,92 360,85"
                fill="none" 
                stroke="#f97316" 
                strokeWidth="4" 
                strokeLinejoin="round"
              />

              <line 
                x1={40 + Math.min(340, Math.max(0, ((currentX - 1300) / 588) * 340))} 
                y1="20" 
                x2={40 + Math.min(340, Math.max(0, ((currentX - 1300) / 588) * 340))} 
                y2="220" 
                stroke="#22c55e" 
                strokeWidth="2" 
                strokeDasharray="5 3"
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
              <>At counter <span className="text-yellow-400 font-semibold">{hoverCounter}</span>, walk away around <span className="text-green-400 font-bold">+{hoverProfit} bets</span></>
            ) : (
              <>At counter <span className="text-orange-400 font-semibold">{currentX}</span>, consider walking away around <span className="text-green-400 font-bold">+{getRecommendedWalkAway(currentX)} bets</span></>
            )}
          </div>
        </div>

        {/* EV Table */}
        <div className="bg-gray-900 p-6 rounded-3xl">
          <h2 className="text-xl font-semibold mb-5 text-orange-400">EV Table — 1150 to 1875 (+25)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[540px]">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-4 px-4 text-gray-400 font-medium w-[92px]">Counter</th>
                  <th className="py-4 px-3 text-gray-400 font-medium w-[155px]">EV Avg (Bets | $)</th>
                  <th className="py-4 px-5 text-gray-400 font-medium">Full Run (to 1888) (Bets | $)</th>
                </tr>
              </thead>
              <tbody>
                {evTable.map((row, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="py-4 px-4 font-semibold">{row.counter}</td>
                    <td className={`py-4 px-3 font-bold ${row.avgEV >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {row.avgEV.toFixed(1)} | ${row.avgDollar.toFixed(0)}
                    </td>
                    <td className={`py-4 px-5 font-bold ${row.fullEV >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {row.fullEV.toFixed(1)} | ${row.fullDollar.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App