import { useState, useEffect } from 'react'
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

const MUST_HIT = 1800   // Buffalo Link must-hit by 1800

function BuffaloLink({ onBack }) {
  const [currentX, setCurrentX] = useState(1400)
  const [betSize, setBetSize] = useState(25)
  const [denom, setDenom] = useState(1.00)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [overallRTP, setOverallRTP] = useState(91)
  const [avgBonusPay, setAvgBonusPay] = useState(31)
  const [buffalosPerSpin, setBuffalosPerSpin] = useState(1.7)   // Buffalo specific
  const [midpointFactor, setMidpointFactor] = useState(0.5)     // 0.5 = true midpoint
  const [maxMajor, setMaxMajor] = useState(false)

  const [evAvg, setEvAvg] = useState(0)
  const [evFullRun, setEvFullRun] = useState(0)
  const [maxExposureAvg, setMaxExposureAvg] = useState(0)
  const [maxExposureFull, setMaxExposureFull] = useState(0)
  const [beAvg, setBeAvg] = useState(0)
  const [beFullRun, setBeFullRun] = useState(0)
  const [evTable, setEvTable] = useState([])
  const [currentRTP, setCurrentRTP] = useState(0)
  const [fpDollarsNeeded, setFpDollarsNeeded] = useState(0)
  const [isAlreadyPositive, setIsAlreadyPositive] = useState(false)

  const [testCounter, setTestCounter] = useState(1400)
  const [hoverCounter, setHoverCounter] = useState(null)
  const [hoverWalkAway, setHoverWalkAway] = useState(null)
  const [showInfoModal, setShowInfoModal] = useState(false)

  // Walk-Away S-Curve (same as Phoenix)
  const getRecommendedWalkAway = (counter) => {
    const oRTP = overallRTP / 100
    const inc = buffalosPerSpin
    const avgTrig = MUST_HIT   // Using must-hit as trigger for simplicity
    const B = avgBonusPay
    const spinsRemaining = Math.max(0, (avgTrig - counter) / inc)
    const remainingEV = B - (1 - oRTP) * spinsRemaining
    const normalized = Math.max(0, Math.min(1, (counter - 1300) / 588))
    const sCurve = 1 / (1 + Math.exp(-5.5 * (normalized - 0.48)))
    const curveBonus = sCurve * 98
    let walkAway = Math.round(remainingEV * 3.5 + curveBonus)
    return Math.max(75, Math.min(245, walkAway))
  }

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

  // Auto RTP (same logic as Phoenix)
  useEffect(() => {
    let baseOverall = 91
    if (denom <= 0.02) baseOverall = 88
    else if (denom === 0.05) baseOverall = 88.25
    else if (denom === 0.10) baseOverall = 88.4
    else if (denom === 0.25) baseOverall = 88.6
    else if (denom > 1) baseOverall = 91.5
    const finalOverall = maxMajor ? baseOverall + 0.5 : baseOverall
    setOverallRTP(finalOverall)
  }, [denom, maxMajor])

  // Buffalo-specific calculation using midpoint
  const calculate = () => {
    const oRTP = overallRTP / 100
    const inc = buffalosPerSpin
    const X = currentX || 0
    const bet = betSize || 25
    const B = avgBonusPay
    const houseEdge = 1 - oRTP

    // Midpoint trigger
    const midpointTrigger = X + (MUST_HIT - X) * midpointFactor

    const spinsAvg = Math.max(0, (midpointTrigger - X) / inc)
    const spinsFull = Math.max(0, (MUST_HIT - X) / inc)

    const avgEV = B - houseEdge * spinsAvg
    const fullEV = B - houseEdge * spinsFull

    const baseHouseEdge = 1 - (28 / 100)
    const maxExpAvg = Math.round(spinsAvg * baseHouseEdge)
    const maxExpFull = Math.round(spinsFull * baseHouseEdge)

    const breakevenAvg = Math.round(midpointTrigger - (B / houseEdge) * inc)
    const breakevenFull = Math.round(MUST_HIT - (B / houseEdge) * inc)

    setEvAvg(avgEV)
    setEvFullRun(fullEV)
    setMaxExposureAvg(maxExpAvg)
    setMaxExposureFull(maxExpFull)
    setBeAvg(breakevenAvg)
    setBeFullRun(breakevenFull)

    let rtp = oRTP * 100
    if (spinsAvg > 0) {
      const evPerSpin = avgEV / spinsAvg
      rtp = 100 + (evPerSpin * 100)
    }
    setCurrentRTP(Math.round(rtp * 10) / 10)

    const alreadyPositive = avgEV >= 0
    setIsAlreadyPositive(alreadyPositive)
    if (alreadyPositive) {
      setFpDollarsNeeded(0)
    } else {
      const spinsNeeded = Math.max(0, breakevenAvg - X)
      const dollarsNeeded = Math.round(spinsNeeded * bet)
      setFpDollarsNeeded(dollarsNeeded)
    }

    const table = []
    for (let c = 1150; c <= 1775; c += 25) {   // Adjusted for Buffalo max 1800
      const midTrig = c + (MUST_HIT - c) * midpointFactor
      const avgSpins = Math.max(0, (midTrig - c) / inc)
      const fullSpins = Math.max(0, (MUST_HIT - c) / inc)
      table.push({
        counter: c,
        avgEV: B - houseEdge * avgSpins,
        fullEV: B - houseEdge * fullSpins,
        avgDollar: (B - houseEdge * avgSpins) * bet,
        fullDollar: (B - houseEdge * fullSpins) * bet
      })
    }
    setEvTable(table)
  }

  useEffect(() => {
    calculate()
  }, [overallRTP, avgBonusPay, buffalosPerSpin, midpointFactor, currentX, betSize, denom, maxMajor])

  // Safe handlers (same as Phoenix)
  const handleFloatChange = (setter, defaultVal) => (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setter(val);
  };

  const handleFloatBlur = (setter, defaultVal) => (e) => {
    let val = e.target.value.trim();
    if (val === '' || isNaN(parseFloat(val))) {
      setter(defaultVal);
    } else {
      setter(parseFloat(val));
    }
  };

  const handleIntegerChange = (setter, defaultVal) => (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setter(val);
  };

  const handleIntegerBlur = (setter, defaultVal) => (e) => {
    let val = e.target.value.trim();
    if (val === '' || isNaN(parseInt(val, 10))) {
      setter(defaultVal);
    } else {
      setter(parseInt(val, 10));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-12">
      <div className="pt-8 max-w-lg mx-auto px-4">

        {/* Buffalo Link Title + Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mr-4">🦬</div>
          <h1 className="text-[29px] font-black tracking-[-1.6px] text-black" style={{ textShadow: `-1.6px -1.6px 0 #3b82f6, 1.6px -1.6px 0 #3b82f6, -1.6px 1.6px 0 #3b82f6, 1.6px 1.6px 0 #3b82f6` }}>
            BUFFALO LINK EV CALC
          </h1>
        </div>

        {/* Counter */}
        <div className="bg-gray-900 p-3 rounded-3xl mb-4 space-y-3">
          <div>
            <label className="block text-gray-400 mb-1 text-xs">Counter</label>
            <input type="text" inputMode="numeric" value={currentX} onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setCurrentX(val === '' ? '' : parseInt(val, 10));
            }} className="w-full p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center border-2 border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="block text-gray-400 mb-1 text-xs">Bet Size</label>
              <div className="absolute left-4 top-9 text-2xl font-bold text-gray-400 pointer-events-none">$</div>
              <input type="text" value={betSize} onChange={handleFloatChange(setBetSize, 25)} onBlur={handleFloatBlur(setBetSize, 25)} className="w-full pl-8 p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center" />
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
                <label className="block text-gray-400 mb-1 text-xs">Buffalos per Spin</label>
                <input type="text" value={buffalosPerSpin} onChange={handleFloatChange(setBuffalosPerSpin, 1.7)} onBlur={handleFloatBlur(setBuffalosPerSpin, 1.7)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-xs">Midpoint Factor (0.0 - 1.0)</label>
                <input type="text" value={midpointFactor} onChange={handleFloatChange(setMidpointFactor, 0.5)} onBlur={handleFloatBlur(setMidpointFactor, 0.5)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
            </div>
          )}
        </div>

        {/* Current EV, Acquisition Fee, Walk-Away Advisor, EV Table sections go here */}
        {/* (Copy the corresponding sections from your PhoenixLink.jsx and paste them below) */}

      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-3xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-orange-400 mb-4">Walk-Away Advisor</h3>
            <div className="text-gray-300 text-[15px] leading-relaxed space-y-4">
              <p>This advisor recommends the <strong>optimal stopping threshold</strong> — the profit level (in bets) at which you should consider walking away, even while the machine remains in positive expected value (+EV).</p>
              <p>Buffalo Link has high volatility. The advisor uses a logistic S-curve calibrated to balance remaining EV and drawdown risk.</p>
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

export default BuffaloLink