export interface Fixture {
  id: string;
  date: string;
  time: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  status: 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELED' | 'AWARDED';
  homeScore: number | null;
  awayScore: number | null;
  rawString?: string;
  aiOdds?: Market[]; // Optional field for AI-generated odds
}

export interface Selection {
  name: string;
  price: string;
}

export interface Market {
  name: string;
  selections: Selection[];
}

export interface Prediction {
  matchId: string;
  confidenceScore: number;
  bestMarket: string;
  prediction: string;
  reasoning: string;
  analysisText: string; // Markdown content
  sourceUrls: string[];
}

export interface MultiBetLeg {
  fixture: string;
  market: string;
  prediction: string;
  odds: string; // Estimated odds
  reason: string;
}

export interface MultiBetResult {
  legs: MultiBetLeg[];
  totalOdds: string;
  analysis: string;
}

export enum AppView {
  TODAY = 'TODAY',
  UPCOMING = 'UPCOMING',
}

export const BETTING_MARKETS = [
  "Match Result (1X2)",
  "Double Chance",
  "First Team to Score",
  "Both Teams to Score (BTTS)",
  "Overs / Unders (Total Goals)",
  "Halftime / Fulltime result",
  "Odd or Even Total Goals",
  "Half Time Result",
  "2nd Half Match Result",
  "Highest Scoring Half",
  "Correct Score",
  "Handicap",
  "Overs/unders corners",
  "Overs/ unders bookings"
];