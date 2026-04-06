  return (
    <div className="min-h-screen bg-gray-950 pb-12">
      {/* Clean Fixed Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-gray-950 border-b border-gray-800 z-50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => {}} 
            className="text-4xl text-orange-400 hover:text-orange-300 p-1 -ml-1"
          >
            ☰
          </button>

          <div className="flex items-center gap-3">
            <img 
              src="/phoenix-link-logo.png" 
              alt="Phoenix Link" 
              className="w-9 h-9 flex-shrink-0 rounded-xl object-contain" 
            />
            <h1 
              className="text-[22px] font-black tracking-[-1px] text-black leading-none"
              style={{
                textShadow: `-1.5px -1.5px 0 #f97316, 1.5px -1.5px 0 #f97316, -1.5px 1.5px 0 #f97316, 1.5px 1.5px 0 #f97316`
              }}
            >
              PHOENIX LINK<br />EV CALC
            </h1>
          </div>

          <div className="w-10" />
        </div>
      </div>

      {/* Main Content with padding for fixed bar */}
      <div className="pt-20 max-w-lg mx-auto px-4">
        {/* Counter */}
        <div className="bg-gray-900 p-3 rounded-3xl mb-4 space-y-3">
          <div>
            <label className="block text-gray-400 mb-1 text-xs">Counter</label>
            <input type="text" inputMode="numeric" value={currentX} onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setCurrentX(val === '' ? '' : parseInt(val, 10));
            }} className="w-full p-3 bg-gray-800 rounded-2xl text-2xl font-bold text-center border-2 border-orange-500" />
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

        {/* Current EV */}
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

        {/* Acquisition Fee Calculator */}
        <div className="bg-gray-900 p-6 rounded-3xl mb-6">
          <h2 className="text-xl font-semibold mb-4 text-orange-400">Acquisition Fee Calculator</h2>
          <p className="text-gray-400 text-sm mb-5">Fair finder's fee for scout</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-400 mb-1 text-xs">EV Basis</label>
              <div className="flex bg-gray-800 rounded-2xl p-1">
                <button onClick={() => setUseFullRunForFee(false)} className={`flex-1 py-3 text-sm font-semibold rounded-[14px] ${!useFullRunForFee ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>Average</button>
                <button onClick={() => setUseFullRunForFee(true)} className={`flex-1 py-3 text-sm font-semibold rounded-[14px] ${useFullRunForFee ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>Full Run</button>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-400 text-xs">Scout Share</label>
                <span className="font-bold text-orange-400 text-lg">{scoutPercentage}%</span>
              </div>
              <div className="bg-gray-800 rounded-2xl px-4 py-3">
                <input type="range" min="10" max="15" step="1" value={scoutPercentage} onChange={(e) => setScoutPercentage(Number(e.target.value))} className="w-full accent-orange-500" />
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-5 text-center mb-4">
            <div className="text-gray-400 text-sm mb-1">Expected Profit</div>
            <div className="text-4xl font-bold text-white">
              ${((useFullRunForFee ? evFullRun : evAvg) * betSize).toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">
              {useFullRunForFee ? 'Full Run EV' : 'Average Case EV'}
            </div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-5 text-center">
            <div className="text-gray-400 text-sm mb-1">Recommended Finder's Fee</div>
            <div className="text-5xl font-black text-green-400">
              ${(((useFullRunForFee ? evFullRun : evAvg) * betSize) * (scoutPercentage / 100)).toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 mt-1">to scout</div>
          </div>
        </div>

        {/* Walk-Away Advisor */}
        <div className="bg-gray-900 p-6 rounded-3xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-orange-400">Walk-Away Advisor</h2>
            <button onClick={() => setShowInfoModal(true)} className="w-8 h-8 flex items-center justify-center text-orange-400 hover:text-orange-300 transition-colors text-xl">ℹ️</button>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 mb-6 flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-gray-400 mb-1 text-xs">Test Counter</label>
              <input type="text" inputMode="numeric" value={testCounter} onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setTestCounter(val === '' ? '' : parseInt(val, 10));
              }} className="w-full p-3 bg-gray-700 rounded-2xl text-2xl font-bold text-center border border-orange-400" />
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Walk-away</div>
              <div className="text-4xl font-bold text-green-400">+{testCounter ? getRecommendedWalkAway(testCounter) : 0} bets</div>
              <div className="text-sm text-green-400">
                ${((testCounter ? getRecommendedWalkAway(testCounter) : 0) * betSize).toFixed(0)}
              </div>
            </div>
          </div>
          <div className="h-80 bg-gray-950 rounded-2xl p-4 border border-gray-700 mb-4 relative">
            <Line data={chartData} options={chartOptions} />
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 text-center text-sm min-h-[52px] flex items-center justify-center">
            {hoverCounter !== null ? (
              <>At <span className="text-orange-400 font-semibold mx-1">{hoverCounter}</span> walk away around <span className="text-green-400 font-bold mx-1">+{hoverWalkAway} bets</span> <span className="text-green-400">(${ (hoverWalkAway * betSize).toFixed(0) })</span></>
            ) : (
              <>At <span className="text-orange-400 font-semibold mx-1">{currentX}</span> walk away around <span className="text-green-400 font-bold mx-1">+{getRecommendedWalkAway(currentX)} bets</span> <span className="text-green-400">(${ (getRecommendedWalkAway(currentX) * betSize).toFixed(0) })</span></>
            )}
          </div>
        </div>

        {/* EV Table */}
        <div className="bg-gray-900 p-6 rounded-3xl">
          <h2 className="text-xl font-semibold mb-5 text-orange-400">EV Table — 1150 to 1875 (+25)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[540px]">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-4 px-4 text-gray-400 font-medium w-[92px]">Counter</th>
                  <th className="py-4 px-3 text-gray-400 font-medium w-[155px]">EV Avg (Bets | $)</th>
                  <th className="py-4 px-5 text-gray-400 font-medium">Full Run (to 1888) (Bets | $)</th>
                </tr>
              </thead>
              <tbody>
                {evTable.map((row, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="py-4 px-4 font-semibold">{row.counter}</td>
                    <td className={`py-4 px-3 font-bold ${row.avgEV >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {row.avgEV.toFixed(1)} | ${row.avgDollar.toFixed(0)}
                    </td>
                    <td className={`py-4 px-5 font-bold ${row.fullEV >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {row.fullEV.toFixed(1)} | ${row.fullDollar.toFixed(0)}
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