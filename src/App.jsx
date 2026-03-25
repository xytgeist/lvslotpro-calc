        {/* ==================== WALK-AWAY ADVISOR ==================== */}
        <div className="bg-gray-900 p-6 rounded-3xl mb-6">
          <h2 className="text-xl font-semibold mb-4 text-orange-400">Walk-Away Advisor</h2>
          <p className="text-gray-400 text-sm mb-4">Recommended profit (in bets) to consider locking in gains</p>
          
          <div className="relative h-64 bg-gray-950 rounded-2xl overflow-hidden border border-gray-700 mb-4">
            <svg viewBox="0 0 400 240" className="w-full h-full">
              {/* Grid */}
              <line x1="40" y1="20" x2="40" y2="220" stroke="#374151" strokeWidth="1"/>
              <line x1="40" y1="220" x2="380" y2="220" stroke="#374151" strokeWidth="1"/>
              
              {/* Y labels */}
              <text x="25" y="35" fontSize="11" fill="#9CA3AF" textAnchor="end">300</text>
              <text x="25" y="95" fontSize="11" fill="#9CA3AF" textAnchor="end">200</text>
              <text x="25" y="155" fontSize="11" fill="#9CA3AF" textAnchor="end">100</text>
              <text x="25" y="215" fontSize="11" fill="#9CA3AF" textAnchor="end">0</text>

              {/* X labels */}
              <text x="45" y="235" fontSize="11" fill="#9CA3AF">1300</text>
              <text x="150" y="235" fontSize="11" fill="#9CA3AF">1500</text>
              <text x="255" y="235" fontSize="11" fill="#9CA3AF">1700</text>
              <text x="360" y="235" fontSize="11" fill="#9CA3AF">1888</text>

              {/* Improved, more realistic walk-away curve */}
              <polyline 
                points="45,205 80,185 120,165 160,145 200,125 240,115 280,105 320,95 360,85"
                fill="none" 
                stroke="#f97316" 
                strokeWidth="4" 
                strokeLinejoin="round"
              />

              {/* Current counter indicator */}
              <line 
                x1={40 + Math.min(340, Math.max(0, ((currentX - 1300) / 588) * 340))} 
                y1="20" 
                x2={40 + Math.min(340, Math.max(0, ((currentX - 1300) / 588) * 340))} 
                y2="220" 
                stroke="#22c55e" 
                strokeWidth="2.5" 
                strokeDasharray="5 3"
              />

              {/* Current position dot */}
              <circle 
                cx={40 + Math.min(340, Math.max(0, ((currentX - 1300) / 588) * 340))} 
                cy={220 - Math.min(170, Math.max(0, ((currentX - 1300) / 588) * 140))} 
                r="6" 
                fill="#22c55e"
                stroke="#111827"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="text-center bg-gray-800 rounded-2xl p-4 text-sm">
            At counter <span className="text-orange-400 font-semibold">{currentX}</span>, 
            consider walking away around 
            <span className="text-green-400 font-bold text-lg"> +{Math.round(90 + (currentX - 1300) * 0.18)} bets</span>
          </div>
        </div>