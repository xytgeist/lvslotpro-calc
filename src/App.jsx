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
  const [isAllowed, setIsAllowed] = useState(false);
  const [debugMsg, setDebugMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Login form
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');

  // Main calculator inputs
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
  const [hoverCounter, setHoverCounter] = useState(null);
  const [hoverWalkAway, setHoverWalkAway] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Acquisition Fee
  const [useFullRunForFee, setUseFullRunForFee] = useState(false);
  const [scoutPercentage, setScoutPercentage] = useState(10);

  // Walk-Away S-Curve
  const getRecommendedWalkAway = (counter) => {
    const oRTP = overallRTP / 100;
    const bRTP = baseRTP / 100;
    const inc = increment;
    const avgTrig = avgTrigger;

    const pCounter = inc / avgTrig;
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
      data: Array.from({ length: 21 }, (_, i) => {
        const counter = 1300 + i * 28;
        return getRecommendedWalkAway(counter);
      }),
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
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw} bets`,
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'Counter' }, min: 1300, max: 1888 },
      y: { title: { display: true, text: 'Walk-Away (Bets)' }, min: 0, max: 260 },
    },
    onHover: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const counter = chartData.labels[index];
        setHoverCounter(counter);
        setHoverWalkAway(getRecommendedWalkAway(counter));
      } else {
        setHoverCounter(null);
        setHoverWalkAway(null);
      }
    },
  };

  // Auto-adjust RTP based on Denom
  useEffect(() => {
    if (denom <= 0.02) {
      setOverallRTP(88);
      setBaseRTP(25);
    } else if (denom === 0.05) {
      setOverallRTP(88.25);
      setBaseRTP(25);
    } else if (denom === 0.1) {
      setOverallRTP(88.4);
      setBaseRTP(25);
    } else if (denom === 0.25) {
      setOverallRTP(88.6);
      setBaseRTP(25);
    } else if (denom === 1) {
      setOverallRTP(91);
      setBaseRTP(28);
    } else {
      setOverallRTP(91.5);
      setBaseRTP(28);
    }
    if (maxMajor) setOverallRTP((prev) => Math.min(100, prev + 0.5));
  }, [denom, maxMajor]);

  // Main Calculation
  const calculate = () => {
    const oRTP = overallRTP / 100;
    const bRTP = baseRTP / 100;
    const inc = increment;
    const freq = allBonusFreq;

    const pCounter = inc / avgTrigger;
    const B = bRTP + (oRTP - bRTP) / (1 / freq);

    const he = 1 - oRTP;

    // Average case
    const spinsAvg = Math.max(0, (avgTrigger - currentX) / inc);
    const evA = B - he * spinsAvg;
    const beA = Math.round(avgTrigger - (B / he) * inc);

    // Full run to must-hit
    const spinsWorst = Math.max(0, (mustHit - currentX) / inc);
    const evW = B - he * spinsWorst;
    const beW = Math.round(mustHit - (B / he) * inc);

    setEvAvg(Number(evA.toFixed(2)));
    setEvFullRun(Number(evW.toFixed(2)));
    setBeAvg(beA);
    setBeFullRun(beW);

    // EV Table (1150 to 1875 step 25)
    const table = [];
    for (let c = 1150; c <= 1875; c += 25) {
      const sAvg = Math.max(0, (avgTrigger - c) / inc);
      const sWorst = Math.max(0, (mustHit - c) / inc);
      const eAvg = Number((B - he * sAvg).toFixed(2));
      const eWorst = Number((B - he * sWorst).toFixed(2));
      const dollarsAvg = (eAvg * betSize).toFixed(0);
      const dollarsWorst = (eWorst * betSize).toFixed(0);

      table.push({
        counter: c,
        evAvg: eAvg,
        evWorst: eWorst,
        dollarsAvg,
        dollarsWorst,
      });
    }
    setEvTable(table);
  };

  useEffect(() => {
    calculate();
  }, [currentX, betSize, overallRTP, baseRTP, increment, allBonusFreq, avgTrigger, mustHit, denom, maxMajor]);

  // Auth + Whitelist with heavy debugging
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) checkEmailAllowed(session.user.email);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) checkEmailAllowed(session.user.email);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const checkEmailAllowed = async (userEmail) => {
    const cleanEmail = userEmail.toLowerCase().trim();
    setDebugMsg(`Checking access for: ${cleanEmail}`);

    const { data, error } = await supabase
      .from('allowed_emails')
      .select('email')
      .eq('email', cleanEmail)
      .single();

    if (error) {
      setDebugMsg((prev) => prev + `\nQuery Error: ${error.message} (Code: ${error.code})`);
      if (error.code === '406') {
        setDebugMsg((prev) => prev + `\n→ RLS is likely still enabled on allowed_emails table`);
      }
    } else if (data) {
      setDebugMsg((prev) => prev + `\n✅ Email match found! Access granted.`);
    } else {
      setDebugMsg((prev) => prev + `\nNo matching email in table.`);
    }

    setIsAllowed(!!data && !error);
  };

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: emailInput,
      password,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) alert(error.message);
    else alert('Check your email to confirm your account.');
    setLoading(false);
  };

  const handleSignOut = () => supabase.auth.signOut();

  // Login Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-3xl w-full max-w-sm">
          <h1 className="text-3xl font-bold text-orange-500 text-center mb-8">Phoenix Link EV Calc</h1>
          <input
            type="email"
            placeholder="Email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="w-full p-4 bg-gray-800 rounded-2xl mb-4 text-white text-lg"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-gray-800 rounded-2xl mb-6 text-white text-lg"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-orange-600 py-4 rounded-2xl font-bold text-lg mb-3 disabled:opacity-50"
          >
            Login
          </button>
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full bg-gray-700 py-4 rounded-2xl font-bold text-lg disabled:opacity-50"
          >
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  // Access Denied Screen
  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-3xl w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">Your email is not on the approved list.<br />Please contact the owner for access.</p>
          
          <div className="text-left text-xs bg-gray-800 p-4 rounded-2xl mb-6 whitespace-pre-wrap font-mono text-gray-400">
            {debugMsg || 'No debug info yet...'}
          </div>

          <button
            onClick={handleSignOut}
            className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-2xl font-bold"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Main App (Allowed Users Only)
  return (
    <div className="min-h-screen bg-gray-950 pb-12">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <img src="/phoenix-link-logo.png" alt="Phoenix" className="w-12 h-12 mr-3" />
          <h1 className="flex-1 text-3xl font-black tracking-tight text-orange-500" 
              style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000' }}>
            PHOENIX LINK EV CALC
          </h1>
        </div>

        <div className="bg-green-900 text-green-200 p-3 rounded-2xl mb-6 text-center text-sm">
          ✅ Access granted for {user.email}
        </div>

        {/* Inputs - Counter, Bet Size, Denom */}
        <div className="bg-gray-900 rounded-3xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Counter</label>
              <input
                type="text"
                value={currentX}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setCurrentX(val === '' ? '' : parseInt(val, 10));
                }}
                className="w-full bg-gray-800 text-4xl font-bold text-center rounded-2xl p-4"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bet Size</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-gray-400">$</span>
                <input
                  type="text"
                  value={betSize}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setBetSize(val === '' ? '' : parseFloat(val));
                  }}
                  className="w-full bg-gray-800 text-4xl font-bold text-center rounded-2xl p-4 pl-8"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-1">Denomination</label>
            <select
              value={denom}
              onChange={(e) => setDenom(parseFloat(e.target.value))}
              className="w-full bg-gray-800 text-2xl font-bold rounded-2xl p-4"
            >
              {[0.01, 0.02, 0.05, 0.10, 0.25, 1, 2, 5, 10, 25, 50, 100].map(d => (
                <option key={d} value={d}>${d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-2xl font-bold flex justify-between items-center px-6"
          >
            Advanced Settings
            <span>{showAdvanced ? '▲' : '▼'}</span>
          </button>

          {showAdvanced && (
            <div className="bg-gray-900 rounded-3xl p-6 mt-3 space-y-4">
              <div>
                <label>Overall RTP (%)</label>
                <input type="number" step="0.1" value={overallRTP} onChange={(e) => setOverallRTP(parseFloat(e.target.value))} className="w-full bg-gray-800 p-3 rounded-2xl" />
              </div>
              <div>
                <label>Base RTP (%)</label>
                <input type="number" step="0.1" value={baseRTP} onChange={(e) => setBaseRTP(parseFloat(e.target.value))} className="w-full bg-gray-800 p-3 rounded-2xl" />
              </div>
              <div>
                <label>Avg Spins to Bonus</label>
                <input type="number" value={allBonusFreq} onChange={(e) => setAllBonusFreq(parseFloat(e.target.value))} className="w-full bg-gray-800 p-3 rounded-2xl" />
              </div>
              <div>
                <label>Avg Counter Trigger</label>
                <input type="number" value={avgTrigger} onChange={(e) => setAvgTrigger(parseFloat(e.target.value))} className="w-full bg-gray-800 p-3 rounded-2xl" />
              </div>
              <div>
                <label>Must Hit By</label>
                <input type="number" value={mustHit} onChange={(e) => setMustHit(parseFloat(e.target.value))} className="w-full bg-gray-800 p-3 rounded-2xl" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={maxMajor} onChange={(e) => setMaxMajor(e.target.checked)} />
                <label>Max Major (+0.5% RTP)</label>
              </div>
            </div>
          )}
        </div>

        {/* Current EV */}
        <div className="bg-gray-900 rounded-3xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Current EV</h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className={`p-4 rounded-2xl ${evAvg >= 0 ? 'bg-green-900' : 'bg-red-900'}`}>
              <div className="text-3xl font-bold">{evAvg >= 0 ? '+' : ''}{evAvg}x</div>
              <div className="text-sm text-gray-400">Average</div>
            </div>
            <div className={`p-4 rounded-2xl ${evFullRun >= 0 ? 'bg-green-900' : 'bg-red-900'}`}>
              <div className="text-3xl font-bold">{evFullRun >= 0 ? '+' : ''}{evFullRun}x</div>
              <div className="text-sm text-gray-400">Full Run (to {mustHit})</div>
            </div>
          </div>
        </div>

        {/* Acquisition Fee Calculator */}
        <div className="bg-gray-900 rounded-3xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Acquisition Fee Calculator</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">EV Basis</label>
              <div className="flex bg-gray-800 rounded-2xl p-1">
                <button onClick={() => setUseFullRunForFee(false)} className={`flex-1 py-3 rounded-xl font-bold ${!useFullRunForFee ? 'bg-orange-600' : ''}`}>Average</button>
                <button onClick={() => setUseFullRunForFee(true)} className={`flex-1 py-3 rounded-xl font-bold ${useFullRunForFee ? 'bg-orange-600' : ''}`}>Full Run</button>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-400">Scout Share %</label>
                <span className="font-bold text-orange-400">{scoutPercentage}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="15"
                step="0.5"
                value={scoutPercentage}
                onChange={(e) => setScoutPercentage(parseFloat(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>

            <div className="text-center pt-4 border-t border-gray-700">
              <div className="text-5xl font-black text-green-400">
                ${(((useFullRunForFee ? evFullRun : evAvg) * betSize) * (scoutPercentage / 100)).toFixed(2)}
              </div>
              <div className="text-sm text-gray-400">Fair fee to pay scout</div>
            </div>
          </div>
        </div>

        {/* Walk-Away Advisor */}
        <div className="bg-gray-900 rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Walk-Away Advisor</h2>
            <button onClick={() => setShowInfoModal(true)} className="text-orange-400 text-sm">ℹ️ Info</button>
          </div>

          <div className="h-64 mb-6">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-orange-400">
              {getRecommendedWalkAway(testCounter)} bets
              <span className="text-xl text-gray-400 ml-2">
                (${(getRecommendedWalkAway(testCounter) * betSize).toFixed(0)})
              </span>
            </div>
            <input
              type="text"
              value={testCounter}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setTestCounter(val === '' ? '' : parseInt(val, 10));
              }}
              className="mt-3 bg-gray-800 text-center text-2xl font-bold w-32 mx-auto rounded-2xl p-2"
            />
            <div className="text-sm text-gray-400 mt-1">Test Counter</div>
          </div>
        </div>

        {/* EV Table */}
        <div className="bg-gray-900 rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-4">EV Table (Average vs Full Run)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 text-left">Counter</th>
                  <th className="py-3 text-center">EV Avg (Bets | $)</th>
                  <th className="py-3 text-center">Full Run (Bets | $)</th>
                </tr>
              </thead>
              <tbody>
                {evTable.map((row) => (
                  <tr key={row.counter} className="border-b border-gray-800">
                    <td className="py-3 font-bold">{row.counter}</td>
                    <td className="py-3 text-center">
                      {row.evAvg >= 0 ? '+' : ''}{row.evAvg}x | ${row.dollarsAvg}
                    </td>
                    <td className="py-3 text-center">
                      {row.evWorst >= 0 ? '+' : ''}{row.evWorst}x | ${row.dollarsWorst}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;