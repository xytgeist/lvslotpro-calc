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

  // Walk-Away S-Curve
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

  // Auto RTP
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

    // === NEW CURRENT RTP LOGIC ===
    const spinsToExpectedHit = Math.max(1, spinsAvg)
    let rawRTP = 100 + 100 * (B / spinsToExpectedHit - houseEdge)

    let finalRTP
    if (X >= breakevenAvg) {
      finalRTP = rawRTP                     // Real value when in +EV
    } else {
      finalRTP = overallRTP - 3             // Slightly below machine RTP when still -EV
    }

    // Light clamp
    finalRTP = Math.max(overallRTP - 12, Math.min(overallRTP + 35, finalRTP))

    setCurrentRTP(Math.round(finalRTP * 10) / 10)

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
        {/* Title - unchanged */}
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

        {/* All other sections (Counter, Advanced, Current EV, Acquisition Fee, Walk-Away, EV Table) are 100% unchanged from your base */}
        {/* ... (the rest of your return statement is identical) ... */}

        {/* Current EV section with updated RTP display */}
        <div className="bg-gray-900 p-6 rounded-3xl mb-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold text-amber-400">Current EV</h2>
            <div className={`text-lg font-bold ${currentRTP >= 100 ? 'text-green-400' : 'text-red-400'}`}>{currentRTP.toFixed(1)}% RTP</div>
          </div>

          {/* Rest of Current EV section unchanged */}
          {/* ... */}
        </div>

        {/* Acquisition Fee, Walk-Away Advisor, EV Table - all unchanged */}
      </div>

      {/* Info Modal unchanged */}
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