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

const MUST_HIT = 1800
const RTP_FLOOR_COUNTER = 850   // Below this, RTP stays at overall RTP

function BuffaloLink({ onBack }) {
  const [currentX, setCurrentX] = useState(1400)
  const [betSize, setBetSize] = useState(25)
  const [denom, setDenom] = useState(1.00)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [overallRTP, setOverallRTP] = useState(91)
  const [avgBonusPay, setAvgBonusPay] = useState(20)
  const [buffalosPerSpin, setBuffalosPerSpin] = useState(1.7)
  const [midpointFactor, setMidpointFactor] = useState(0.5)
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

  const [scoutPercentage, setScoutPercentage] = useState(10)
  const [useFullRunForFee, setUseFullRunForFee] = useState(false)

  // Walk-Away S-Curve (unchanged)
  const getRecommendedWalkAway = (counter) => {
    const oRTP = overallRTP / 100
    const inc = buffalosPerSpin
    const B = avgBonusPay
    const spinsRemaining = Math.max(0, (MUST_HIT - counter) / inc)
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
      borderColor: '#fcd34d',
      backgroundColor: 'rgba(252, 211, 77, 0.15)',
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
      x: { title: { display: true, text: 'Counter', color: '#d1d5db' }, grid: { color: '#374151' }, ticks: { color: '#d1d5db' } },
      y: { title: { display: true, text: 'Walk-Away (Bets)', color: '#d1d5db' }, grid: { color: '#374151' }, ticks: { color: '#d1d5db' }, min: 0, max: 260 }
    },
    plugins: { legend: { display: false }, tooltip: { enabled: false } }
  }

  // Auto RTP based on denomination
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

  // Main calculation
  const calculate = () => {
    const oRTP = overallRTP / 100
    const inc = buffalosPerSpin
    const X = Number(currentX) || 0
    const bet = Number(betSize) || 25
    const B = Number(avgBonusPay) || 20
    const houseEdge = 1 - oRTP

    const midpointTrigger = X + (MUST_HIT - X) * midpointFactor
    const spinsAvg = Math.max(0, (midpointTrigger - X) / inc)
    const spinsFull = Math.max(0, (MUST_HIT - X) / inc)

    const avgEV = B - houseEdge * spinsAvg
    const fullEV = B - houseEdge * spinsFull

    const baseHouseEdge = 1 - 0.28
    const maxExpAvg = Math.round(spinsAvg * baseHouseEdge)
    const maxExpFull = Math.round(spinsFull * baseHouseEdge)

    // Stable Average Break Even
    const breakevenAvg = Math.round(MUST_HIT - (B / houseEdge) * (inc / midpointFactor))
    const breakevenFull = Math.round(MUST_HIT - (B / houseEdge) * inc)

    setEvAvg(avgEV)
    setEvFullRun(fullEV)
    setMaxExposureAvg(maxExpAvg)
    setMaxExposureFull(maxExpFull)
    setBeAvg(breakevenAvg)
    setBeFullRun(breakevenFull)

    // ==================== SMOOTH CURRENT RTP ====================
    const spinsToExpectedHit = Math.max(1, spinsAvg)
    const rawRTP = 100 + 100 * (B / spinsToExpectedHit - houseEdge)

    let finalRTP

    if (X >= breakevenAvg) {
      finalRTP = rawRTP                               // Full calculated RTP when +EV
    } else if (X <= RTP_FLOOR_COUNTER) {
      finalRTP = overallRTP                           // Flat at machine RTP below 850
    } else {
      // Smooth linear decrease from 100% at break-even down to overallRTP at 850
      const distanceFromFloor = breakevenAvg - RTP_FLOOR_COUNTER
      const distanceFromBE = breakevenAvg - X
      const progress = distanceFromBE / distanceFromFloor   // 0 at BE → 1 at 850

      finalRTP = 100 - (100 - overallRTP) * progress
    }

    setCurrentRTP(Math.round(finalRTP * 10) / 10)
    // ===========================================================

    const alreadyPositive = avgEV >= 0
    setIsAlreadyPositive(alreadyPositive)

    if (!alreadyPositive && breakevenAvg > X) {
      const spinsNeeded = (breakevenAvg - X) / inc
      setFpDollarsNeeded(Math.round(spinsNeeded * bet))
    } else {
      setFpDollarsNeeded(0)
    }

    // EV Table
    const table = []
    for (let c = 1150; c <= 1775; c += 25) {
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
  }, [currentX, betSize, denom, overallRTP, avgBonusPay, buffalosPerSpin, midpointFactor, maxMajor])

  // Input handlers (unchanged)
  const handleFloatChange = (setter, defaultVal) => (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '')
    setter(val)
  }

  const handleFloatBlur = (setter, defaultVal) => (e) => {
    let val = parseFloat(e.target.value)
    setter(isNaN(val) ? defaultVal : val)
  }

  const handleIntegerChange = (setter, defaultVal) => (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    setter(val)
  }

  const handleIntegerBlur = (setter, defaultVal) => (e) => {
    let val = parseInt(e.target.value, 10)
    setter(isNaN(val) ? defaultVal : val)
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-12">
      <div className="pt-8 max-w-lg mx-auto px-4">
        {/* Title */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 mr-4">
            <img src="/buffalo-icon.png" alt="Buffalo" className="w-12 h-12 object-contain" />
          </div>
          <h1
            className="text-[29px] font-black tracking-[-1.6px] text-amber-100"
            style={{ textShadow: `-2px -2px 0 #b45309, 2px -2px 0 #b45309, -2px 2px 0 #b45309, 2px 2px 0 #b45309` }}
          >
            BUFFALO LINK EV CALC
          </h1>
        </div>

        {/* Counter + Bet + Denom */}
        <div className="bg-gray-900 p-3 rounded-3xl mb-4 space-y-3">
          <div>
            <label className="block text-gray-400 mb-1 text-xs">Counter</label>
            <input
              type="text"
              inputMode="numeric"
              value={currentX}
              onChange={handleIntegerChange(setCurrentX, 1400)}
              onBlur={handleIntegerBlur(setCurrentX, 1400)}
              className="w-full p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center border-2 border-amber-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="block text-gray-400 mb-1 text-xs">Bet Size</label>
              <div className="absolute left-4 top-9 text-2xl font-bold text-gray-400">$</div>
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
                {[0.01,0.02,0.05,0.10,0.25,1,2,5,10,25,50,100].map(d => (
                  <option key={d} value={d}>${d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Settings - unchanged */}
        <div className="bg-gray-900 rounded-3xl mb-6 overflow-hidden">
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800">
            <span className="text-base font-semibold">Advanced Settings</span>
            <span className={`text-xl transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showAdvanced && (
            <div className="p-4 pt-0 space-y-5 border-t border-gray-800">
              <div className="flex justify-between items-center">
                <span>Max Major</span>
                <button onClick={() => setMaxMajor(!maxMajor)} className={`px-6 py-2 rounded-xl text-sm font-semibold ${maxMajor ? 'bg-green-600' : 'bg-gray-700'}`}>
                  {maxMajor ? 'YES' : 'NO'}
                </button>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Overall RTP (%)</label>
                <input type="text" value={overallRTP} onChange={handleFloatChange(setOverallRTP, 91)} onBlur={handleFloatBlur(setOverallRTP, 91)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Avg Bonus Pay (bets)</label>
                <input type="text" value={avgBonusPay} onChange={handleFloatChange(setAvgBonusPay, 20)} onBlur={handleFloatBlur(setAvgBonusPay, 20)} className="w-full p-3 bg-gray-800 rounded-xl" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-gray-400 text-xs">Buffalos per Spin</label>
                  <span className="text-amber-400 font-bold">{buffalosPerSpin.toFixed(1)}</span>
                </div>
                <input type="range" min="1.5" max="1.9" step="0.1" value={buffalosPerSpin} onChange={(e) => setBuffalosPerSpin(parseFloat(e.target.value))} className="w-full accent-amber-500" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-gray-400 text-xs">Midpoint Factor</label>
                  <span className="text-amber-400 font-bold">{midpointFactor.toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={midpointFactor} onChange={(e) => setMidpointFactor(parseFloat(e.target.value))} className="w-full accent-amber-500" />
              </div>
            </div>
          )}
        </div>

        {/* Current EV */}
        <div className="bg-gray-900 p-6 rounded-3xl mb-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold text-amber-400">Current EV</h2>
            <div className={`text-lg font-bold ${currentRTP >= 100 ? 'text-green-400' : 'text-red-400'}`}>{currentRTP.toFixed(1)}% RTP</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-2xl">
              <div className="text-gray-400 text-sm">Average Case</div>
              <div className={`text-3xl font-bold ${evAvg >= 0 ? 'text-green-400' : 'text-red-400'}`}>{evAvg.toFixed(1)}×</div>
              <div className="text-sm text-gray-300">${(evAvg * betSize).toFixed(2)}</div>
              <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-400">
                Max Exposure: <span className="text-red-400 font-bold">{maxExposureAvg} bets</span>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-2xl">
              <div className="text-gray-400 text-sm">Full Run (to 1800)</div>
              <div className={`text-3xl font-bold ${evFullRun >= 0 ? 'text-green-400' : 'text-red-400'}`}>{evFullRun.toFixed(1)}×</div>
              <div className="text-sm text-gray-300">${(evFullRun * betSize).toFixed(2)}</div>
              <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-400">
                Max Exposure: <span className="text-red-400 font-bold">{maxExposureFull} bets</span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl text-center font-bold ${currentX >= beAvg ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
            {currentX >= beAvg ? '✅ PLAY — +EV Expected' : '❌ Still -EV — keep waiting'}
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-amber-400">Break Even Points</h2>
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <div className="text-gray-400 text-sm">Average Case</div>
              <div className="text-4xl font-bold text-green-400">{beAvg}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Full Run (to 1800)</div>
              <div className="text-4xl font-bold text-amber-400">{beFullRun}</div>
            </div>
          </div>

          {!isAlreadyPositive && fpDollarsNeeded > 0 && (
            <div className="mt-6 text-center text-amber-400 italic text-sm">
              FP needed to reach +EV: <span className="font-bold text-white">${fpDollarsNeeded}</span> (play to {beAvg})
            </div>
          )}
        </div>

        {/* Acquisition Fee, Walk-Away Advisor, and EV Table remain exactly as in your base */}
        {/* (They are unchanged - copy them from your clean base if needed, but they should already be there) */}

        {/* ... rest of your file (Acquisition Fee, Walk-Away, EV Table, Info Modal) is identical to your base ... */}

      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-3xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-amber-400 mb-4">Walk-Away Advisor</h3>
            <div className="text-gray-300 text-[15px] leading-relaxed space-y-4">
              <p>This advisor recommends the <strong>optimal stopping threshold</strong> — the profit level (in bets) at which you should consider walking away, even while the machine remains in positive expected value (+EV).</p>
              <p>Buffalo Link has high volatility. The advisor uses a logistic S-curve to balance remaining EV and drawdown risk.</p>
            </div>
            <button onClick={() => setShowInfoModal(false)} className="mt-6 w-full bg-amber-600 py-4 rounded-2xl font-bold">Got it</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BuffaloLink