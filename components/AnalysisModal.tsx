import React from 'react';
import { Fixture } from '../types';
import { X, Trophy, Target, AlertCircle, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // We assume standard markdown rendering, but since I cannot install libs, I will implement a simple renderer or just display whitespace-pre-wrap text elegantly. I'll use simple text display for robustness in this prompt environment.

interface AnalysisModalProps {
  fixture: Fixture | null;
  analysis: string | null;
  confidence: number;
  bestMarket: string;
  sources: string[];
  onClose: () => void;
  isLoading: boolean;
}

// Helper to render confidence color
const getConfidenceColor = (score: number) => {
  if (score >= 80) return 'text-green-400 border-green-500/50 bg-green-500/10';
  if (score >= 60) return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
  return 'text-red-400 border-red-500/50 bg-red-500/10';
};

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ 
  fixture, 
  analysis, 
  confidence,
  bestMarket,
  sources,
  onClose,
  isLoading 
}) => {
  if (!fixture) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {fixture.homeTeam} <span className="text-slate-500 text-sm">vs</span> {fixture.awayTeam}
            </h2>
            <p className="text-sm text-slate-400">{fixture.league}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-6">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-t-2 border-pitch-500 rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-white">Analyzing Match Data</h3>
                        <p className="text-sm text-slate-400 mt-1">Checking team form...</p>
                        <p className="text-sm text-slate-400">Reviewing head-to-head...</p>
                        <p className="text-sm text-slate-400">Simulating outcomes...</p>
                    </div>
                </div>
            ) : analysis ? (
                <div className="space-y-6">
                    
                    {/* Key Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl border ${getConfidenceColor(confidence)} flex flex-col items-center justify-center text-center`}>
                            <span className="text-sm opacity-80 mb-1">AI Confidence Score</span>
                            <span className="text-4xl font-black tracking-tight">{confidence}%</span>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 flex flex-col items-center justify-center text-center">
                            <span className="text-sm text-slate-400 mb-1">Recommended Market</span>
                            <span className="text-lg font-bold text-white flex items-center gap-2">
                                <Target className="w-4 h-4 text-pitch-500" />
                                {bestMarket}
                            </span>
                        </div>
                    </div>

                    {/* Formatted Analysis Text */}
                    <div className="prose prose-invert prose-sm max-w-none">
                        <div className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed">
                            {analysis.replace(/##/g, '')} 
                        </div>
                    </div>

                    {/* Sources */}
                    {sources.length > 0 && (
                        <div className="mt-8 pt-4 border-t border-slate-800">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Data Sources</h4>
                            <div className="flex flex-wrap gap-2">
                                {sources.slice(0, 3).map((url, idx) => (
                                    <a 
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded hover:bg-slate-700 hover:text-pitch-400 transition-colors truncate max-w-[200px]"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        {new URL(url).hostname}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-3 bg-slate-800/30 border border-slate-700 rounded-lg flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-400">
                            <strong>Disclaimer:</strong> Betting involves risk. These predictions are generated by AI based on available historical data and recent news. There is no guarantee of accuracy. Please gamble responsibly.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-400">
                    Failed to load analysis. Please try again.
                </div>
            )}
        </div>

      </div>
    </div>
  );
};