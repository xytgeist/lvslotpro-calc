import { useState, useEffect } from 'react'

function MHBCalculator({ onBack }) {
  // Main fields
  const [current, setCurrent] = useState(9350)      // Default JP Meter
  const [mustHitBy, setMustHitBy] = useState(10000) // Default MHB
  const [denom, setDenom] = useState(1.00)

  // Advanced Settings
  const [overallRTP, setOverallRTP] = useState(91)
  const [meterRise, setMeterRise] = useState(6.666666) // $ per increment (default)
  const [useMidpoint, setUseMidpoint] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Outputs
  const [ev, setEv] = useState(0)
  const [breakeven, setBreakeven] = useState(0)
  const [coinInRequired, setCoinInRequired] = useState(0)
  const [jpContribution, setJpContribution] = useState(0)
  const [exposure, setExposure] = useState(0)
  const [isPositive, setIsPositive] = useState(false)

  // Auto RTP based on denomination
  useEffect(() => {
    let base = 91
    if (denom <= 0.02) base = 88
    else if (denom === 0.05) base = 88.5
    else if (denom === 0.10) base = 89
    else if (denom === 0.25) base = 90
    else if (denom >= 1) base = 92
    setOverallRTP(base)
  }, [denom])

  // Main MHB Calculation
  const calculate = () => {
    const baseRTP = overallRTP / 100
    const currentVal = Number(current) || 9350
    const mhb = Number(mustHitBy) || 10000
    const riseDollars = Number(meterRise) || 6.666666

    if (mhb <= currentVal) {
      setEv(999)
      setBreakeven(currentVal)
      setCoinInRequired(0)
      setJpContribution(0)
      setExposure(0)
      setIsPositive(true)
      return
    }

    // Spins to hit = dollar distance / dollar rise per spin
    const dollarDistance = mhb - currentVal
    const spinsToHit = dollarDistance / riseDollars

    // Midpoint logic
    const midpoint = useMidpoint 
      ? currentVal + (mhb - currentVal) * 0.5 
      : mhb

    const spinsAvg = (midpoint - currentVal) / riseDollars
    const spinsFull = spinsToHit

    const houseEdge = 1 - baseRTP
    const avgEV = 1 - houseEdge * spinsAvg
    const fullEV = 1 - houseEdge * spinsFull

    const finalEV = useMidpoint ? avgEV : fullEV

    // Breakeven entry
    const beEntry = Math.round(mhb - (1 / houseEdge) * riseDollars)

    // Coin in required to reach breakeven
    const coinInToBE = Math.max(0, Math.round((beEntry - currentVal) / riseDollars * denom * 100)) // convert to coins

    // JP contribution to RTP
    const jpContrib = ((1 / spinsToHit) * 100).toFixed(2)

    // Max exposure (full run)
    const maxExposureBets = Math.round(spinsFull * houseEdge)

    setEv(Number(finalEV.toFixed(2)))
    setBreakeven(beEntry)
    setCoinInRequired(coinInToBE)
    setJpContribution(Number(jpContrib))
    setExposure(maxExposureBets)
    setIsPositive(finalEV >= 0)
  }

  useEffect(() => {
    calculate()
  }, [current, mustHitBy, meterRise, denom, overallRTP, useMidpoint])

  return (
    <div className="min-h-screen bg-gray-950 pb-12">
      <div className="max-w-lg mx-auto px-4 pt-6">

        {/* Title */}
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="text-[52px] leading-none text-purple-400 hover:text-purple-300 -mt-1 mr-4 font-light active:opacity-70"
          >
            ‹
          </button>

          <div className="flex items-center flex-1 justify-center gap-3">
            <div className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex-shrink-0">
              <span className="text-4xl">🎰</span>
            </div>
            <h1
              className="font-black text-white tracking-[-1.8px] 
                         text-[26px] xs:text-[27px] sm:text-[29px] md:text-[32px] lg:text-[33px]"
              style={{
                textShadow: `-2px -2px 0 #7e22ce, 2px -2px 0 #7e22ce, -2px 2px 0 #7e22ce, 2px 2px 0 #7e22ce`
              }}
            >
              MHB CALCULATOR
            </h1>
          </div>

          <div className="w-12" />
        </div>

        {/* Main Inputs */}
        <div className="space-y-6">
          <div className="bg-gray-900 p-5 rounded-3xl space-y-5">
            <div>
              <label className="block text-gray-400 text-xs mb-1">JP Meter (Current)</label>
              <input
                type="text"
                inputMode="numeric"
                value={current}
                onChange={(e) => setCurrent(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={(e) => setCurrent(parseInt(e.target.value) || 9350)}
                className="w-full p-4 bg-gray-800 rounded-2xl text-3xl font-bold text-center text-purple-300"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs mb-1">Must Hit By</label>
              <input
                type="text"
                inputMode="numeric"
                value={mustHitBy}
                onChange={(e) => setMustHitBy(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={(e) => setMustHitBy(parseInt(e.target.value) || 10000)}
                className="w-full p-4 bg-gray-800 rounded-2xl text-3xl font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs mb-1">Denomination</label>
              <select 
                value={denom} 
                onChange={(e) => setDenom(parseFloat(e.target.value))}
                className="w-full p-4 bg-gray-800 rounded-2xl text-2xl font-bold text-center"
              >
                {[0.01,0.02,0.05,0.10,0.25,1,2,5,10,25,50,100].map(d => (
                  <option key={d} value={d}>${d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-gray-900 rounded-3xl overflow-hidden">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)} 
              className="w-full flex justify-between items-center p-5 text-left hover:bg-gray-800"
            >
              <span className="font-semibold text-purple-300">Advanced Settings</span>
              <span className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {showAdvanced && (
              <div className="p-5 pt-0 space-y-6 border-t border-gray-800">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Overall RTP (%)</label>
                  <input 
                    type="text" 
                    value={overallRTP} 
                    onChange={(e) => setOverallRTP(parseFloat(e.target.value) || 91)} 
                    className="w-full p-4 bg-gray-800 rounded-2xl text-center text-2xl font-bold" 
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs mb-1">Meter Rise ($ per increment)</label>
                  <input 
                    type="text" 
                    value={meterRise} 
                    onChange={(e) => setMeterRise(e.target.value.replace(/[^0-9.]/g, ''))} 
                    onBlur={(e) => setMeterRise(parseFloat(e.target.value) || 6.666666)} 
                    className="w-full p-4 bg-gray-800 rounded-2xl text-center text-2xl font-bold" 
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">Default: $6.666666 (for $0.01 increments)</p>
                </div>

                <div className="flex items-center justify-between bg-gray-800 p-4 rounded-2xl">
                  <span className="text-gray-300">Use Midpoint for EV Calculation</span>
                  <button
                    onClick={() => setUseMidpoint(!useMidpoint)}
                    className={`px-6 py-2 rounded-xl font-semibold ${useMidpoint ? 'bg-purple-600 text-white' : 'bg-gray-700'}`}
                  >
                    {useMidpoint ? 'YES' : 'NO'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Outputs */}
        <div className="mt-8 bg-gray-900 p-6 rounded-3xl">
          <h2 className="text-xl font-semibold text-purple-400 mb-6 text-center">MHB Analysis</h2>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-800 p-5 rounded-2xl">
              <div className="text-gray-400 text-sm">Expected Value</div>
              <div className={`text-4xl font-bold ${ev >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {ev.toFixed(2)}×
              </div>
            </div>

            <div className="bg-gray-800 p-5 rounded-2xl">
              <div className="text-gray-400 text-sm">Breakeven Entry</div>
              <div className="text-4xl font-bold text-purple-300">{breakeven}</div>
            </div>

            <div className="bg-gray-800 p-5 rounded-2xl">
              <div className="text-gray-400 text-sm">Coin In Required</div>
              <div className="text-4xl font-bold text-amber-400">${coinInRequired}</div>
            </div>

            <div className="bg-gray-800 p-5 rounded-2xl">
              <div className="text-gray-400 text-sm">JP Contribution</div>
              <div className="text-4xl font-bold text-purple-300">+{jpContribution}%</div>
            </div>
          </div>

          <div className="mt-6 bg-gray-800 p-5 rounded-2xl text-center">
            <div className="text-gray-400 text-sm">Max Exposure (Full Run)</div>
            <div className="text-3xl font-bold text-red-400">{exposure} bets</div>
          </div>

          <div className={`mt-6 p-4 rounded-2xl text-center font-bold text-lg ${isPositive ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'}`}>
            {isPositive ? '✅ +EV — PLAY THIS ONE' : '❌ Still -EV — Keep Waiting'}
          </div>
        </div>

        <div className="text-center text-slate-500 text-sm mt-12">
          MHB Calculator • Purple Edition
        </div>
      </div>
    </div>
  )
}

export default MHBCalculator