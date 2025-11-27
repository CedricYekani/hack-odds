import React, { useState } from 'react';
import { Fixture, Market } from '../types';
import { BarChart3, ChevronRight, Coins, Loader2 } from 'lucide-react';

interface FixtureCardProps {
  fixture: Fixture;
  onAnalyze: (fixture: Fixture) => void;
  onGetOdds?: (fixture: Fixture) => Promise<void>;
}

export const FixtureCard: React.FC<FixtureCardProps> = ({ fixture, onAnalyze, onGetOdds }) => {
  const isLive = fixture.status === 'IN_PLAY' || fixture.status === 'PAUSED';
  const isFinished = fixture.status === 'FINISHED';
  const [loadingOdds, setLoadingOdds] = useState(false);

  const handleGetOddsClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onGetOdds) {
      setLoadingOdds(true);
      await onGetOdds(fixture);
      setLoadingOdds(false);
    }
  };

  return (
    <div 
      className="glass-panel rounded-xl p-4 hover:bg-slate-800/50 transition-all group relative overflow-hidden flex flex-col"
    >
      <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-700 group-hover:bg-pitch-500'}`}></div>
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 truncate max-w-[70%]">
          {isLive ? (
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              LIVE
            </span>
          ) : (
            <span className={`w-2 h-2 rounded-full ${isFinished ? 'bg-slate-600' : 'bg-pitch-500'}`}></span>
          )}
          <span className="truncate">{fixture.league}</span>
        </span>
        <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
            {isLive || isFinished ? (
                <span className={isLive ? 'text-red-400 font-bold' : ''}>{fixture.status}</span>
            ) : (
                <>{fixture.time} UTC</>
            )}
        </span>
      </div>

      <div onClick={() => onAnalyze(fixture)} className="cursor-pointer flex flex-col space-y-3 my-2 flex-1">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-white truncate">{fixture.homeTeam}</span>
          {(isLive || isFinished || fixture.homeScore !== null) && (
            <span className="text-xl font-mono font-bold text-pitch-400">{fixture.homeScore}</span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-white truncate">{fixture.awayTeam}</span>
          {(isLive || isFinished || fixture.awayScore !== null) && (
            <span className="text-xl font-mono font-bold text-pitch-400">{fixture.awayScore}</span>
          )}
        </div>
        {!isLive && !isFinished && fixture.homeScore === null && (
            <div className="flex justify-end">
                 <span className="text-xs text-slate-600 font-bold px-2">VS</span>
            </div>
        )}
      </div>

      {/* Odds Section */}
      <div className="mt-4 pt-3 border-t border-slate-700/50">
        {fixture.aiOdds ? (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            {fixture.aiOdds.slice(0, 2).map((market: Market, idx: number) => (
              <div key={idx} className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">{market.name}</span>
                <div className="flex gap-1">
                  {market.selections.map((sel, sIdx) => (
                    <div key={sIdx} className="flex-1 bg-slate-800/80 rounded px-2 py-1.5 flex flex-col items-center justify-center border border-slate-700 hover:border-pitch-500/50 transition-colors">
                      <span className="text-[10px] text-slate-400 truncate w-full text-center">{sel.name.replace(fixture.homeTeam, '1').replace(fixture.awayTeam, '2').replace('Draw', 'X')}</span>
                      <span className="text-xs font-bold text-pitch-400">{sel.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between">
             <button 
              onClick={handleGetOddsClick}
              disabled={loadingOdds}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              {loadingOdds ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Coins className="w-3 h-3 text-yellow-500" />
              )}
              {loadingOdds ? 'Estimating...' : 'Get AI Odds'}
            </button>
             <button 
              onClick={() => onAnalyze(fixture)}
              className="text-xs text-pitch-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Analyze <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
        
        {fixture.aiOdds && (
            <div 
              onClick={() => onAnalyze(fixture)}
              className="mt-3 flex items-center justify-between cursor-pointer group/link"
            >
              <span className="text-xs text-slate-500 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Detailed Analysis
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover/link:text-white transition-colors" />
            </div>
        )}
      </div>
    </div>
  );
};