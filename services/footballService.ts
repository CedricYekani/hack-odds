import { Fixture } from '../types';

const API_KEY = process.env.FOOTBALL_DATA_KEY || '';
const BASE_URL = 'https://api.football-data.org/v4';
// Using corsproxy.io to bypass client-side CORS restrictions for this demo
const PROXY_URL = 'https://corsproxy.io/?';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const mapStatus = (apiStatus: string): Fixture['status'] => {
  switch (apiStatus) {
    case 'IN_PLAY': return 'IN_PLAY';
    case 'PAUSED': return 'PAUSED';
    case 'FINISHED': return 'FINISHED';
    case 'SCHEDULED': return 'SCHEDULED';
    case 'TIMED': return 'TIMED';
    default: return 'SCHEDULED';
  }
};

export const fetchFixturesFromApi = async (period: 'today' | 'upcoming'): Promise<Fixture[]> => {
  const headers: HeadersInit = {};
  if (API_KEY) {
    headers['X-Auth-Token'] = API_KEY;
  }

  // Endpoint construction: requesting matches without specific competition filter to get all leagues
  let endpoint = `${BASE_URL}/matches`;
  
  const today = new Date();
  const dateFrom = formatDate(today);
  
  if (period === 'today') {
    endpoint += `?dateFrom=${dateFrom}&dateTo=${dateFrom}`;
  } else {
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    endpoint += `?dateFrom=${formatDate(nextDay)}&dateTo=${formatDate(threeDaysLater)}`;
  }

  // Wrap the URL with the proxy
  const url = `${PROXY_URL}${encodeURIComponent(endpoint)}`;
  
  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Football API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.matches) return [];

    return data.matches.map((match: any) => ({
      id: match.id.toString(),
      date: match.utcDate.split('T')[0],
      time: match.utcDate.split('T')[1].substring(0, 5),
      league: match.competition.name,
      homeTeam: match.homeTeam.shortName || match.homeTeam.name,
      awayTeam: match.awayTeam.shortName || match.awayTeam.name,
      status: mapStatus(match.status),
      homeScore: match.score?.fullTime?.home ?? null,
      awayScore: match.score?.fullTime?.away ?? null,
      rawString: `${match.utcDate} | ${match.competition.name} | ${match.homeTeam.name} vs ${match.awayTeam.name}`
    }));

  } catch (error) {
    console.error("Failed to fetch from football-data.org via proxy:", error);
    throw error; // Propagate to trigger fallback
  }
};