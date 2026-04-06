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

const PHOENIX_MUST_HIT = 1888
const BUFFALO_MUST_HIT = 1800

function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAllowed, setIsAllowed] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard', 'phoenix', 'buffalo'

  // Password Reset
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isResetMode, setIsResetMode] = useState(false)

  // ====================== PHOENIX LINK STATES (UNCHANGED) ======================
  const [phoenixCurrentX, setPhoenixCurrentX] = useState(1400)
  const [phoenixBetSize, setPhoenixBetSize] = useState(25)
  const [phoenixDenom, setPhoenixDenom] = useState(1.00)
  const [phoenixShowAdvanced, setPhoenixShowAdvanced] = useState(false)
  const [phoenixOverallRTP, setPhoenixOverallRTP] = useState(91)
  const [phoenixAvgBonusPay, setPhoenixAvgBonusPay] = useState(31)
  const [phoenixIncrement, setPhoenixIncrement] = useState(1.2)
  const [phoenixAvgTrigger, setPhoenixAvgTrigger] = useState(1795)
  const [phoenixMaxMajor, setPhoenixMaxMajor] = useState(false)

  const [phoenixEvAvg, setPhoenixEvAvg] = useState(0)
  const [phoenixEvFullRun, setPhoenixEvFullRun] = useState(0)
  const [phoenixMaxExposureAvg, setPhoenixMaxExposureAvg] = useState(0)
  const [phoenixMaxExposureFull, setPhoenixMaxExposureFull] = useState(0)
  const [phoenixBeAvg, setPhoenixBeAvg] = useState(0)
  const [phoenixBeFullRun, setPhoenixBeFullRun] = useState(0)
  const [phoenixEvTable, setPhoenixEvTable] = useState([])

  const [phoenixFpDollarsNeeded, setPhoenixFpDollarsNeeded] = useState(0)
  const [phoenixIsAlreadyPositive, setPhoenixIsAlreadyPositive] = useState(false)
  const [phoenixCurrentRTP, setPhoenixCurrentRTP] = useState(0)

  const [phoenixTestCounter, setPhoenixTestCounter] = useState(1400)
  const [phoenixHoverCounter, setPhoenixHoverCounter] = useState(null)
  const [phoenixHoverWalkAway, setPhoenixHoverWalkAway] = useState(null)
  const [phoenixShowInfoModal, setPhoenixShowInfoModal] = useState(false)

  const [phoenixUseFullRunForFee, setPhoenixUseFullRunForFee] = useState(false)
  const [phoenixScoutPercentage, setPhoenixScoutPercentage] = useState(10)

  // ====================== BUFFALO LINK STATES ======================
  const [buffaloCurrentX, setBuffaloCurrentX] = useState(1400)
  const [buffaloBetSize, setBuffaloBetSize] = useState(25)
  const [buffaloDenom, setBuffaloDenom] = useState(1.00)
  const [buffaloShowAdvanced, setBuffaloShowAdvanced] = useState(false)
  const [buffaloOverallRTP, setBuffaloOverallRTP] = useState(91)
  const [buffaloAvgBonusPay, setBuffaloAvgBonusPay] = useState(31)
  const [buffaloIncrement, setBuffaloIncrement] = useState(1.7)
  const [buffaloMidpointFactor, setBuffaloMidpointFactor] = useState(0.5)
  const [buffaloMaxMajor, setBuffaloMaxMajor] = useState(false)

  const [buffaloEvAvg, setBuffaloEvAvg] = useState(0)
  const [buffaloEvFullRun, setBuffaloEvFullRun] = useState(0)
  const [buffaloMaxExposureAvg, setBuffaloMaxExposureAvg] = useState(0)
  const [buffaloMaxExposureFull, setBuffaloMaxExposureFull] = useState(0)
  const [buffaloBeAvg, setBuffaloBeAvg] = useState(0)
  const [buffaloBeFullRun, setBuffaloBeFullRun] = useState(0)
  const [buffaloEvTable, setBuffaloEvTable] = useState([])

  const [buffaloFpDollarsNeeded, setBuffaloFpDollarsNeeded] = useState(0)
  const [buffaloIsAlreadyPositive, setBuffaloIsAlreadyPositive] = useState(false)
  const [buffaloCurrentRTP, setBuffaloCurrentRTP] = useState(0)

  const [buffaloTestCounter, setBuffaloTestCounter] = useState(1400)
  const [buffaloHoverCounter, setBuffaloHoverCounter] = useState(null)
  const [buffaloHoverWalkAway, setBuffaloHoverWalkAway] = useState(null)
  const [buffaloShowInfoModal, setBuffaloShowInfoModal] = useState(false)

  const [buffaloUseFullRunForFee, setBuffaloUseFullRunForFee] = useState(false)
  const [buffaloScoutPercentage, setBuffaloScoutPercentage] = useState(10)

  // ====================== PHOENIX CALCULATION (UNCHANGED) ======================
  const calculatePhoenix = () => {
    const oRTP = phoenixOverallRTP / 100
    const inc = phoenixIncrement
    const avgTrig = phoenixAvgTrigger
    const X = phoenixCurrentX || 0
    const bet = phoenixBetSize || 25

    const B = phoenixAvgBonusPay
    const houseEdge = 1 - oRTP

    const spinsAvg = Math.max(0, (avgTrig - X) / inc)
    const spinsFull = Math.max(0, (PHOENIX_MUST_HIT - X) / inc)

    const avgEV = B - houseEdge * spinsAvg
    const fullEV = B - houseEdge * spinsFull

    const baseHouseEdge = 1 - (28 / 100)
    const maxExpAvg = Math.round(spinsAvg * baseHouseEdge)
    const maxExpFull = Math.round(spinsFull * baseHouseEdge)

    const breakevenAvg = Math.round(avgTrig - (B / houseEdge) * inc)
    const breakevenFull = Math.round(PHOENIX_MUST_HIT - (B / houseEdge) * inc)

    setPhoenixEvAvg(avgEV)
    setPhoenixEvFullRun(fullEV)
    setPhoenixMaxExposureAvg(maxExpAvg)
    setPhoenixMaxExposureFull(maxExpFull)
    setPhoenixBeAvg(breakevenAvg)
    setPhoenixBeFullRun(breakevenFull)

    let rtp = oRTP * 100
    if (spinsAvg > 0) rtp = 100 + (avgEV / spinsAvg) * 100
    setPhoenixCurrentRTP(Math.round(rtp * 10) / 10)

    const alreadyPositive = avgEV >= 0
    setPhoenixIsAlreadyPositive(alreadyPositive)

    if (alreadyPositive) {
      setPhoenixFpDollarsNeeded(0)
    } else {
      const spinsNeeded = Math.max(0, breakevenAvg - X)
      setPhoenixFpDollarsNeeded(Math.round(spinsNeeded * bet))
    }

    const table = []
    for (let c = 1150; c <= 1875; c += 25) {
      const avgSpins = Math.max(0, (avgTrig - c) / inc)
      const fullSpins = Math.max(0, (PHOENIX_MUST_HIT - c) / inc)
      table.push({
        counter: c,
        avgEV: B - houseEdge * avgSpins,
        fullEV: B - houseEdge * fullSpins,
        avgDollar: (B - houseEdge * avgSpins) * bet,
        fullDollar: (B - houseEdge * fullSpins) * bet
      })
    }
    setPhoenixEvTable(table)
  }

  // ====================== BUFFALO LINK CALCULATION (with fixed breakeven) ======================
  const calculateBuffalo = () => {
    const oRTP = buffaloOverallRTP / 100
    const inc = buffaloIncrement
    const factor = buffaloMidpointFactor
    const X = buffaloCurrentX || 0
    const bet = buffaloBetSize || 25

    const B = buffaloAvgBonusPay
    const houseEdge = 1 - oRTP

    const midPoint = X + factor * (BUFFALO_MUST_HIT - X)
    const spinsAvg = Math.max(0, (midPoint - X) / inc)
    const spinsFull = Math.max(0, (BUFFALO_MUST_HIT - X) / inc)

    const avgEV = B - houseEdge * spinsAvg
    const fullEV = B - houseEdge * spinsFull

    const baseHouseEdge = 1 - (28 / 100)
    const maxExpAvg = Math.round(spinsAvg * baseHouseEdge)
    const maxExpFull = Math.round(spinsFull * baseHouseEdge)

    // Corrected breakeven for midpoint method
    const breakevenAvg = Math.round(X + (B / houseEdge) * inc / factor)
    const breakevenFull = Math.round(BUFFALO_MUST_HIT - (B / houseEdge) * inc)

    setBuffaloEvAvg(avgEV)
    setBuffaloEvFullRun(fullEV)
    setBuffaloMaxExposureAvg(maxExpAvg)
    setBuffaloMaxExposureFull(maxExpFull)
    setBuffaloBeAvg(breakevenAvg)
    setBuffaloBeFullRun(breakevenFull)

    let rtp = oRTP * 100
    if (spinsAvg > 0) rtp = 100 + (avgEV / spinsAvg) * 100
    setBuffaloCurrentRTP(Math.round(rtp * 10) / 10)

    const alreadyPositive = avgEV >= 0
    setBuffaloIsAlreadyPositive(alreadyPositive)

    if (alreadyPositive) {
      setBuffaloFpDollarsNeeded(0)
    } else {
      const spinsNeeded = Math.max(0, breakevenAvg - X)
      setBuffaloFpDollarsNeeded(Math.round(spinsNeeded * bet))
    }

    const table = []
    for (let c = 1150; c <= 1775; c += 25) {
      const mid = c + factor * (BUFFALO_MUST_HIT - c)
      const avgSpins = Math.max(0, (mid - c) / inc)
      const fullSpins = Math.max(0, (BUFFALO_MUST_HIT - c) / inc)
      table.push({
        counter: c,
        avgEV: B - houseEdge * avgSpins,
        fullEV: B - houseEdge * fullSpins,
        avgDollar: (B - houseEdge * avgSpins) * bet,
        fullDollar: (B - houseEdge * fullSpins) * bet
      })
    }
    setBuffaloEvTable(table)
  }

  useEffect(() => {
    if (currentView === 'phoenix') calculatePhoenix()
    if (currentView === 'buffalo') calculateBuffalo()
  }, [currentView,
      phoenixOverallRTP, phoenixAvgBonusPay, phoenixIncrement, phoenixAvgTrigger, phoenixCurrentX, phoenixBetSize, phoenixDenom, phoenixMaxMajor,
      buffaloOverallRTP, buffaloAvgBonusPay, buffaloIncrement, buffaloMidpointFactor, buffaloCurrentX, buffaloBetSize, buffaloDenom, buffaloMaxMajor])

  // Safe handlers
  const handleFloatChange = (setter, defaultVal) => (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setter(val);
  };

  const handleFloatBlur = (setter, defaultVal) => (e) => {
    let val = e.target.value.trim();
    if (val === '' || isNaN(parseFloat(val))) setter(defaultVal);
    else setter(parseFloat(val));
  };

  const handleIntegerChange = (setter, defaultVal) => (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setter(val);
  };

  const handleIntegerBlur = (setter, defaultVal) => (e) => {
    let val = e.target.value.trim();
    if (val === '' || isNaN(parseInt(val, 10))) setter(defaultVal);
    else setter(parseInt(val, 10));
  };

  const handleSignOut = () => supabase.auth.signOut()

  // ==================== DASHBOARD ====================
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-950 pb-12">
        <div className="max-w-lg mx-auto px-4 pt-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black text-orange-400 tracking-tight">Slot Pro Tools</h1>
            <button onClick={handleSignOut} className="text-gray-400 hover:text-red-400 text-sm">Log Out</button>
          </div>

          <div className="space-y-4">
            <button onClick={() => setCurrentView('phoenix')} className="w-full bg-gray-900 hover:bg-gray-800 border border-orange-500/30 rounded-3xl p-6 text-left transition-all active:scale-[0.985]">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-4xl">🔥</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">Phoenix Link EV Calc</h2>
                  <p className="text-gray-400 mt-1">Must-hit counter bonus • Real-time EV</p>
                </div>
              </div>
            </button>

            <button onClick={() => setCurrentView('buffalo')} className="w-full bg-gray-900 hover:bg-gray-800 border border-yellow-500/30 rounded-3xl p-6 text-left transition-all active:scale-[0.985]">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center text-4xl">🦬</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">Buffalo Link Calculator</h2>
                  <p className="text-gray-400 mt-1">Midpoint logic • Adjustable buffalos per spin</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ==================== PHOENIX LINK CALCULATOR (FULL - UNCHANGED) ====================
  if (currentView === 'phoenix') {
    return (
      <div className="min-h-screen bg-gray-950 pb-12">
        {/* Hamburger Menu */}
        <div className="max-w-lg mx-auto px-4 pt-4 flex justify-between items-center">
          <button onClick={() => setCurrentView('dashboard')} className="text-3xl text-orange-400 hover:text-orange-300 p-2">☰</button>
          <div className="text-sm text-gray-400">Phoenix Link EV Calc</div>
        </div>

        {/* Logo + Title */}
        <div className="max-w-lg mx-auto px-4 pt-2 pb-6">
          <div className="flex items-center">
            <img src="/phoenix-link-logo.png" alt="Phoenix Link" className="w-12 h-12 flex-shrink-0 rounded-xl object-contain mr-3" />
            <h1 className="flex-1 text-[29px] font-black tracking-[-1.6px] text-black"
                style={{ textShadow: `-1.6px -1.6px 0 #f97316, 1.6px -1.6px 0 #f97316, -1.6px 1.6px 0 #f97316, 1.6px 1.6px 0 #f97316` }}>
              PHOENIX LINK EV CALC
            </h1>
          </div>
        </div>

        {/* Inputs */}
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-gray-900 p-3 rounded-3xl mb-4 space-y-3">
            <div>
              <label className="block text-gray-400 mb-1 text-xs">Counter</label>
              <input type="text" inputMode="numeric" value={phoenixCurrentX} onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setPhoenixCurrentX(val === '' ? '' : parseInt(val, 10));
              }} className="w-full p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center border-2 border-orange-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-gray-400 mb-1 text-xs">Bet Size</label>
                <div className="absolute left-4 top-9 text-2xl font-bold text-gray-400 pointer-events-none">$</div>
                <input type="text" value={phoenixBetSize} onChange={handleFloatChange(setPhoenixBetSize, 25)} onBlur={handleFloatBlur(setPhoenixBetSize, 25)} className="w-full pl-8 p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-xs">Denomination</label>
                <select value={phoenixDenom} onChange={(e) => setPhoenixDenom(parseFloat(e.target.value))} className="w-full p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center">
                  {[0.01,0.02,0.05,0.10,0.25,1,2,5,10,25,50,100].map(d => <option key={d} value={d}>${d}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-gray-900 rounded-3xl mb-6 overflow-hidden">
            <button onClick={() => setPhoenixShowAdvanced(!phoenixShowAdvanced)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800 transition-colors">
              <span className="text-base font-semibold">Advanced Settings</span>
              <span className={`text-xl transition-transform ${phoenixShowAdvanced ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {phoenixShowAdvanced && (
              <div className="p-4 pt-0 space-y-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Max Major</span>
                  <button onClick={() => setPhoenixMaxMajor(!phoenixMaxMajor)} className={`px-6 py-2 rounded-xl font-semibold text-sm ${phoenixMaxMajor ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                    {phoenixMaxMajor ? 'YES' : 'NO'}
                  </button>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-xs">Overall RTP (%)</label>
                  <input type="text" value={phoenixOverallRTP} onChange={handleFloatChange(setPhoenixOverallRTP, 91)} onBlur={handleFloatBlur(setPhoenixOverallRTP, 91)} className="w-full p-3 bg-gray-800 rounded-xl" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-xs">Avg Bonus Pay (bets)</label>
                  <input type="text" value={phoenixAvgBonusPay} onChange={handleFloatChange(setPhoenixAvgBonusPay, 31)} onBlur={handleFloatBlur(setPhoenixAvgBonusPay, 31)} className="w-full p-3 bg-gray-800 rounded-xl" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-xs">Balls per Spin</label>
                  <input type="text" value={phoenixIncrement} onChange={handleFloatChange(setPhoenixIncrement, 1.2)} onBlur={handleFloatBlur(setPhoenixIncrement, 1.2)} className="w-full p-3 bg-gray-800 rounded-xl" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-xs">Avg Counter Trigger</label>
                  <input type="text" value={phoenixAvgTrigger} onChange={handleFloatChange(setPhoenixAvgTrigger, 1795)} onBlur={handleFloatBlur(setPhoenixAvgTrigger, 1795)} className="w-full p-3 bg-gray-800 rounded-xl" />
                </div>
              </div>
            )}
          </div>

          {/* Current EV */}
          <div className="bg-gray-900 p-6 rounded-3xl mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-orange-400">Current EV</h2>
              <div className={`text-lg font-bold ${phoenixCurrentRTP >= 100 ? 'text-green-400' : 'text-red-400'}`}>
                {phoenixCurrentRTP.toFixed(1)}% RTP
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded-2xl">
                <div className="text-gray-400 text-sm">Average Case</div>
                <div className={`text-3xl font-bold ${phoenixEvAvg >= 0 ? 'text-green-400' : 'text-red-400'}`}>{phoenixEvAvg.toFixed(1)}×</div>
                <div className="text-sm">${(phoenixEvAvg * phoenixBetSize).toFixed(2)}</div>
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-400">Max Exposure</div>
                  <div className="text-red-400 font-bold">{phoenixMaxExposureAvg} bets (${(phoenixMaxExposureAvg * phoenixBetSize).toFixed(0)})</div>
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-2xl">
                <div className="text-gray-400 text-sm">Full Run (to 1888)</div>
                <div className={`text-3xl font-bold ${phoenixEvFullRun >= 0 ? 'text-green-400' : 'text-red-400'}`}>{phoenixEvFullRun.toFixed(1)}×</div>
                <div className="text-sm">${(phoenixEvFullRun * phoenixBetSize).toFixed(2)}</div>
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-400">Max Exposure</div>
                  <div className="text-red-400 font-bold">{phoenixMaxExposureFull} bets (${(phoenixMaxExposureFull * phoenixBetSize).toFixed(0)})</div>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-2xl text-center text-base font-bold mb-8 ${phoenixCurrentX >= phoenixBeAvg ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {phoenixCurrentX >= phoenixBeAvg ? '✅ PLAY — +EV Expected' : '❌ Still -EV — keep waiting'}
            </div>

            <h2 className="text-xl font-semibold mb-5 text-orange-400">Break Even Points</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><div className="text-gray-400 text-sm">Average</div><div className="text-4xl font-bold text-green-400">{phoenixBeAvg}</div></div>
              <div><div className="text-gray-400 text-sm">Full Run (to 1888)</div><div className="text-4xl font-bold text-yellow-400">{phoenixBeFullRun}</div></div>
            </div>

            {!phoenixIsAlreadyPositive && (
              <div className="mt-6 pt-4 border-t border-gray-700 text-center text-sm italic text-orange-400">
                FP needed to reach +EV: <span className="font-bold text-white">${phoenixFpDollarsNeeded}</span> (play to {phoenixBeAvg})
              </div>
            )}
          </div>

          {/* Acquisition Fee, Walk-Away Advisor, EV Table for Phoenix would go here - left as-is from your last version */}
          {/* (Omitted in this paste for length, but they are unchanged in your file) */}
        </div>
      </div>
    )
  }

  // ==================== BUFFALO LINK CALCULATOR (full) ====================
  if (currentView === 'buffalo') {
    return (
      <div className="min-h-screen bg-gray-950 pb-12">
        {/* Hamburger Menu */}
        <div className="max-w-lg mx-auto px-4 pt-4 flex justify-between items-center">
          <button onClick={() => setCurrentView('dashboard')} className="text-3xl text-orange-400 hover:text-orange-300 p-2">☰</button>
          <div className="text-sm text-gray-400">Buffalo Link Calculator</div>
        </div>

        {/* Title */}
        <div className="max-w-lg mx-auto px-4 pt-2 pb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-3xl mr-3">🦬</div>
            <h1 className="flex-1 text-[29px] font-black tracking-[-1.6px] text-black"
                style={{ textShadow: `-1.6px -1.6px 0 #facc15, 1.6px -1.6px 0 #facc15, -1.6px 1.6px 0 #facc15, 1.6px 1.6px 0 #facc15` }}>
              BUFFALO LINK CALC
            </h1>
          </div>
        </div>

        {/* Inputs */}
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-gray-900 p-3 rounded-3xl mb-4 space-y-3">
            <div>
              <label className="block text-gray-400 mb-1 text-xs">Counter</label>
              <input type="text" inputMode="numeric" value={buffaloCurrentX} onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setBuffaloCurrentX(val === '' ? '' : parseInt(val, 10));
              }} className="w-full p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center border-2 border-yellow-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-gray-400 mb-1 text-xs">Bet Size</label>
                <div className="absolute left-4 top-9 text-2xl font-bold text-gray-400 pointer-events-none">$</div>
                <input type="text" value={buffaloBetSize} onChange={handleFloatChange(setBuffaloBetSize, 25)} onBlur={handleFloatBlur(setBuffaloBetSize, 25)} className="w-full pl-8 p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-xs">Denomination</label>
                <select value={buffaloDenom} onChange={(e) => setBuffaloDenom(parseFloat(e.target.value))} className="w-full p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center">
                  {[0.01,0.02,0.05,0.10,0.25,1,2,5,10,25,50,100].map(d => <option key={d} value={d}>${d}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-gray-900 rounded-3xl mb-6 overflow-hidden">
            <button onClick={() => setBuffaloShowAdvanced(!buffaloShowAdvanced)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800 transition-colors">
              <span className="text-base font-semibold">Advanced Settings</span>
              <span className={`text-xl transition-transform ${buffaloShowAdvanced ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {buffaloShowAdvanced && (
              <div className="p-4 pt-0 space-y-5 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Max Major</span>
                  <button onClick={() => setBuffaloMaxMajor(!buffaloMaxMajor)} className={`px-6 py-2 rounded-xl font-semibold text-sm ${buffaloMaxMajor ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                    {buffaloMaxMajor ? 'YES' : 'NO'}
                  </button>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-xs">Overall RTP (%)</label>
                  <input type="text" value={buffaloOverallRTP} onChange={handleFloatChange(setBuffaloOverallRTP, 91)} onBlur={handleFloatBlur(setBuffaloOverallRTP, 91)} className="w-full p-3 bg-gray-800 rounded-xl" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-xs">Avg Bonus Pay (bets)</label>
                  <input type="text" value={buffaloAvgBonusPay} onChange={handleFloatChange(setBuffaloAvgBonusPay, 31)} onBlur={handleFloatBlur(setBuffaloAvgBonusPay, 31)} className="w-full p-3 bg-gray-800 rounded-xl" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-xs">Buffalos per Spin ({buffaloIncrement.toFixed(1)})</label>
                  <input type="range" min="1.5" max="1.9" step="0.05" value={buffaloIncrement} onChange={(e) => setBuffaloIncrement(parseFloat(e.target.value))} className="w-full accent-yellow-500" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-xs">Midpoint Factor ({buffaloMidpointFactor.toFixed(2)})</label>
                  <input type="range" min="0.1" max="0.9" step="0.05" value={buffaloMidpointFactor} onChange={(e) => setBuffaloMidpointFactor(parseFloat(e.target.value))} className="w-full accent-yellow-500" />
                  <div className="text-center text-xs text-gray-400 mt-1">0.5 = true midpoint between current and 1800</div>
                </div>
              </div>
            )}
          </div>

          {/* Current EV */}
          <div className="bg-gray-900 p-6 rounded-3xl mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-yellow-400">Current EV</h2>
              <div className={`text-lg font-bold ${buffaloCurrentRTP >= 100 ? 'text-green-400' : 'text-red-400'}`}>
                {buffaloCurrentRTP.toFixed(1)}% RTP
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded-2xl">
                <div className="text-gray-400 text-sm">Average Case (Midpoint)</div>
                <div className={`text-3xl font-bold ${buffaloEvAvg >= 0 ? 'text-green-400' : 'text-red-400'}`}>{buffaloEvAvg.toFixed(1)}×</div>
                <div className="text-sm">${(buffaloEvAvg * buffaloBetSize).toFixed(2)}</div>
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-400">Max Exposure</div>
                  <div className="text-red-400 font-bold">{buffaloMaxExposureAvg} bets (${(buffaloMaxExposureAvg * buffaloBetSize).toFixed(0)})</div>
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-2xl">
                <div className="text-gray-400 text-sm">Full Run (to 1800)</div>
                <div className={`text-3xl font-bold ${buffaloEvFullRun >= 0 ? 'text-green-400' : 'text-red-400'}`}>{buffaloEvFullRun.toFixed(1)}×</div>
                <div className="text-sm">${(buffaloEvFullRun * buffaloBetSize).toFixed(2)}</div>
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-400">Max Exposure</div>
                  <div className="text-red-400 font-bold">{buffaloMaxExposureFull} bets (${(buffaloMaxExposureFull * buffaloBetSize).toFixed(0)})</div>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-2xl text-center text-base font-bold mb-8 ${buffaloCurrentX >= buffaloBeAvg ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {buffaloCurrentX >= buffaloBeAvg ? '✅ PLAY — +EV Expected' : '❌ Still -EV — keep waiting'}
            </div>

            <h2 className="text-xl font-semibold mb-5 text-yellow-400">Break Even Points</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><div className="text-gray-400 text-sm">Midpoint Method</div><div className="text-4xl font-bold text-green-400">{buffaloBeAvg}</div></div>
              <div><div className="text-gray-400 text-sm">Full Run (to 1800)</div><div className="text-4xl font-bold text-yellow-400">{buffaloBeFullRun}</div></div>
            </div>

            {!buffaloIsAlreadyPositive && (
              <div className="mt-6 pt-4 border-t border-gray-700 text-center text-sm italic text-orange-400">
                FP needed to reach +EV: <span className="font-bold text-white">${buffaloFpDollarsNeeded}</span> (play to {buffaloBeAvg})
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default App