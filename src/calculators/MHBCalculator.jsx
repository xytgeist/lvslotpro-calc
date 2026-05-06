import { useState, useEffect, useMemo } from 'react'
import CalculatorDisclaimer from '../components/CalculatorDisclaimer'

/** Example defaults per maker & cap—floor math still wins over these numbers. */
const MHB_PRESETS = {
  ainsworth: {
    500: { current: 475, meterRise: 2.5, reset: 350, rtp: 85 },
    /** Mid cap: interpolated between 500 and 10k tiers (illustrative). */
    5000: { current: 4894, meterRise: 4.46842, reset: 4446, rtp: 85 },
    10000: { current: 9802, meterRise: 6.66666, reset: 9000, rtp: 85 },
  },
  ags: {
    500: { current: 488, meterRise: 2.72, reset: 365, rtp: 87 },
    /** River Dragons–style bank: meter $3.75 per $0.01, reset $4k (verify glass; some installs show 4995 cap). */
    5000: { current: 4911.76, meterRise: 3.75, reset: 4000, rtp: 87 },
  },
  igt: {
    500: { current: 462, meterRise: 2.35, reset: 338, rtp: 85 },
    5000: { current: 4820, meterRise: 4.33, reset: 4050, rtp: 85 },
    10000: { current: 9740, meterRise: 6.42, reset: 8850, rtp: 85 },
  },
}

/** AGS does not use a 10k cap in-app; 10k coerces to 5k for presets and math. */
function effectiveCap(manufacturer, mustHitBy) {
  const v = Number(mustHitBy) || 500
  if (manufacturer === 'ags' && v === 10000) return 5000
  return v
}

function presetFor(manufacturer, mustHitBy) {
  const m = MHB_PRESETS[manufacturer] || MHB_PRESETS.ainsworth
  const cap = effectiveCap(manufacturer, mustHitBy)
  return m[cap] || m[500]
}

/** en-US currency: $10,000 / $4,911.76 */
function formatUsd(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

/** Money Storm Deluxe–inspired: red plank frames, storm backdrop */
const woodPanel =
  'rounded-2xl border border-amber-950/55 bg-gradient-to-b from-[#5a1a20] via-[#3f1116] to-[#2a0b10] shadow-[inset_0_1px_0_rgba(255,215,140,0.1),0_12px_32px_rgba(0,0,0,0.55)] ring-1 ring-black/60'

const plankInset =
  'rounded-xl border border-black/45 bg-[#120709] shadow-[inset_0_2px_8px_rgba(0,0,0,0.65)]'

const fieldFocus =
  'focus:outline-none focus:ring-2 focus:ring-cyan-400/55 focus:border-cyan-500/40'

const labelStorm =
  'text-[11px] font-bold uppercase tracking-[0.12em] text-amber-100/90'

const glowingValue = 'font-black text-white [text-shadow:0_0_14px_rgba(250,250,250,0.35),0_2px_0_rgba(0,0,0,0.8)]'

const glowingYellow = '[text-shadow:0_0_16px_rgba(250,204,21,0.55),0_2px_0_rgba(0,0,0,0.85)]'
const glowingGreen = '[text-shadow:0_0_14px_rgba(74,222,128,0.5),0_2px_0_rgba(0,0,0,0.85)]'
const glowingSky = '[text-shadow:0_0_14px_rgba(56,189,248,0.5),0_2px_0_rgba(0,0,0,0.85)]'

function MHBCalculator({ onBack }) {
  const [manufacturer, setManufacturer] = useState('ainsworth')

  // Main fields
  const [current, setCurrent] = useState(475)
  const [mustHitBy, setMustHitBy] = useState(500)
  const [jpMeterFocused, setJpMeterFocused] = useState(false)
  const [jpMeterDraft, setJpMeterDraft] = useState('')

  // Advanced Settings
  const [overallRTP, setOverallRTP] = useState(85)
  const [meterRise, setMeterRise] = useState(2.50)
  const [resetValue, setResetValue] = useState(350)
  const [useMidpoint, setUseMidpoint] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const activePreset = useMemo(() => presetFor(manufacturer, mustHitBy), [manufacturer, mustHitBy])

  // Outputs
  const [ev, setEv] = useState(0)
  const [evExact, setEvExact] = useState(0)
  const [breakeven, setBreakeven] = useState(0)
  const [breakevenExact, setBreakevenExact] = useState(0)
  const [coinInExpected, setCoinInExpected] = useState(0)
  const [jpContribution, setJpContribution] = useState(0)
  const [exposure, setExposure] = useState(0)
  const [isPositive, setIsPositive] = useState(false)

  // Load maker + cap bundle (current, rise, reset, RTP defaults)
  useEffect(() => {
    const p = presetFor(manufacturer, mustHitBy)
    setCurrent(p.current)
    setMeterRise(p.meterRise)
    setResetValue(p.reset)
    setOverallRTP(p.rtp)
  }, [manufacturer, mustHitBy])

  // Keep select value valid: AGS has no 10k tier.
  useEffect(() => {
    if (manufacturer === 'ags' && mustHitBy === 10000) {
      setMustHitBy(5000)
    }
  }, [manufacturer, mustHitBy])

  // AGS defaults to full run (no midpoint); other makers default to midpoint.
  useEffect(() => {
    setUseMidpoint(manufacturer !== 'ags')
  }, [manufacturer])

  const calculate = () => {
    const p = presetFor(manufacturer, mustHitBy)
    const rtp = (Number(overallRTP) || p.rtp) / 100
    const currentVal = Number(current) || p.current
    const mhb = effectiveCap(manufacturer, mustHitBy)
    const riseDollars = Number(meterRise) || p.meterRise
    const resetVal = Number(resetValue) || p.reset

    if (mhb <= currentVal) {
      setEv(999)
      setEvExact(999)
      setBreakeven(currentVal)
      setBreakevenExact(currentVal)
      setCoinInExpected(0)
      setJpContribution(0)
      setExposure(0)
      setIsPositive(true)
      return
    }

    const target = useMidpoint 
      ? currentVal + (mhb - currentVal) * 0.5 
      : mhb

    const dollarDistance = target - currentVal
    const incrementsNeeded = dollarDistance / 0.01
    const coinInToTarget = incrementsNeeded * riseDollars
    const expectedLoss = coinInToTarget * (1 - rtp)

    const finalEV = target - expectedLoss

    const houseEdge = 1 - rtp
    let breakevenCurrent = useMidpoint
      ? mhb * (100 * riseDollars * houseEdge - 1) / (100 * riseDollars * houseEdge + 1)
      : mhb - (riseDollars * 0.01 / houseEdge)

    const breakevenRounded = Math.ceil(breakevenCurrent)

    const jpContrib = 0.4 * (mhb + resetVal) / (mhb - resetVal)

    const fullIncrements = (mhb - currentVal) / 0.01
    const maxExposureDollars = fullIncrements * riseDollars * houseEdge

    setEv(Math.round(finalEV))
    setEvExact(Number(finalEV.toFixed(2)))
    setBreakeven(breakevenRounded)
    setBreakevenExact(Number(breakevenCurrent.toFixed(2)))
    setCoinInExpected(Math.round(coinInToTarget))
    setJpContribution(Number(jpContrib.toFixed(2)))
    setExposure(Math.round(maxExposureDollars))
    setIsPositive(finalEV >= 0)
  }

  useEffect(() => {
    calculate()
  }, [current, mustHitBy, meterRise, resetValue, overallRTP, useMidpoint, manufacturer])

  // Input handlers
  const handleIntegerChange = (setter, defaultVal) => (e) => {
    setter(e.target.value.replace(/[^0-9]/g, ''))
  }
  const handleIntegerBlur = (setter, defaultVal) => (e) => {
    let val = parseInt(e.target.value, 10)
    setter(isNaN(val) ? defaultVal : val)
  }
  const handleFloatChange = (setter, defaultVal) => (e) => {
    setter(e.target.value.replace(/[^0-9.]/g, ''))
  }
  const handleFloatBlur = (setter, defaultVal) => (e) => {
    let val = parseFloat(e.target.value)
    setter(isNaN(val) ? defaultVal : val)
  }

  const jpMeterDisplay = jpMeterFocused ? jpMeterDraft : formatUsd(current)

  const handleJpMeterFocus = () => {
    setJpMeterFocused(true)
    const n = Number(current)
    setJpMeterDraft(Number.isFinite(n) ? String(n) : '')
  }

  const handleJpMeterChange = (e) => {
    let v = e.target.value.replace(/[^0-9.]/g, '')
    const dot = v.indexOf('.')
    if (dot !== -1) {
      v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '')
    }
    setJpMeterDraft(v)
    if (v === '' || v === '.') return
    const num = parseFloat(v)
    if (!Number.isNaN(num)) setCurrent(num)
  }

  const handleJpMeterBlur = () => {
    const n = parseFloat(jpMeterDraft)
    if (jpMeterDraft === '' || jpMeterDraft === '.' || Number.isNaN(n)) {
      setCurrent(activePreset.current)
    } else {
      setCurrent(n)
    }
    setJpMeterFocused(false)
    setJpMeterDraft('')
  }

  return (
    <div className="relative min-h-screen pb-12 overflow-x-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <img
          src="/guides/mhb/mhb-msd-bg.webp"
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-[0.22]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070b14] via-[#0f0a28]/93 to-[#051018]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/35 via-transparent to-cyan-950/25" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6">

        {/* Title — art from user-provided Money Storm Deluxe marquee */}
        <div className="flex items-start mb-6">
          <button
            type="button"
            onClick={onBack}
            className="text-[52px] leading-none text-cyan-300 hover:text-cyan-200 -mt-1 mr-3 font-light active:opacity-70 [text-shadow:0_0_12px_rgba(34,211,238,0.45)] touch-manipulation"
          >
            ‹
          </button>
          <div className="flex flex-1 items-center gap-3 min-w-0">
            <img
              src="/guides/mhb/mhb-msd-icon.webp"
              alt=""
              className="h-[3.85rem] w-[3.85rem] shrink-0 rounded-2xl object-cover ring-2 ring-amber-900/70 shadow-xl shadow-black/60"
            />
            <div className="min-w-0 pt-0.5">
              <div className="inline-block rounded-md border border-red-950/70 bg-[#450a0a] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-yellow-300 shadow-inner shadow-black/50">
                IGT Mystery MHB style
              </div>
              <h1 className="mt-1 font-black uppercase leading-[1.05] tracking-tight text-[22px] text-white xs:text-[24px] sm:text-[26px] [text-shadow:0_3px_0_#064e3b,0_-1px_0_rgba(0,0,0,0.5)]">
                <span className="bg-gradient-to-b from-emerald-300 to-green-600 bg-clip-text text-transparent [-webkit-background-clip:text]">
                  Must Hit By
                </span>{' '}
                <span className="bg-gradient-to-br from-indigo-200 via-purple-400 to-fuchsia-500 bg-clip-text [-webkit-background-clip:text] [text-shadow:0_2px_12px_rgba(168,85,247,0.45)]">
                  Calculator
                </span>
              </h1>
              <p className="font-semibold uppercase tracking-[0.2em] text-[10px] text-sky-200/85">
                After Money Storm Deluxe · Verify glass
              </p>
            </div>
          </div>
          <div className="w-10 shrink-0" />
        </div>

        {/* Main Inputs */}
        <div className={`p-5 ${woodPanel}`}>
          <div className="mb-4">
            <label className={`block mb-2 ${labelStorm}`}>Manufacturer</label>
            <div className={plankInset}>
              <select
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className={`w-full cursor-pointer bg-transparent p-4 text-center text-lg font-black uppercase tracking-wide text-yellow-300 ${fieldFocus}`}
              >
                <option value="ainsworth" className="bg-[#1a0608] text-yellow-50">Ainsworth</option>
                <option value="ags" className="bg-[#1a0608] text-yellow-50">AGS</option>
                <option value="igt" className="bg-[#1a0608] text-yellow-50">IGT</option>
              </select>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-amber-200/65">
              Load example meter rise, reset, and RTP—always verify on the glass for your revision.
              {manufacturer === 'ags' ? (
                <span className="block mt-1 opacity-95">AGS uses {formatUsd(500)} / {formatUsd(5000)} caps only (no 10k).</span>
              ) : null}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block mb-2 ${labelStorm}`}>JP meter (current)</label>
              <div className={plankInset}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={jpMeterDisplay}
                  onFocus={handleJpMeterFocus}
                  onChange={handleJpMeterChange}
                  onBlur={handleJpMeterBlur}
                  className={`${glowingValue} text-center ${fieldFocus} w-full bg-transparent p-3 text-3xl`}
                />
              </div>
            </div>

            <div>
              <label className={`block mb-2 ${labelStorm}`}>Must hit by</label>
              <div className={plankInset}>
                <select
                  value={mustHitBy}
                  onChange={(e) => setMustHitBy(Number(e.target.value))}
                  className={`w-full cursor-pointer bg-transparent py-4 text-center font-black ${fieldFocus} text-3xl uppercase text-white ${glowingSky}`}
                >
                  <option value={500} className="bg-[#1a0608] text-yellow-50">{formatUsd(500)}</option>
                  <option value={5000} className="bg-[#1a0608] text-yellow-50">{formatUsd(5000)}</option>
                  {manufacturer !== 'ags' ? (
                    <option value={10000} className="bg-[#1a0608] text-yellow-50">{formatUsd(10000)}</option>
                  ) : null}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className={`mt-6 overflow-hidden ${woodPanel}`}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between p-5 text-left font-black uppercase tracking-wider text-yellow-300 transition hover:bg-black/25"
          >
            <span>Advanced settings</span>
            <span className={`text-cyan-300 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showAdvanced && (
            <div className="space-y-5 border-t border-black/35 p-5 pt-5">
              <div>
                <label className={`block mb-2 ${labelStorm}`}>RTP %</label>
                <div className={plankInset}>
                  <input
                    type="text"
                    value={overallRTP}
                    onChange={handleFloatChange(setOverallRTP, activePreset.rtp)}
                    onBlur={handleFloatBlur(setOverallRTP, activePreset.rtp)}
                    className={`${glowingValue} w-full bg-transparent p-4 text-center text-2xl ${fieldFocus}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-2 ${labelStorm}`}>Meter rise ($ per $0.01)</label>
                <div className={plankInset}>
                  <input
                    type="text"
                    value={meterRise}
                    onChange={handleFloatChange(setMeterRise, activePreset.meterRise)}
                    onBlur={handleFloatBlur(setMeterRise, activePreset.meterRise)}
                    className={`${glowingValue} w-full bg-transparent p-4 text-center text-2xl ${fieldFocus}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-2 ${labelStorm}`}>Reset value</label>
                <div className={plankInset}>
                  <input
                    type="text"
                    value={resetValue}
                    onChange={handleIntegerChange(setResetValue, activePreset.reset)}
                    onBlur={handleIntegerBlur(setResetValue, activePreset.reset)}
                    className={`${glowingValue} w-full bg-transparent p-4 text-center text-2xl ${fieldFocus}`}
                  />
                </div>
              </div>

              <label className={`flex cursor-pointer items-center gap-3 touch-manipulation border border-black/30 ${plankInset} p-4`}>
                <input
                  type="checkbox"
                  checked={useMidpoint}
                  onChange={(e) => setUseMidpoint(e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-cyan-400"
                />
                <span className="text-[13px] font-semibold leading-snug text-amber-100/90">
                  Use midpoint for EV &amp; breakeven (typical scouting shortcut)
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Outputs — tier hues like Hurricane / Tornado / Whirlwind */}
        <div className={`mt-8 p-6 ${woodPanel}`}>
          <div className="mx-auto mb-6 max-w-xs rounded-lg border border-red-950 bg-[#3f0d0e] px-4 py-2 text-center shadow-lg shadow-black/50">
            <h2 className="font-black uppercase tracking-[0.2em] text-sm text-yellow-300 [text-shadow:0_0_10px_rgba(253,224,71,0.45)]">
              MHB Analysis
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className={`p-5 ${plankInset}`}>
              <div className={`${labelStorm} mb-2 text-yellow-200`}>Expected value</div>
              <div
                className={`text-[2.125rem] font-black leading-none ${ev >= 0 ? `text-yellow-300 ${glowingYellow}` : 'text-red-400 [text-shadow:0_0_14px_rgba(248,113,113,0.45)]'}`}
              >
                ${ev.toFixed(0)}
              </div>
              <div className={`mt-1 text-xs tracking-wide ${ev >= 0 ? 'text-yellow-200/65' : 'text-red-300/65'}`}>
                ${evExact.toFixed(2)}
              </div>
            </div>
            <div className={`p-5 ${plankInset}`}>
              <div className={`${labelStorm} mb-2 text-green-200`}>Breakeven entry</div>
              <div className={`text-[2.125rem] font-black text-green-300 ${glowingGreen}`}>{breakeven}</div>
              <div className="mt-1 text-xs tracking-wide text-green-300/65">${breakevenExact.toFixed(2)}</div>
            </div>
            <div className={`p-5 ${plankInset}`}>
              <div className={`${labelStorm} mb-2 text-sky-200`}>Coin-in expected</div>
              <div className={`text-[2.125rem] font-black text-sky-200 ${glowingSky}`}>${coinInExpected}</div>
            </div>
            <div className={`p-5 ${plankInset}`}>
              <div className={`${labelStorm} mb-2 text-fuchsia-200`}>JP contribution</div>
              <div className={`${glowingValue} text-[2.125rem] text-fuchsia-200`}>+{jpContribution}%</div>
            </div>
          </div>

          <div className={`mt-6 p-6 text-center ${plankInset} border-[#5c0808]`}>
            <div className={`${labelStorm} text-red-200`}>Max exposure (full run)</div>
            <div className="mt-1 text-3xl font-black text-orange-400 [text-shadow:0_0_18px_rgba(251,146,60,0.45)]">
              ${exposure.toLocaleString()}
            </div>
          </div>

          <div
            className={`mt-6 border-4 border-double border-yellow-900/60 p-5 text-center text-lg font-black uppercase tracking-wide shadow-black/70 ${
              isPositive
                ? 'bg-gradient-to-b from-green-950/95 to-emerald-950 text-emerald-300 [text-shadow:0_0_12px_rgba(52,211,153,0.4)]'
                : 'bg-gradient-to-b from-red-950/95 to-orange-950/90 text-orange-100 [text-shadow:0_0_12px_rgba(251,146,60,0.35)]'
            }`}
          >
            {isPositive ? '+EV • Play reads favorable' : 'Still −EV • Keep waiting'}
          </div>
        </div>

        <CalculatorDisclaimer className="mt-8 text-slate-300/85" />

        <div className="mt-6 text-center text-[11px] uppercase tracking-[0.15em] text-slate-500">
          Decorative theme · Not affiliated with IGT®
        </div>
      </div>
    </div>
  )
}

export default MHBCalculator