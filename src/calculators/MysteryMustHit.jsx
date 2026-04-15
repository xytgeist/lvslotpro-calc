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

const MUST_HIT = {
  minor: 50,
  major: 400,
}

function MysteryMustHit({ onBack }) {
  // Meters
  const [minor, setMinor] = useState(42)
  const [major, setMajor] = useState(385)

  const [betSize, setBetSize] = useState(25)
  const [denom, setDenom] = useState(1.00)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [overallRTP, setOverallRTP] = useState(91)
  const [minorRise, setMinorRise] = useState(0.45)
  const [majorRise, setMajorRise] = useState(0.20)
  const [maxMajor, setMaxMajor] = useState(false)

  const [evAvg, setEvAvg] = useState(0)
  const [evBest, setEvBest] = useState(0)
  const [currentRTP, setCurrentRTP] = useState(91)
  const [fpDollarsNeeded, setFpDollarsNeeded] = useState(0)
  const [isAlreadyPositive, setIsAlreadyPositive] = useState(false)

  const [scoutPercentage, setScoutPercentage] = useState(10)
  const [useBestCaseForFee, setUseBestCaseForFee] = useState(true)

  const [showInfoModal, setShowInfoModal] = useState(false)

  // Auto RTP based on denomination - same as StackUpPays
  useEffect(() => {
    let base = 91
    if (denom <= 0.02) base = 88
    else if (denom === 0.05) base = 88.5
    else if (denom === 0.10) base = 89
    else if (denom === 0.25) base = 90
    else if (denom >= 0.50) base = 92
    setOverallRTP(maxMajor ? base + 0.5 : base)
  }, [denom, maxMajor])

  const calculate = () => {
    const bet = Number(betSize) || 25
    const oRTP = overallRTP / 100
    const houseEdge = 1 - oRTP

    const minorRemaining = Math.max(0, MUST_HIT.minor - minor)
    const minorAvgToHit = minorRemaining / 2
    const minorCost = (minorAvgToHit / (minorRise / 100)) * bet
    const minorEV = minorAvgToHit - (minorCost * houseEdge)

    const majorRemaining = Math.max(0, MUST_HIT.major - major)
    const majorAvgToHit = majorRemaining / 2
    const majorCost = (majorAvgToHit / (majorRise / 100)) * bet
    const majorEV = majorAvgToHit - (majorCost * houseEdge)

    const totalEV = minorEV + majorEV
    const avgEV = totalEV / bet
    const bestEV = avgEV * 1.8

    setEvAvg(avgEV)
    setEvBest(bestEV)

    const combinedProgress = (minor / MUST_HIT.minor + major / MUST_HIT.major) / 2
    let finalRTP = overallRTP
    if (combinedProgress > 0.75) {
      finalRTP = 100 + (combinedProgress - 0.75) * 180
    } else if (combinedProgress > 0.4) {
      finalRTP = overallRTP + (combinedProgress - 0.4) * 60
    }
    setCurrentRTP(Math.round(finalRTP * 10) / 10)

    const alreadyPositive = avgEV >= 0
    setIsAlreadyPositive(alreadyPositive)

    if (!alreadyPositive) {
      setFpDollarsNeeded(Math.round(minorCost + majorCost))
    } else {
      setFpDollarsNeeded(0)
    }
  }

  useEffect(() => {
    calculate()
  }, [minor, major, betSize, denom, overallRTP, minorRise, majorRise, maxMajor])

  const getRecommendedWalkAway = () => {
    const progress = (minor / MUST_HIT.minor + major / MUST_HIT.major) / 2
    return Math.round(40 + progress * 120)
  }

  const chartData = {
    labels: Array.from({ length: 11 }, (_, i) => 30 + i * 5),
    datasets: [{
      label: 'Recommended Walk-Away',
      data: Array.from({ length: 11 }, (_, i) => Math.round(40 + i * 5 * 1.1)),
      borderColor: '#67e8f9',
      backgroundColor: 'rgba(103, 232, 249, 0.2)',
      tension: 0.4,
      borderWidth: 3.5,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'Avg Meter Progress %', color: '#d1d5db' }, ticks: { color: '#d1d5db' } },
      y: { title: { display: true, text: 'Walk-Away (Bets)', color: '#d1d5db' }, ticks: { color: '#d1d5db' }, min: 0 }
    },
    plugins: { legend: { display: false } }
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-12">
      {/* Title - exact same as StackUpPays */}
      <div className="flex items-center justify-center mb-8 pt-6">
        <div className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 mr-4 shadow-lg shadow-cyan-500/30">
          🎰
        </div>
        <h1
          className="text-[27px] font-black tracking-[-1px] text-cyan-100"
          style={{ textShadow: `0 0 12px #67e8f9, -2px -2px 0 #0ea5e9` }}
        >
          MUST HIT BY
        </h1>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* Meter Sliders */}
        <div className="bg-slate-900 p-5 rounded-3xl mb-6 space-y-6">
          {[
            { label: 'Minor', value: minor, setter: setMinor, max: MUST_HIT.minor, accent: 'accent-green-500', text: 'text-green-400' },
            { label: 'Major', value: major, setter: setMajor, max: MUST_HIT.major, accent: 'accent-purple-500', text: 'text-purple-400' },
          ].map((m, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1.5">
                <div className={`font-semibold ${m.text}`}>{m.label}</div>
                <div className="text-slate-300 font-mono text-lg font-bold">${m.value.toFixed(2)}</div>
              </div>
              <input
                type="range"
                min="0"
                max={m.max}
                step="0.01"
                value={m.value}
                onChange={(e) => m.setter(Number(e.target.value))}
                className={`w-full ${m.accent}`}
              />
            </div>
          ))}
        </div>

        {/* Bet Size + Denom */}
        <div className="bg-slate-900 p-5 rounded-3xl mb-6 grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-slate-400 text-xs mb-1">Bet Size</label>
            <div className="absolute left-4 top-10 text-2xl text-slate-400">$</div>
            <input
              type="text"
              value={betSize}
              onChange={(e) => setBetSize(e.target.value.replace(/[^0-9.]/g, ''))}
              onBlur={(e) => setBetSize(parseFloat(e.target.value) || 25)}
              className="w-full pl-8 p-3.5 bg-slate-800 rounded-2xl text-2xl font-bold text-center"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Denomination</label>
            <select 
              value={denom} 
              onChange={(e) => setDenom(parseFloat(e.target.value))} 
              className="w-full p-3.5 bg-slate-800 rounded-2xl text-2xl font-bold text-center"
            >
              {[0.01,0.02,0.05,0.10,0.25,1,2,5,10,25,50,100].map(d => (
                <option key={d} value={d}>${d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-slate-900 rounded-3xl mb-8 overflow-hidden">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)} 
            className="w-full flex justify-between items-center p-5 text-left hover:bg-slate-800"
          >
            <span className="font-semibold">Advanced Settings</span>
            <span className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showAdvanced && (
            <div className="p-5 pt-0 space-y-6 border-t border-slate-800">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Base Game RTP (%)</label>
                <input 
                  type="text" 
                  value={overallRTP} 
                  onChange={(e) => setOverallRTP(parseFloat(e.target.value) || 91)} 
                  className="w-full p-4 bg-slate-800 rounded-2xl text-center" 
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-slate-400 text-xs">Minor Rise Rate (% of bet)</label>
                  <span className="text-green-400 font-bold">{minorRise.toFixed(2)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.01" 
                  value={minorRise} 
                  onChange={(e) => setMinorRise(parseFloat(e.target.value))} 
                  className="w-full accent-green-500" 
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-slate-400 text-xs">Major Rise Rate (% of bet)</label>
                  <span className="text-purple-400 font-bold">{majorRise.toFixed(2)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.05" 
                  max="0.5" 
                  step="0.01" 
                  value={majorRise} 
                  onChange={(e) => setMajorRise(parseFloat(e.target.value))} 
                  className="w-full accent-purple-500" 
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Max Major Bonus</label>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setMaxMajor(false)} 
                    className={`flex-1 py-3 rounded-2xl ${!maxMajor ? 'bg-cyan-600 text-white' : 'bg-slate-800'}`}
                  >
                    No
                  </button>
                  <button 
                    onClick={() => setMaxMajor(true)} 
                    className={`flex-1 py-3 rounded-2xl ${maxMajor ? 'bg-cyan-600 text-white' : 'bg-slate-800'}`}
                  >
                    Yes (+0.5%)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current EV */}
        <div className="bg-slate-900 p-6 rounded-3xl mb-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-semibold text-cyan-400">Current EV</h2>
            <div className={`text-lg font-bold ${currentRTP >= 100 ? 'text-emerald-400' : 'text-red-400'}`}>
              {currentRTP.toFixed(1)}% RTP
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 p-5 rounded-2xl">
              <div className="text-slate-400 text-sm">Average Case</div>
              <div className={`text-4xl font-bold ${evAvg >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{evAvg.toFixed(2)}×</div>
              <div className="text-sm text-slate-300">${(evAvg * betSize).toFixed(0)}</div>
            </div>
            <div className="bg-slate-800 p-5 rounded-2xl">
              <div className="text-slate-400 text-sm">Best Case</div>
              <div className={`text-4xl font-bold ${evBest >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{evBest.toFixed(2)}×</div>
              <div className="text-sm text-slate-300">${(evBest * betSize).toFixed(0)}</div>
            </div>
          </div>

          <div className={`mt-6 p-4 rounded-2xl text-center font-bold ${isAlreadyPositive ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'}`}>
            {isAlreadyPositive ? '✅ PLAY — Strong +EV' : '❌ Still -EV — Keep Waiting'}
          </div>
        </div>

        {/* Acquisition Fee */}
        <div className="bg-slate-900 p-6 rounded-3xl mb-8">
          <h2 className="text-xl font-semibold text-cyan-400 mb-4">Acquisition Fee Calculator</h2>
          <div className="flex justify-between mb-4">
            <button onClick={() => setUseBestCaseForFee(false)} className={`flex-1 py-3 rounded-l-2xl text-sm font-semibold ${!useBestCaseForFee ? 'bg-cyan-600 text-white' : 'bg-slate-800'}`}>Average</button>
            <button onClick={() => setUseBestCaseForFee(true)} className={`flex-1 py-3 rounded-r-2xl text-sm font-semibold ${useBestCaseForFee ? 'bg-cyan-600 text-white' : 'bg-slate-800'}`}>Best Case</button>
          </div>

          <div className="bg-slate-800 rounded-2xl p-5 text-center mb-4">
            <div className="text-slate-400 text-sm">Expected Profit</div>
            <div className="text-4xl font-bold text-white">
              ${((useBestCaseForFee ? evBest : evAvg) * betSize).toFixed(0)}
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-5 text-center">
            <div className="text-slate-400 text-sm">Recommended Scout Fee</div>
            <div className="text-5xl font-black text-emerald-400">
              ${(((useBestCaseForFee ? evBest : evAvg) * betSize) * (scoutPercentage / 100)).toFixed(0)}
            </div>
            <div className="text-xs text-slate-400 mt-1">{scoutPercentage}% of expected profit</div>
          </div>
        </div>

        {/* Walk-Away Advisor */}
        <div className="bg-slate-900 p-6 rounded-3xl mb-8">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold text-cyan-400">Walk-Away Advisor</h2>
            <button onClick={() => setShowInfoModal(true)} className="text-2xl text-cyan-400">ℹ️</button>
          </div>
          <div className="h-72 bg-slate-950 rounded-2xl p-4 mb-6">
            <Line data={chartData} options={chartOptions} />
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl text-center text-lg">
            Recommended Walk-Away: <span className="text-emerald-400 font-bold">+{getRecommendedWalkAway()} bets</span>
          </div>
        </div>

        <div className="text-center text-slate-500 text-sm mt-12">
          Must Hit By • Mystery Progressive Edition
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-cyan-400 mb-4">Must-Hit-By Advisor</h3>
            <div className="text-slate-300 leading-relaxed">
              Calculates expected value assuming uniform hit distribution (Ainsworth-style). 
              Meter rise rates and base RTP are fully editable. Play when combined EV turns positive.
            </div>
            <button onClick={() => setShowInfoModal(false)} className="mt-8 w-full bg-cyan-600 py-4 rounded-2xl font-bold">Got it</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MysteryMustHit