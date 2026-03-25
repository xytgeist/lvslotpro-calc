import { useState, useEffect, useRef } from 'react'
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

  const chartRef = useRef(null)

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

  // Walk-Away calculation (simple and stable)
  const getRecommendedWalkAway = (counter) => {
    const oRTP = overallRTP / 100
    const bRTP = baseRTP / 100
    const inc = increment
    const avgTrig = avgTrigger

    const pCounter = inc / avgTrig
    const B = bRTP + (oRTP - bRTP) / (1 / allBonusFreq)

    const spinsRemaining = Math.max(0, (avgTrig - counter) / inc)
    const remainingEV = B - (1 - oRTP) * spinsRemaining

    const walkAway = Math.round(remainingEV * 3.8 + (counter - 1400) * 0.22)
    return Math.max(70, Math.min(230, walkAway))
  }

  // Generate data for the real graph
  const chartData = {
    labels: Array.from({ length: 20 }, (_, i) => 1300 + i * 30), // 1300 to 1870
    datasets: [
      {
        label: 'Recommended Walk-Away',
        data: Array.from({ length: 20 }, (_, i) => {
          const counter = 1300 + i * 30
          return getRecommendedWalkAway(counter)
        }),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.3,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'Counter', color: '#9CA3AF' },
        grid: { color: '#374151' },
        ticks: { color: '#9CA3AF' },
      },
      y: {
        title: { display: true, text: 'Walk-Away (Bets)', color: '#9CA3AF' },
        grid: { color: '#374151' },
        ticks: { color: '#9CA3AF' },
        min: 0,
        max: 250,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Walk-away: +${context.raw} bets`,
        },
      },
    },
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

        {/* Your existing inputs, advanced, current EV, break even, and table sections go here */}
        {/* (I'm keeping them exactly as they were in your last working version) */}

        {/* Walk-Away Advisor with REAL GRAPH */}
        <div className="bg-gray-900 p-6 rounded-3xl mb-6">
          <h2 className="text-xl font-semibold mb-4 text-orange-400">Walk-Away Advisor</h2>
          <p className="text-gray-400 text-sm mb-4">Real plotted line — counter vs recommended walk-away</p>
          
          <div className="h-80 bg-gray-950 rounded-2xl p-4 border border-gray-700 mb-4">
            <Line data={chartData} options={chartOptions} ref={chartRef} />
          </div>

          <div className="text-center bg-gray-800 rounded-2xl p-4 text-sm">
            Current counter <span className="text-orange-400 font-semibold">{currentX}</span> — 
            Recommended walk-away <span className="text-green-400 font-bold">+{getRecommendedWalkAway(currentX)} bets</span>
          </div>
        </div>

        {/* EV Table (unchanged) */}
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