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

function MHBCalculator({ onBack }) {
  const [currentViewCounter, setCurrentViewCounter] = useState(1200) // placeholder - we'll customize later
  const [betSize, setBetSize] = useState(25)
  const [denom, setDenom] = useState(1.00)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [overallRTP, setOverallRTP] = useState(91)

  // Placeholder states - we'll build real MHB logic next
  const [evAvg, setEvAvg] = useState(0)
  const [currentRTP, setCurrentRTP] = useState(91)
  const [fpDollarsNeeded, setFpDollarsNeeded] = useState(0)
  const [isAlreadyPositive, setIsAlreadyPositive] = useState(false)

  const [scoutPercentage, setScoutPercentage] = useState(10)
  const [showInfoModal, setShowInfoModal] = useState(false)

  // Keep Phoenix-style auto RTP for now
  useEffect(() => {
    let baseOverall = 91
    if (denom <= 0.02) baseOverall = 88
    else if (denom === 0.05) baseOverall = 88.25
    else if (denom === 0.10) baseOverall = 88.4
    else if (denom === 0.25) baseOverall = 88.6
    else if (denom > 1) baseOverall = 91.5
    setOverallRTP(baseOverall)
  }, [denom])

  // Temporary placeholder calculation
  useEffect(() => {
    // We'll replace this with real MHB math soon
    setCurrentRTP(overallRTP)
    setEvAvg(2.5) // placeholder
    setIsAlreadyPositive(true)
  }, [currentViewCounter, betSize, overallRTP])

  return (
    <div className="min-h-screen bg-gray-950 pb-12">
      <div className="max-w-lg mx-auto px-4 pt-6">

        {/* Title block - matching your current Phoenix style */}
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="text-[52px] leading-none text-purple-400 hover:text-purple-300 -mt-1 mr-4 font-light active:opacity-70"
          >
            ‹
          </button>

          <div className="flex items-center flex-1 justify-center gap-3">
            <div className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600">
              {/* We'll add a real MHB icon later - placeholder for now */}
              <span className="text-4xl">🎰</span>
            </div>
            <h1
              className="text-[33px] font-black tracking-[-1.6px] text-white"
              style={{
                textShadow: `-2px -2px 0 #7e22ce, 2px -2px 0 #7e22ce, -2px 2px 0 #7e22ce, 2px 2px 0 #7e22ce`
              }}
            >
              MHB CALCULATOR
            </h1>
          </div>

          <div className="w-12" />
        </div>

        {/* Rest of the UI is still Phoenix structure for now - we'll customize next */}
        <div className="bg-gray-900 p-5 rounded-3xl mb-6">
          <div className="text-center text-purple-400 text-sm mb-8">
            Must-Hit-By Progressive Analyzer<br />
            <span className="text-purple-300/70">Coming soon — building from Phoenix base</span>
          </div>
        </div>

        <div className="text-center text-slate-500 text-sm mt-12">
          MHB Calculator • Purple Edition
        </div>
      </div>

      {/* Info Modal placeholder */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-3xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-purple-400 mb-4">MHB Calculator</h3>
            <button onClick={() => setShowInfoModal(false)} className="mt-8 w-full bg-purple-600 py-4 rounded-2xl font-bold">Got it</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MHBCalculator