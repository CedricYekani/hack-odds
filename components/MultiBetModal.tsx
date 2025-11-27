import React, { useState } from 'react';
import { Fixture, MultiBetResult } from '../types';
import { generateSafeMultiBet } from '../services/geminiService';
import { X, Zap, Layers, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';

interface MultiBetModalProps {
  fixtures: Fixture[];
  onClose: () => void;
}

export const MultiBetModal: React.FC<MultiBetModalProps> = ({ fixtures, onClose }) => {
  const [selectionCount, setSelectionCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MultiBetResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await generateSafeMultiBet(fixtures, selectionCount);
      setResult(data);
    } catch (e) {
      setError("Failed to generate a safe bet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `🏆 ProBet AI Safe Multi\n\n${result.legs.map(l => `⚽ ${l.fixture}\n🎯 ${l.prediction} (@${l.odds})`).join('\n\n')}\n\n📊 Total Odds: ${result.totalOdds}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Safe Multi Generator
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!result && !loading && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-6">
                  Select how many matches you want in your accumulator. AI will scan all available games to find the safest combinations.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">Number of Selections (Odds)</label>
                <div className="flex justify-between gap-2">
                  {[3, 5, 7, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => setSelectionCount(num)}
                      className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                        selectionCount === num
                          ? 'bg-pitch-600 border-pitch-500 text-white shadow-lg shadow-pitch-500/20'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-center text-slate-500">Targeting {selectionCount} highly probable outcomes</p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={fixtures.length === 0}
                className="w-full py-4 bg-gradient-to-r from-pitch-600 to-pitch-500 hover:from-pitch-500 hover:to-pitch-400 text-white font-bold rounded-xl shadow-lg shadow-pitch-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Layers className="w-5 h-5" />
                Generate Safe Slip
              </button>
            </div>
          )}

          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 border-4 border-pitch-500 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h3 className="text-white font-medium">Analyzing {fixtures.length} Matches</h3>
                <p className="text-sm text-slate-500 animate-pulse">Finding the safest markets...</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Slip</span>
                    <span className="text-pitch-400 font-mono font-bold">~{result.totalOdds} Odds</span>
                </div>
                <div className="divide-y divide-slate-700/50">
                    {result.legs.map((leg, idx) => (
                        <div key={idx} className="p-3 hover:bg-slate-800/80 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-white text-sm">{leg.fixture}</span>
                                <span className="bg-slate-900 text-slate-300 text-xs px-1.5 py-0.5 rounded border border-slate-700 font-mono">{leg.odds}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-pitch-400 font-bold text-sm">{leg.prediction}</div>
                                    <div className="text-slate-500 text-[10px] mt-0.5">{leg.market}</div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 italic border-l-2 border-slate-700 pl-2">{leg.reason}</p>
                        </div>
                    ))}
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                  <p className="text-xs text-blue-200">{result.analysis}</p>
              </div>

              <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setResult(null)}
                    className="flex-1 py-3 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                  >
                      Back
                  </button>
                  <button 
                    onClick={handleCopy}
                    className="flex-1 py-3 rounded-lg bg-white text-slate-900 font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied!" : "Copy Slip"}
                  </button>
              </div>
            </div>
          )}

          {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="text-sm">{error}</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};