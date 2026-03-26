import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [user, setUser] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');

  const [currentX, setCurrentX] = useState(1400);
  const [betSize, setBetSize] = useState(25);
  const [denom, setDenom] = useState(1.00);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [overallRTP, setOverallRTP] = useState(91);
  const [baseRTP, setBaseRTP] = useState(28);
  const [increment, setIncrement] = useState(1.1);
  const [allBonusFreq, setAllBonusFreq] = useState(80);
  const [avgTrigger, setAvgTrigger] = useState(1800);
  const [mustHit, setMustHit] = useState(1888);
  const [maxMajor, setMaxMajor] = useState(false);

  const [evAvg, setEvAvg] = useState(0);
  const [evFullRun, setEvFullRun] = useState(0);
  const [beAvg, setBeAvg] = useState(0);
  const [beFullRun, setBeFullRun] = useState(0);
  const [evTable, setEvTable] = useState([]);

  const [testCounter, setTestCounter] = useState(1400);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const [useFullRunForFee, setUseFullRunForFee] = useState(false);
  const [scoutPercentage, setScoutPercentage] = useState(10);

  const getRecommendedWalkAway = (counter) => {
    const oRTP = overallRTP / 100;
    const bRTP = baseRTP / 100;
    const inc = increment;
    const avgTrig = avgTrigger;

    const B = bRTP + (oRTP - bRTP) / (1 / allBonusFreq);
    const spinsRemaining = Math.max(0, (avgTrig - counter) / inc);
    const remainingEV = B - (1 - oRTP) * spinsRemaining;

    const normalized = Math.max(0, Math.min(1, (counter - 1300) / 588));
    const sCurve = 1 / (1 + Math.exp(-5.5 * (normalized - 0.48)));
    const curveBonus = sCurve * 98;

    let walkAway = Math.round(remainingEV * 3.5 + curveBonus);
    return Math.max(75, Math.min(245, walkAway));
  };

  const chartData = {
    labels: Array.from({ length: 21 }, (_, i) => 1300 + i * 28),
    datasets: [{
      label: 'Recommended Walk-Away',
      data: Array.from({ length: 21 }, (_, i) => getRecommendedWalkAway(1300 + i * 28)),
      borderColor: '#f97316',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      borderWidth: 3,
      tension: 0.45,
      pointRadius: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { title: { display: true, text: 'Counter' }, min: 1300, max: 1888 },
      y: { title: { display: true, text: 'Walk-Away (Bets)' }, min: 0, max: 260 },
    },
  };

  // Auto RTP based on Denom
  useEffect(() => {
    let oRTP = 91;
    let bRTP = 28;
    if (denom <= 0.02) { oRTP = 88; bRTP = 25; }
    else if (denom === 0.05) { oRTP = 88.25; bRTP = 25; }
    else if (denom === 0.1) { oRTP = 88.4; bRTP = 25; }
    else if (denom === 0.25) { oRTP = 88.6; bRTP = 25; }
    else if (denom > 1) { oRTP = 91.5; bRTP = 28; }
    if (maxMajor) oRTP = Math.min(100, oRTP + 0.5);

    setOverallRTP(oRTP);
    setBaseRTP(bRTP);
  }, [denom, maxMajor]);

  const calculate = () => {
    const oRTP = overallRTP / 100;
    const bRTP = baseRTP / 100;
    const inc = increment;
    const freq = allBonusFreq;

    const B = bRTP + (oRTP - bRTP) / (1 / freq);
    const he = 1 - oRTP;

    const spinsAvg = Math.max(0, (avgTrigger - currentX) / inc);
    const spinsWorst = Math.max(0, (mustHit - currentX) / inc);

    const evA = Number((B - he * spinsAvg).toFixed(2));
    const evW = Number((B - he * spinsWorst).toFixed(2));

    const beA = Math.round(avgTrigger - (B / he) * inc);
    const beW = Math.round(mustHit - (B / he) * inc);

    setEvAvg(evA);
    setEvFullRun(evW);
    setBeAvg(beA);
    setBeFullRun(beW);

    const table = [];
    for (let c = 1150; c <= 1875; c += 25) {
      const sA = Math.max(0, (avgTrigger - c) / inc);
      const sW = Math.max(0, (mustHit - c) / inc);
      const eA = Number((B - he * sA).toFixed(2));
      const eW = Number((B - he * sW).toFixed(2));
      table.push({
        counter: c,
        evAvg: eA,
        evWorst: eW,
        dollarsAvg: (eA * betSize).toFixed(0),
        dollarsWorst: (eW * betSize).toFixed(0),
      });
    }
    setEvTable(table);
  };

  useEffect(() => { calculate(); }, [currentX, betSize, overallRTP, baseRTP, increment, allBonusFreq, avgTrigger, mustHit, denom, maxMajor]);

  // Simple auth (no whitelist)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password });
    if (error) alert(error.message);
  };

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email: emailInput,
      password,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) alert(error.message);
    else alert('Check your email for confirmation.');
  };

  const handleSignOut = () => supabase.auth.signOut();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-3xl w-full max-w-sm">
          <h1 className="text-3xl font-bold text-orange-500 text-center mb-8">Phoenix Link EV Calc</h1>
          <input type="email" placeholder="Email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full p-4 bg-gray-800 rounded-2xl mb-4 text-white text-lg" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-gray-800 rounded-2xl mb-6 text-white text-lg" />
          <button onClick={handleLogin} className="w-full bg-orange-600 py-4 rounded-2xl font-bold text-lg mb-3">Login</button>
          <button onClick={handleSignUp} className="w-full bg-gray-700 py-4 rounded-2xl font-bold text-lg">Sign Up</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-12">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <img src="/phoenix-link-logo.png" alt="Phoenix Link" className="w-12 h-12 flex-shrink-0 mr-4" />
          <h1 className="text-[28px] font-black tracking-[-1.5px] text-black" 
              style={{ textShadow: '-2px -2px 0 #f97316, 2px -2px 0 #f97316, -2px 2px 0 #f97316, 2px 2px 0 #f97316' }}>
            PHOENIX LINK EV CALC
          </h1>
        </div>

        {/* Inputs */}
        <div className="bg-gray-900 rounded-3xl p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Counter</label>
              <input
                type="text"
                value={currentX}
                onChange={(e) => setCurrentX(e.target.value.replace(/[^0-9]/g, '') || 1400)}
                className="w-full bg-gray-800 text-3xl font-bold text-center rounded-2xl p-4"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Bet Size</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">$</span>
                <input
                  type="text"
                  value={betSize}
                  onChange={(e) => setBetSize(e.target.value.replace(/[^0-9.]/g, '') || 25)}
                  className="w-full bg-gray-800 text-3xl font-bold text-center rounded-2xl p-4 pl-8"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Denom</label>
              <select value={denom} onChange={(e) => setDenom(parseFloat(e.target.value))} className="w-full bg-gray-800 text-xl font-bold rounded-2xl p-4">
                {[0.01,0.02,0.05,0.10,0.25,1,2,5,10,25,50,100].map(d => (
                  <option key={d} value={d}>${d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Advanced */}
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)} 
          className="w-full bg-gray-800 py-3 rounded-2xl mb-6 font-bold flex justify-between px-6"
        >
          Advanced Settings <span>{showAdvanced ? '▲' : '▼'}</span>
        </button>

        {showAdvanced && (
          <div className="bg-gray-900 rounded-3xl p-6 mb-6 space-y-4">
            <div><label>Overall RTP (%)</label><input type="number" step="0.1" value={overallRTP} onChange={e => setOverallRTP(parseFloat(e.target.value))} className="w-full bg-gray-800 p-3 rounded-2xl" /></div>
            <div><label>Base RTP (%)</label><input type="number" step="0.1" value={baseRTP} onChange={e => setBaseRTP(parseFloat(e.target.value))} className="w-full bg-gray-800 p-3 rounded-2xl" /></div>
            <div><label>Avg Spins to Bonus</label><input type="number" value={allBonusFreq} onChange={e => setAllBonusFreq(parseFloat(e.target.value))} className="w-full bg-gray-800 p-3 rounded-2xl" /></div>
            <div><label>Avg Counter Trigger</label><input type="number" value={avgTrigger} onChange={e => setAvgTrigger(parseFloat(e.target.value))} className="w-full bg-gray-800 p-3 rounded-2xl" /></div>
            <div><label>Must Hit By</label><input type="number" value={mustHit} onChange={e => setMustHit(parseFloat(e.target.value))} className="w-full bg-gray-800 p-3 rounded-2xl" /></div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={maxMajor} onChange={e => setMaxMajor(e.target.checked)} /> Max Major (+0.5% RTP)</label>
          </div>
        )}

        {/* Current EV */}
        <div className="bg-gray-900 rounded-3xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-3">Current EV</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-5 rounded-2xl text-center ${evAvg >= 0 ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
              <div className="text-4xl font-black">{evAvg >= 0 ? '+' : ''}{evAvg}x</div>
              <div className="text-xs text-gray-400">Average</div>
            </div>
            <div className={`p-5 rounded-2xl text-center ${evFullRun >= 0 ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
              <div className="text-4xl font-black">{evFullRun >= 0 ? '+' : ''}{evFullRun}x</div>
              <div className="text-xs text-gray-400">Full Run</div>
            </div>
          </div>
        </div>

        {/* Acquisition Fee Calculator */}
        <div className="bg-gray-900 rounded-3xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Acquisition Fee Calculator</h2>
          <div className="space-y-5">
            <div>
              <label className="text-xs text-gray-400 block mb-1">EV Basis</label>
              <div className="flex bg-gray-800 rounded-2xl p-1">
                <button onClick={() => setUseFullRunForFee(false)} className={`flex-1 py-3 rounded-xl font-medium ${!useFullRunForFee ? 'bg-orange-600 text-white' : ''}`}>Average</button>
                <button onClick={() => setUseFullRunForFee(true)} className={`flex-1 py-3 rounded-xl font-medium ${useFullRunForFee ? 'bg-orange-600 text-white' : ''}`}>Full Run</button>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Scout Share</span>
                <span className="font-bold text-orange-400">{scoutPercentage}%</span>
              </div>
              <input type="range" min="10" max="15" step="0.5" value={scoutPercentage} onChange={e => setScoutPercentage(parseFloat(e.target.value))} className="w-full accent-orange-500" />
            </div>

            <div className="text-center pt-4 border-t border-gray-700">
              <div className="text-5xl font-black text-green-400">
                ${(((useFullRunForFee ? evFullRun : evAvg) * betSize) * (scoutPercentage / 100)).toFixed(2)}
              </div>
              <div className="text-xs text-gray-400 mt-1">Recommended fee to scout</div>
            </div>
          </div>
        </div>

        {/* Walk-Away Advisor */}
        <div className="bg-gray-900 rounded-3xl p-6 mb-8">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-bold">Walk-Away Advisor</h2>
            <button onClick={() => setShowInfoModal(true)} className="text-orange-400">ℹ️</button>
          </div>

          <div className="h-64 mb-6">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="text-center">
            <div className="text-4xl font-black text-orange-400">
              {getRecommendedWalkAway(testCounter)} bets 
              <span className="text-lg text-gray-400"> (${(getRecommendedWalkAway(testCounter) * betSize).toFixed(0)})</span>
            </div>
            <input
              type="text"
              value={testCounter}
              onChange={(e) => setTestCounter(e.target.value.replace(/[^0-9]/g, '') || 1400)}
              className="mt-4 bg-gray-800 text-2xl font-bold w-40 text-center rounded-2xl p-3 mx-auto block"
            />
            <div className="text-xs text-gray-400 mt-1">Test Counter</div>
          </div>
        </div>

        {/* EV Table */}
        <div className="bg-gray-900 rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-4">EV Table</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2">Counter</th>
                  <th className="text-center py-2">EV Avg (Bets | $)</th>
                  <th className="text-center py-2">Full Run (Bets | $)</th>
                </tr>
              </thead>
              <tbody>
                {evTable.map(row => (
                  <tr key={row.counter} className="border-b border-gray-800">
                    <td className="py-3 font-medium">{row.counter}</td>
                    <td className="py-3 text-center">{row.evAvg >= 0 ? '+' : ''}{row.evAvg}x | ${row.dollarsAvg}</td>
                    <td className="py-3 text-center">{row.evWorst >= 0 ? '+' : ''}{row.evWorst}x | ${row.dollarsWorst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center mt-8">
          <button onClick={handleSignOut} className="text-gray-500 text-sm">Sign Out</button>
        </div>
      </div>
    </div>
  );
}

export default App;