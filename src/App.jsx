import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAllowed, setIsAllowed] = useState(false)

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

  const [testCounter, setTestCounter] = useState(1400)
  const [hoverCounter, setHoverCounter] = useState(null)
  const [hoverWalkAway, setHoverWalkAway] = useState(null)
  const [showInfoModal, setShowInfoModal] = useState(false)

  // Acquisition Fee Calculator
  const [useFullRunForFee, setUseFullRunForFee] = useState(false)
  const [scoutPercentage, setScoutPercentage] = useState(10)

  // ====================== SOFTER S-CURVE WALK-AWAY ======================
  const getRecommendedWalkAway = (counter) => {
    const oRTP = overallRTP / 100
    const bRTP = baseRTP / 100
    const inc = increment
    const avgTrig = avgTrigger
    const pCounter = inc / avgTrig
    const B = bRTP + (oRTP - bRTP) / (1 / allBonusFreq)
    const spinsRemaining = Math.max(0, (avgTrig - counter) / inc)
    const remainingEV = B - (1 - oRTP) * spinsRemaining
    const normalized = Math.max(0, Math.min(1, (counter - 1300) / 588))
    const sCurve = 1 / (1 + Math.exp(-5.5 * (normalized - 0.48)))
    const curveBonus = sCurve * 98
    let walkAway = Math.round(remainingEV * 3.5 + curveBonus)
    return Math.max(75, Math.min(245, walkAway))
  }
  // =====================================================================

  const chartData = {
    labels: Array.from({ length: 21 }, (_, i) => 1300 + i * 28),
    datasets: [{
      label: 'Recommended Walk-Away',
      data: Array.from({ length: 21 }, (_, i) => getRecommendedWalkAway(1300 + i * 28)),
      borderColor: '#f97316',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      tension: 0.45,
      borderWidth: 3.5,
      pointRadius: 3,
      pointHoverRadius: 7,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    onHover: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index
        setHoverCounter(chartData.labels[index])
        setHoverWalkAway(chartData.datasets[0].data[index])
      } else {
        setHoverCounter(null)
        setHoverWalkAway(null)
      }
    },
    scales: {
      x: { title: { display: true, text: 'Counter', color: '#9CA3AF' }, grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } },
      y: { title: { display: true, text: 'Walk-Away (Bets)', color: '#9CA3AF' }, grid: { color: '#374151' }, ticks: { color: '#9CA3AF' }, min: 0, max: 260 }
    },
    plugins: { legend: { display: false }, tooltip: { enabled: false } }
  }

  // Auto RTP adjustment
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

  // Auth + Whitelist check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user?.email) checkEmailAllowed(session.user.email)
    })
    const { data: listener } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null)
      if (session?.user?.email) checkEmailAllowed(session.user.email)
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

    if (error) {
      console.error('Whitelist query error:', error)
      if (error.code === '406') {
        console.error('→ RLS is still enabled on allowed_emails table. Disable it in Supabase!')
      }
    }

    setIsAllowed(!!data && !error)
  }

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

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: 'https://lvslotpro.com' }
    })
    if (error) {
      if (error.message.toLowerCase().includes('rate limit') || error.message.includes('429')) {
        alert('Email rate limit exceeded.\n\nCustom SMTP should fix this.')
      } else {
        alert(error.message)
      }
    } else {
      alert('Account created!\n\nPlease check your email (including spam) and click the confirmation link.')
    }
  }

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
  }

  // Login Screen
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

  // Access Denied Screen
  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-3xl w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">
            Your email is not on the approved list.<br />
            Please contact the owner for access.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-2xl font-bold"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  // Main Calculator
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

        {/* Inputs */}
        <div className="bg-gray-900 p-3 rounded-3xl mb-4 space-y-3">
          <div>
            <label className="block text-gray-400 mb-1 text-xs">Counter</label>
            <input
              type="text" inputMode="numeric" value={currentX}
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
              <input type="number" step="0.01" value={betSize}
                onChange={(e) => setBetSize(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full pl-8 p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 text-xs">Denomination</label>
              <select value={denom} onChange={(e) => setDenom(parseFloat(e.target.value))}
                className="w-full p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center">
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

        {/* Advanced Settings */}
        <div className="bg-gray-900 rounded-3xl mb-6 overflow-hidden">
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800 transition-colors">
            <span className="text-base font-semibold">Advanced Settings</span>
            <span className={`text-xl transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showAdvanced && (
            <div className="p-4 pt-0 space-y-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm">Max Major</span>
                <button onClick={() => setMaxMajor(!maxMajor)} className={`px-6 py-2 rounded-xl font-semibold text-sm ${maxMajor ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                  {maxMajor ? 'YES' : 'NO'}
                </button>
              </div>
              <div><label className="block text-gray-400 mb-1 text-xs">Overall RTP (%)</label>
                <input type="number" step="0.01" value={overallRTP} onChange={(e) => setOverallRTP(parseFloat(e.target.value) || 91)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div><label className="block text-gray-400 mb-1 text-xs">Base RTP (%)</label>
                <input type="number" step="0.01" value={baseRTP} onChange={(e) => setBaseRTP(parseFloat(e.target.value) || 28)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div><label className="block text-gray-400 mb-1 text-xs">Balls per Spin</label>
                <input type="number" step="0.01" value={increment} onChange={(e) => setIncrement(parseFloat(e.target.value) || 1.1)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div><label className="block text-gray-400 mb-1 text-xs">Avg Spins to Bonus</label>
                <input type="number" value={allBonusFreq} onChange={(e) => setAllBonusFreq(parseFloat(e.target.value) || 80)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div><label className="block text-gray-400 mb-1 text-xs">Avg Counter Trigger</label>
                <input type="number" value={avgTrigger} onChange={(e) => setAvgTrigger(parseFloat(e.target.value) || 1800)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div><label className="block text-gray-400 mb-1 text-xs">Must Hit By</label>
                <input type="number" value={mustHit} onChange={(e) => setMustHit(parseFloat(e.target.value) || 1888)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
            </div>
          )}
        </div>

        {/* Current EV + Break Even */}
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
            <div><div className="text-gray-400 text-sm">Average</div><div className="text-4xl font-bold text-green-400">{beAvg}</div></div>
            <div><div className="text-gray-400 text-sm">Full Run (to 1888)</div><div className="text-4xl font-bold text-yellow-400">{beFullRun}</div></div>
          </div>
        </div>

        {/* Acquisition Fee Calculator */}
        <div className="bg-gray-900 p-6 rounded-3xl mb-6">
          <h2 className="text-xl font-semibold mb-4 text-orange-400">Acquisition Fee Calculator</h2>
          <p className="text-gray-400 text-sm mb-5">Fair finder's fee for scout</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-400 mb-1 text-xs">EV Basis</label>
              <div className="flex bg-gray-800 rounded-2xl p-1">
                <button
                  onClick={() => setUseFullRunForFee(false)}
                  className={`flex-1 py-3 text-sm font-semibold rounded-[14px] ${!useFullRunForFee ? 'bg-orange-600 text-white' : 'text-gray-400'}`}
                >
                  Average
                </button>
                <button
                  onClick={() => setUseFullRunForFee(true)}
                  className={`flex-1 py-3 text-sm font-semibold rounded-[14px] ${useFullRunForFee ? 'bg-orange-600 text-white' : 'text-gray-400'}`}
                >
                  Full Run
                </button>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-400 text-xs">Scout Share</label>
                <span className="font-bold text-orange-400 text-lg">{scoutPercentage}%</span>
              </div>
              <div className="bg-gray-800 rounded-2xl px-4 py-3">
                <input
                  type="range"
                  min="10"
                  max="15"
                  step="1"
                  value={scoutPercentage}
                  onChange={(e) => setScoutPercentage(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-5 text-center mb-4">
            <div className="text-gray-400 text-sm mb-1">Expected Profit</div>
            <div className="text-4xl font-bold text-white">
              ${((useFullRunForFee ? evFullRun : evAvg) * betSize).toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">
              {useFullRunForFee ? 'Full Run EV' : 'Average Case EV'}
            </div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-5 text-center">
            <div className="text-gray-400 text-sm mb-1">Recommended Finder's Fee</div>
            <div className="text-5xl font-black text-green-400">
              ${(((useFullRunForFee ? evFullRun : evAvg) * betSize) * (scoutPercentage / 100)).toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 mt-1">to scout</div>
          </div>
        </div>

        {/* Walk-Away Advisor */}
        <div className="bg-gray-900 p-6 rounded-3xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-orange-400">Walk-Away Advisor</h2>
            <button
              onClick={() => setShowInfoModal(true)}
              className="w-8 h-8 flex items-center justify-center text-orange-400 hover:text-orange-300 transition-colors text-xl"
            >
              ℹ️
            </button>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 mb-6 flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-gray-400 mb-1 text-xs">Test Counter</label>
              <input
                type="text"
                inputMode="numeric"
                value={testCounter}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setTestCounter(val === '' ? '' : parseInt(val, 10));
                }}
                className="w-full p-3 bg-gray-700 rounded-2xl text-2xl font-bold text-center border border-orange-400"
              />
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Walk-away</div>
              <div className="text-4xl font-bold text-green-400">+{testCounter ? getRecommendedWalkAway(testCounter) : 0} bets</div>
              <div className="text-sm text-green-400">
                ${((testCounter ? getRecommendedWalkAway(testCounter) : 0) * betSize).toFixed(0)}
              </div>
            </div>
          </div>
          <div className="h-80 bg-gray-950 rounded-2xl p-4 border border-gray-700 mb-4 relative">
            <Line data={chartData} options={chartOptions} />
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 text-center text-sm min-h-[52px] flex items-center justify-center">
            {hoverCounter !== null ? (
              <>
                At <span className="text-orange-400 font-semibold mx-1">{hoverCounter}</span>
                walk away around <span className="text-green-400 font-bold mx-1">+{hoverWalkAway} bets</span>
                <span className="text-green-400">(${ (hoverWalkAway * betSize).toFixed(0) })</span>
              </>
            ) : (
              <>
                At <span className="text-orange-400 font-semibold mx-1">{currentX}</span>
                walk away around <span className="text-green-400 font-bold mx-1">+{getRecommendedWalkAway(currentX)} bets</span>
                <span className="text-green-400">(${ (getRecommendedWalkAway(currentX) * betSize).toFixed(0) })</span>
              </>
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

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-3xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-orange-400 mb-4">Walk-Away Advisor</h3>
            <div className="text-gray-300 text-[15px] leading-relaxed space-y-4">
              <p>This advisor recommends the <strong>optimal stopping threshold</strong> — the profit level (in bets) at which you should consider walking away, even while the machine remains in positive expected value (+EV).</p>
              <p>Phoenix Link has extreme <strong>volatility drag</strong> and <strong>drawdown risk</strong>. Even with strong positive remainingEV, 100–300 bet drawdowns occur frequently.</p>
              <p>The advisor calculates a <strong>risk-adjusted certainty equivalent</strong> by combining remainingEV and a logistic S-curve calibrated through Monte Carlo simulations.</p>
              <p>In short: it converts raw theoretical EV into a practical, utility-aware stopping rule.</p>
            </div>
            <button onClick={() => setShowInfoModal(false)} className="mt-6 w-full bg-orange-600 hover:bg-orange-500 py-4 rounded-2xl font-bold text-lg transition-colors">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App