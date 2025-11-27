import React, { useState, useEffect, useCallback } from 'react';
import { AppView, Fixture } from './types';
import { fetchFixturesFallback, analyzeMatch, estimateMatchOdds } from './services/geminiService';
import { fetchFixturesFromApi } from './services/footballService';
import { FixtureCard } from './components/FixtureCard';
import { Loader } from './components/Loader';
import { AnalysisModal } from './components/AnalysisModal';
import { MultiBetModal } from './components/MultiBetModal';
import { Calendar, CalendarDays, Activity, Trophy, RefreshCw, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.TODAY);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [analysisData, setAnalysisData] = useState<{
    text: string; 
    confidence: number; 
    bestMarket: string;
    sources: string[]
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [showMultiBetModal, setShowMultiBetModal] = useState(false);

  const loadSchedule = useCallback(async () => {
    setLoadingFixtures(true);
    setFixtures([]); 
    setUsingFallback(false);
    
    const period = currentView === AppView.TODAY ? 'today' : 'upcoming';

    try {
      // Try Official API First
      const apiFixtures = await fetchFixturesFromApi(period);
      if (apiFixtures.length === 0) {
        console.warn("No matches from API, trying fallback...");
        throw new Error("No matches found via API");
      }
      setFixtures(apiFixtures);
    } catch (apiError) {
      console.warn("Primary API failed, switching to Gemini Fallback", apiError);
      setUsingFallback(true);
      try {
        const { fixtures: geminiFixtures } = await fetchFixturesFallback(period);
        setFixtures(geminiFixtures);
      } catch (geminiError) {
        console.error("All data sources failed", geminiError);
      }
    } finally {
      setLoadingFixtures(false);
    }
  }, [currentView]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Analyze Match Handler
  const handleAnalyzeMatch = useCallback(async (fixture: Fixture) => {
    setSelectedFixture(fixture);
    setAnalyzing(true);
    setAnalysisData(null);

    try {
      const result = await analyzeMatch(fixture);
      setAnalysisData({
        text: result.analysis,
        confidence: result.confidence,
        bestMarket: result.bestMarket,
        sources: result.sources
      });
    } catch (e) {
      setAnalysisData({
        text: "Error analyzing match. Please try again later.",
        confidence: 0,
        bestMarket: "N/A",
        sources: []
      });
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // Fetch Odds Handler
  const handleGetOdds = useCallback(async (fixture: Fixture) => {
     try {
        const odds = await estimateMatchOdds(fixture);
        if (odds && odds.length > 0) {
            setFixtures(prev => prev.map(f => 
                f.id === fixture.id ? { ...f, aiOdds: odds } : f
            ));
        }
     } catch (error) {
         console.error("Failed to fetch odds", error);
     }
  }, []);

  const handleCloseModal = () => {
    setSelectedFixture(null);
    setAnalysisData(null);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-20">
      
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-pitch-600 to-pitch-400 rounded-lg flex items-center justify-center shadow-lg shadow-pitch-500/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hidden sm:block">
              ProBet<span className="font-light text-pitch-500">AI</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowMultiBetModal(true)}
                disabled={fixtures.length === 0}
                className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded-md hover:shadow-lg hover:shadow-yellow-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Zap className="w-3.5 h-3.5 fill-current" />
                Safe Multi
            </button>

            <div className="flex bg-slate-800/80 rounded-lg p-1 border border-slate-700">
                <button 
                onClick={() => setCurrentView(AppView.TODAY)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                    currentView === AppView.TODAY 
                    ? 'bg-pitch-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
                >
                <Calendar className="w-3.5 h-3.5" />
                Today
                </button>
                <button 
                onClick={() => setCurrentView(AppView.UPCOMING)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                    currentView === AppView.UPCOMING 
                    ? 'bg-pitch-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
                >
                <CalendarDays className="w-3.5 h-3.5" />
                Upcoming
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        
        <div className="mb-6 flex items-end justify-between">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    {currentView === AppView.TODAY ? "Today's Fixtures" : "Upcoming Matches"}
                    {fixtures.length > 0 && <span className="text-xs font-normal bg-slate-800 px-2 py-1 rounded-full text-slate-400">{fixtures.length} found</span>}
                </h2>
                <p className="text-slate-400 text-sm flex items-center gap-2">
                   {usingFallback ? (
                       <span className="text-yellow-500 flex items-center gap-1">
                         <Activity className="w-3 h-3" /> Using Gemini Search Fallback
                       </span>
                   ) : (
                       <span className="text-green-500 flex items-center gap-1">
                         <Activity className="w-3 h-3" /> Live Data Active
                       </span>
                   )}
                </p>
            </div>
            <button 
              onClick={loadSchedule}
              disabled={loadingFixtures}
              className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingFixtures ? 'animate-spin' : ''}`} />
            </button>
        </div>

        {/* Mobile FAB for Multi Bet */}
        <div className="sm:hidden mb-4">
             <button 
                onClick={() => setShowMultiBetModal(true)}
                disabled={fixtures.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-sm font-bold px-4 py-3 rounded-xl shadow-lg disabled:opacity-50"
            >
                <Zap className="w-4 h-4 fill-current" />
                Generate Safe Multi Bet
            </button>
        </div>

        {loadingFixtures ? (
          <Loader text={usingFallback ? "Searching web for fixtures..." : "Fetching live data..."} />
        ) : fixtures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fixtures.map((fixture) => (
              <FixtureCard 
                key={fixture.id} 
                fixture={fixture} 
                onAnalyze={handleAnalyzeMatch}
                onGetOdds={handleGetOdds}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
            <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-300">No matches found</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mb-4">
                {usingFallback 
                    ? "We couldn't find any major matches scheduled for this period." 
                    : "Live data connection failed or no matches scheduled. Try refreshing."}
            </p>
            <button 
                onClick={loadSchedule}
                className="text-pitch-500 hover:text-pitch-400 text-sm font-semibold"
            >
                Try Again
            </button>
          </div>
        )}
      </main>

      {/* Analysis Modal */}
      {selectedFixture && (
        <AnalysisModal 
            fixture={selectedFixture}
            analysis={analysisData?.text || null}
            confidence={analysisData?.confidence || 0}
            bestMarket={analysisData?.bestMarket || ''}
            sources={analysisData?.sources || []}
            isLoading={analyzing}
            onClose={handleCloseModal}
        />
      )}

      {/* Multi Bet Modal */}
      {showMultiBetModal && (
        <MultiBetModal 
            fixtures={fixtures}
            onClose={() => setShowMultiBetModal(false)}
        />
      )}

    </div>
  );
};

export default App;