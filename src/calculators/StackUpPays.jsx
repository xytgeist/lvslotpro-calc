// src/calculators/StackUpPays.jsx
import { useState, useEffect } from 'react';

function StackUpPays({ onBack }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-6xl mb-6">🌊</div>
        <h1 className="text-4xl font-bold text-cyan-400 mb-4">Stack Up Pays</h1>
        <p className="text-slate-400 text-lg">Calculator loading...</p>
        <button
          onClick={onBack}
          className="mt-8 text-cyan-400 hover:text-cyan-300 underline"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default StackUpPays;