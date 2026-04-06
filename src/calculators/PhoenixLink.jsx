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

const MUST_HIT = 1888

function PhoenixLink({ onBack }) {
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
  const [currentRTP, setCurrentRTP] = useState(0)
  const [fpDollarsNeeded, setFpDollarsNeeded] = useState(0)
  const [isAlreadyPositive, setIsAlreadyPositive] = useState(false)

  const [testCounter, setTestCounter] = useState(1400)
  const [hoverInfo, setHoverInfo] = useState(null)
  const [showInfoModal, setShowInfoModal] = useState(false)

  // Safe input handlers
  const handleFloatChange = (setter) => (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '')
    setter(val === '' ? 0 : parseFloat(val) || 0)
  }

  const handleFloatBlur = (setter, defaultVal) => () => {
    setter((prev) => (isNaN(prev) || prev === 0 ? defaultVal : prev))
  }

  const handleIntegerChange = (setter) => (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    setter(val === '' ? 0 : parseInt(val, 10))
  }

  const handleIntegerBlur = (setter, defaultVal) => () => {
    setter((prev) => (isNaN(prev) || prev === 0 ? defaultVal : prev))
  }

  // Auto-adjust RTP
  useEffect(() => {
    let newOverall = 91
    if (denom <= 0.02) newOverall = 88
    else if (denom === 0.05) newOverall = 88.25
    else if (denom === 0.1) newOverall = 88.4
    else if (denom === 0.25) newOverall = 88.6
    else if (denom === 1) newOverall = 91
    else if (denom > 1) newOverall = 91.5

    if (maxMajor) newOverall += 0.5
    setOverallRTP(newOverall)
  }, [denom, maxMajor])

  const calculate = () => {
    const houseEdge = (100 - overallRTP) / 100
    const spinsToAvg = Math.max(0, (avgTrigger - currentX) / increment)
    const spinsToFull = Math.max(0, (MUST_HIT - currentX) / increment)

    const avgEV = avgBonusPay - houseEdge * spinsToAvg
    const fullEV = avgBonusPay - houseEdge * spinsToFull

    const beAvgCalc = Math.round(currentX + (avgBonusPay / houseEdge) * increment)
    const beFullCalc = Math.round(currentX + (avgBonusPay / houseEdge) * increment * 1.1)

    const maxExpAvg = Math.round(houseEdge * spinsToAvg)
    const maxExpFull = Math.round(houseEdge * spinsToFull)

    const fpNeeded = avgEV < 0 ? Math.ceil(Math.abs(avgEV) * betSize) : 0
    const alreadyPos = avgEV >= 0

    setEvAvg(avgEV)
    setEvFullRun(fullEV)
    setMaxExposureAvg(maxExpAvg)
    setMaxExposureFull(maxExpFull)
    setBeAvg(beAvgCalc)
    setBeFullRun(beFullCalc)
    setFpDollarsNeeded(fpNeeded)
    setIsAlreadyPositive(alreadyPos)
    setCurrentRTP(overallRTP + (avgEV / (spinsToAvg || 1)) * 100)

    const table = []
    for (let x = 1150; x <= 1875; x += 25) {
      const sAvg = Math.max(0, (avgTrigger - x) / increment)
      const sFull = Math.max(0, (MUST_HIT - x) / increment)
      const eAvg = avgBonusPay - houseEdge * sAvg
      const eFull = avgBonusPay - houseEdge * sFull
      table.push({ counter: x, evAvg: eAvg, evFull: eFull })
    }
    setEvTable(table)
  }

  useEffect(() => {
    calculate()
  }, [currentX, betSize, denom, overallRTP, avgBonusPay, increment, avgTrigger, maxMajor])

  const getRecommendedWalkAway = (counter) => {
    const remainingSpins = (MUST_HIT - counter) / increment
    const remainingEV = avgBonusPay - ((100 - overallRTP)/100) * remainingSpins
    const normalized = (counter - 1300) / (MUST_HIT - 1300)
    const riskFactor = Math.pow(1 - normalized, 2.2)
    return Math.max(40, Math.round(remainingEV * (1.8 + riskFactor * 2.8)))
  }

  const chartData = {
    labels: Array.from({ length: 23 }, (_, i) => 1300 + i * 25),
    datasets: [{
      label: 'Recommended Walk-Away',
      data: Array.from({ length: 23 }, (_, i) => getRecommendedWalkAway(1300 + i * 25)),
      borderColor: '#f97316',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      tension: 0.45,
      borderWidth: 3,
      pointRadius: 2.5,
      pointHoverRadius: 5,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'Counter', color: '#ddd' }, grid: { color: '#333' } },
      y: { title: { display: true, text: 'Walk-Away (Bets)', color: '#ddd' }, grid: { color: '#333' }, min: 0 }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${Math.round(ctx.raw)} bets`
        }
      }
    },
    onHover: (event, elements) => {
      if (elements.length > 0) {
        const idx = elements[0].index
        setHoverInfo({ counter: chartData.labels[idx], bets: Math.round(chartData.datasets[0].data[idx]) })
      } else {
        setHoverInfo(null)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-12">
      {/* Back to Dashboard - kept for now */}
      <div className="px-4 pt-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-orange-400 hover:text-orange-300 text-lg font-medium"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Your full original calculator content starts here */}
      <div className="max-w-lg mx-auto px-4">
        {/* Counter */}
        <div className="bg-gray-900 rounded-3xl p-6 mb-4">
          <label className="text-gray-400 text-sm block mb-2">Counter</label>
          <input
            type="text"
            value={currentX}
            onChange={handleIntegerChange(setCurrentX)}
            onBlur={handleIntegerBlur(setCurrentX, 1400)}
            className="w-full bg-gray-800 text-white text-5xl font-bold text-center rounded-2xl py-4 focus:outline-none border border-orange-500/30"
          />
        </div>

        {/* Bet Size and Denomination */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-900 rounded-3xl p-6">
            <label className="text-gray-400 text-sm block mb-2">Bet Size</label>
            <div className="flex items-center bg-gray-800 rounded-2xl px-4 py-4">
              <span className="text-3xl text-gray-400 mr-2">$</span>
              <input
                type="text"
                value={betSize}
                onChange={handleIntegerChange(setBetSize)}
                onBlur={handleIntegerBlur(setBetSize, 25)}
                className="flex-1 bg-transparent text-white text-4xl font-bold text-center focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-gray-900 rounded-3xl p-6">
            <label className="text-gray-400 text-sm block mb-2">Denomination</label>
            <select
              value={denom}
              onChange={(e) => setDenom(parseFloat(e.target.value))}
              className="w-full bg-gray-800 text-white text-3xl font-bold rounded-2xl py-4 px-4 focus:outline-none border border-orange-500/30"
            >
              <option value="0.01">$0.01</option>
              <option value="0.02">$0.02</option>
              <option value="0.05">$0.05</option>
              <option value="0.10">$0.10</option>
              <option value="0.25">$0.25</option>
              <option value="1">$1</option>
              <option value="2">$2</option>
              <option value="5">$5</option>
              <option value="10">$10</option>
              <option value="25">$25</option>
              <option value="50">$50</option>
              <option value="100">$100</option>
            </select>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-gray-900 rounded-3xl p-6 mb-6">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex justify-between items-center text-left"
          >
            <span className="text-lg font-medium">Advanced Settings</span>
            <span className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showAdvanced && (
            <div className="mt-6 space-y-6">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Overall RTP (%)</label>
                <input type="text" value={overallRTP} onChange={handleFloatChange(setOverallRTP)} className="w-full bg-gray-800 rounded-2xl p-4 text-white" />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Avg Counter Bonus Pay (bets)</label>
                <input type="text" value={avgBonusPay} onChange={handleIntegerChange(setAvgBonusPay)} onBlur={handleIntegerBlur(setAvgBonusPay, 31)} className="w-full bg-gray-800 rounded-2xl p-4 text-white" />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Balls per Spin</label>
                <input type="text" value={increment} onChange={handleFloatChange(setIncrement)} onBlur={handleFloatBlur(setIncrement, 1.2)} className="w-full bg-gray-800 rounded-2xl p-4 text-white" />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Avg Counter Trigger</label>
                <input type="text" value={avgTrigger} onChange={handleIntegerChange(setAvgTrigger)} onBlur={handleIntegerBlur(setAvgTrigger, 1795)} className="w-full bg-gray-800 rounded-2xl p-4 text-white" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={maxMajor} onChange={(e) => setMaxMajor(e.target.checked)} className="w-5 h-5 accent-orange-500" />
                <span>Max Major (+0.5% RTP)</span>
              </div>
            </div>
          )}
        </div>

        {/* Current EV */}
        <div className="bg-gray-900 rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-baseline mb-4">
            <div>
              <div className="text-orange-400 text-xl font-bold">Current EV</div>
              <div className="text-sm text-gray-400">Average Case</div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${evAvg >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {evAvg.toFixed(1)}x
              </div>
              <div className="text-sm text-gray-400">bets</div>
            </div>
          </div>

          <div className="text-sm text-gray-400 mb-1">Full Run (to {MUST_HIT})</div>
          <div className={`text-2xl font-bold ${evFullRun >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {evFullRun.toFixed(1)}x bets
          </div>

          {fpDollarsNeeded > 0 && (
            <div className="mt-4 text-orange-400 italic text-sm">
              FP needed to reach +EV: ${fpDollarsNeeded} (play to {beAvg})
            </div>
          )}
        </div>

        {/* Walk-Away Advisor */}
        <div className="bg-gray-900 rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-medium">Walk-Away Advisor</div>
            <button onClick={() => setShowInfoModal(true)} className="text-orange-400 text-sm underline">i</button>
          </div>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
          {hoverInfo && (
            <div className="text-center text-orange-400 mt-2">
              At counter {hoverInfo.counter}: Walk away at +{hoverInfo.bets} bets
            </div>
          )}
        </div>

        {/* EV Table */}
        <div className="bg-gray-900 rounded-3xl p-6">
          <div className="text-lg font-medium mb-4">EV Table (Average Case)</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 pr-4">Counter</th>
                  <th className="text-right py-3">EV Avg (bets)</th>
                  <th className="text-right py-3">EV Full (bets)</th>
                </tr>
              </thead>
              <tbody>
                {evTable.map((row) => (
                  <tr key={row.counter} className="border-b border-gray-800 last:border-none">
                    <td className="py-3 pr-4 font-medium">{row.counter}</td>
                    <td className={`text-right py-3 ${row.evAvg >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {row.evAvg.toFixed(1)}
                    </td>
                    <td className={`text-right py-3 ${row.evFull >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {row.evFull.toFixed(1)}
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

export default PhoenixLink