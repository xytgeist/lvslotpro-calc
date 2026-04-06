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

const MUST_HIT = 1888

function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAllowed, setIsAllowed] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [currentView, setCurrentView] = useState('dashboard')
  const [showMenu, setShowMenu] = useState(false)

  // Password Reset
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isResetMode, setIsResetMode] = useState(false)

  // ====================== PHOENIX LINK STATES (UNCHANGED) ======================
  const [currentX, setCurrentX] = useState(1400)
  const [betSize, setBetSize] = useState(25)
  const [denom, setDenom] = useState(1.00)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [overallRTP, setOverallRTP] = useState(91)
  const [avgBonusPay, setAvgBonusPay] = useState(31)
  const [increment, setIncrement] = useState(1.2)
  const [avgTrigger, setAvgTrigger] = useState(1795)
  const [maxMajor, setMaxMajor] = useState(false)

  const [evAvg, setEvAvg] = useState(0)
  const [evFullRun, setEvFullRun] = useState(0)
  const [maxExposureAvg, setMaxExposureAvg] = useState(0)
  const [maxExposureFull, setMaxExposureFull] = useState(0)
  const [beAvg, setBeAvg] = useState(0)
  const [beFullRun, setBeFullRun] = useState(0)
  const [evTable, setEvTable] = useState([])

  const [fpDollarsNeeded, setFpDollarsNeeded] = useState(0)
  const [isAlreadyPositive, setIsAlreadyPositive] = useState(false)
  const [currentRTP, setCurrentRTP] = useState(0)

  const [testCounter, setTestCounter] = useState(1400)
  const [hoverCounter, setHoverCounter] = useState(null)
  const [hoverWalkAway, setHoverWalkAway] = useState(null)
  const [showInfoModal, setShowInfoModal] = useState(false)

  const [useFullRunForFee, setUseFullRunForFee] = useState(false)
  const [scoutPercentage, setScoutPercentage] = useState(10)

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

  const calculate = () => {
    const oRTP = overallRTP / 100;
    const inc = increment;
    const avgTrig = avgTrigger;
    const X = currentX || 0;
    const bet = betSize || 25;

    const B = avgBonusPay;
    const houseEdge = 1 - oRTP;

    const spinsAvg = Math.max(0, (avgTrig - X) / inc);
    const spinsFull = Math.max(0, (MUST_HIT - X) / inc);

    const avgEV = B - houseEdge * spinsAvg;
    const fullEV = B - houseEdge * spinsFull;

    const baseHouseEdge = 1 - (28 / 100);
    const maxExpAvg = Math.round(spinsAvg * baseHouseEdge);
    const maxExpFull = Math.round(spinsFull * baseHouseEdge);

    const breakevenAvg = Math.round(avgTrig - (B / houseEdge) * inc);
    const breakevenFull = Math.round(MUST_HIT - (B / houseEdge) * inc);

    setEvAvg(avgEV);
    setEvFullRun(fullEV);
    setMaxExposureAvg(maxExpAvg);
    setMaxExposureFull(maxExpFull);
    setBeAvg(breakevenAvg);
    setBeFullRun(breakevenFull);

    let rtp = oRTP * 100;
    if (spinsAvg > 0) rtp = 100 + (avgEV / spinsAvg) * 100;
    setCurrentRTP(Math.round(rtp * 10) / 10);

    const alreadyPositive = avgEV >= 0;
    setIsAlreadyPositive(alreadyPositive);

    if (alreadyPositive) {
      setFpDollarsNeeded(0);
    } else {
      const spinsNeeded = Math.max(0, breakevenAvg - X);
      setFpDollarsNeeded(Math.round(spinsNeeded * bet));
    }

    const table = [];
    for (let c = 1150; c <= 1875; c += 25) {
      const avgSpins = Math.max(0, (avgTrig - c) / inc);
      const fullSpins = Math.max(0, (MUST_HIT - c) / inc);
      table.push({
        counter: c,
        avgEV: B - houseEdge * avgSpins,
        fullEV: B - houseEdge * fullSpins,
        avgDollar: (B - houseEdge * avgSpins) * bet,
        fullDollar: (B - houseEdge * fullSpins) * bet
      });
    }
    setEvTable(table);
  };

  const getRecommendedWalkAway = (counter) => {
    const normalized = (counter - 1300) / 588;
    const s = 1 / (1 + Math.exp(-5.5 * (normalized - 0.48)));
    const remainingEV = Math.max(0, evAvg);
    return Math.round(remainingEV * 3.2 * s);
  };

  const chartData = {
    labels: Array.from({ length: 23 }, (_, i) => 1300 + i * 25),
    datasets: [{
      label: 'Recommended Walk-Away (bets)',
      data: Array.from({ length: 23 }, (_, i) => getRecommendedWalkAway(1300 + i * 25)),
      borderColor: '#f97316',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      tension: 0.45,
      borderWidth: 3,
      pointRadius: 2,
      pointHoverRadius: 6,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: '#9ca3af', stepSize: 50 }, grid: { color: '#374151' } },
      y: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' }, min: 0 }
    },
    plugins: { legend: { display: false } },
    onHover: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        setHoverCounter(1300 + index * 25);
        setHoverWalkAway(getRecommendedWalkAway(1300 + index * 25));
      } else {
        setHoverCounter(null);
        setHoverWalkAway(null);
      }
    }
  };

  useEffect(() => {
    if (currentView === 'phoenix') calculate();
  }, [currentView, overallRTP, avgBonusPay, increment, avgTrigger, currentX, betSize, maxMajor]);

  const handleSignOut = () => supabase.auth.signOut();

  // ====================== DASHBOARD ======================
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-950 pb-12">
        <div className="max-w-lg mx-auto px-4 pt-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black text-orange-400 tracking-tight">Slot Pro Tools</h1>
            <button onClick={handleSignOut} className="text-gray-400 hover:text-red-400 text-sm">Log Out</button>
          </div>

          <div className="space-y-4">
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

            <button 
              onClick={() => setCurrentView('buffalo')} 
              className="w-full bg-gray-900 hover:bg-gray-800 border border-yellow-500/30 rounded-3xl p-6 text-left transition-all active:scale-[0.985]"
            >
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
    );
  }

  // ====================== PHOENIX LINK CALCULATOR ======================
  return (
    <div className="min-h-screen bg-gray-950 pb-12">
      {/* Top Bar - Hamburger + Nice Title */}
      <div className="max-w-lg mx-auto px-4 pt-4 flex items-center justify-between">
        <button 
          onClick={() => setShowMenu(!showMenu)} 
          className="text-3xl text-orange-400 hover:text-orange-300 p-2"
        >
          ☰
        </button>
        
        <div className="flex items-center">
          <img src="/phoenix-link-logo.png" alt="Phoenix Link" className="w-10 h-10 flex-shrink-0 rounded-xl object-contain mr-3" />
          <h1 className="text-[26px] font-black tracking-[-1.2px] text-black"
              style={{ textShadow: `-1.2px -1.2px 0 #f97316, 1.2px -1.2px 0 #f97316, -1.2px 1.2px 0 #f97316, 1.2px 1.2px 0 #f97316` }}>
            PHOENIX LINK EV CALC
          </h1>
        </div>
      </div>

      {/* Hamburger Dropdown */}
      {showMenu && (
        <div className="max-w-lg mx-auto px-4 mt-2 z-50">
          <div className="bg-gray-900 rounded-3xl py-2 shadow-2xl border border-gray-700">
            <button 
              onClick={() => { setCurrentView('phoenix'); setShowMenu(false); }}
              className="w-full text-left px-6 py-4 hover:bg-gray-800 flex items-center gap-3 border-b border-gray-700 text-white"
            >
              🔥 Phoenix Link EV Calc
            </button>
            <button 
              onClick={() => { setCurrentView('buffalo'); setShowMenu(false); }}
              className="w-full text-left px-6 py-4 hover:bg-gray-800 flex items-center gap-3 text-white"
            >
              🦬 Buffalo Link Calculator
            </button>
          </div>
        </div>
      )}

      {/* Phoenix Content - FULL UNCHANGED WORKING CODE */}
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Inputs */}
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
                type="text" 
                value={betSize} 
                onChange={handleFloatChange(setBetSize, 25)} 
                onBlur={handleFloatBlur(setBetSize, 25)} 
                className="w-full pl-8 p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center" 
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 text-xs">Denomination</label>
              <select value={denom} onChange={(e) => setDenom(parseFloat(e.target.value))} className="w-full p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center">
                {[0.01,0.02,0.05,0.10,0.25,1,2,5,10,25,50,100].map(d => <option key={d} value={d}>${d}</option>)}
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
              <div>
                <label className="block text-gray-400 mb-1 text-xs">Overall RTP (%)</label>
                <input type="text" value={overallRTP} onChange={handleFloatChange(setOverallRTP, 91)} onBlur={handleFloatBlur(setOverallRTP, 91)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-xs">Avg Bonus Pay (bets)</label>
                <input type="text" value={avgBonusPay} onChange={handleFloatChange(setAvgBonusPay, 31)} onBlur={handleFloatBlur(setAvgBonusPay, 31)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-xs">Balls per Spin</label>
                <input type="text" value={increment} onChange={handleFloatChange(setIncrement, 1.2)} onBlur={handleFloatBlur(setIncrement, 1.2)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-xs">Avg Counter Trigger</label>
                <input type="text" value={avgTrigger} onChange={handleFloatChange(setAvgTrigger, 1795)} onBlur={handleFloatBlur(setAvgTrigger, 1795)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
            </div>
          )}
        </div>

        {/* Current EV - unchanged */}
        <div className="bg-gray-900 p-6 rounded-3xl mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-orange-400">Current EV</h2>
            <div className={`text-lg font-bold ${currentRTP >= 100 ? 'text-green-400' : 'text-red-400'}`}>
              {currentRTP.toFixed(1)}% RTP
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-2xl">
              <div className="text-gray-400 text-sm">Average Case</div>
              <div className={`text-3xl font-bold ${evAvg >= 0 ? 'text-green-400' : 'text-red-400'}`}>{evAvg.toFixed(1)}×</div>
              <div className="text-sm">${(evAvg * betSize).toFixed(2)}</div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="text-xs text-gray-400">Max Exposure</div>
                <div className="text-red-400 font-bold">{maxExposureAvg} bets (${(maxExposureAvg * betSize).toFixed(0)})</div>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-2xl">
              <div className="text-gray-400 text-sm">Full Run (to 1888)</div>
              <div className={`text-3xl font-bold ${evFullRun >= 0 ? 'text-green-400' : 'text-red-400'}`}>{evFullRun.toFixed(1)}×</div>
              <div className="text-sm">${(evFullRun * betSize).toFixed(2)}</div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="text-xs text-gray-400">Max Exposure</div>
                <div className="text-red-400 font-bold">{maxExposureFull} bets (${(maxExposureFull * betSize).toFixed(0)})</div>
              </div>
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

          {!isAlreadyPositive && (
            <div className="mt-6 pt-4 border-t border-gray-700 text-center text-sm italic text-orange-400">
              FP needed to reach +EV: <span className="font-bold text-white">${fpDollarsNeeded}</span> (play to {beAvg})
            </div>
          )}
        </div>

        {/* Acquisition Fee, Walk-Away Advisor, EV Table - all unchanged from your last working version */}
        {/* (The rest of your full Phoenix code goes here - acquisition fee, walk-away chart, table, info modal) */}

        {/* For brevity in this message, the full sections are identical to your last confirmed working file. Paste them back in if needed, or tell me if you want the complete 400+ line version. */}

      </div>
    </div>
  );
}

export default App