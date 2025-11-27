import { GoogleGenAI } from "@google/genai";
import { Fixture, BETTING_MARKETS, MultiBetResult, Market } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to extract URLs from grounding metadata
const extractSources = (response: any): string[] => {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return chunks
    .map((c: any) => c.web?.uri)
    .filter((uri: string | undefined): uri is string => !!uri);
};

// Fallback method if API fails
export const fetchFixturesFallback = async (period: 'today' | 'upcoming'): Promise<{ fixtures: Fixture[], rawText: string }> => {
  const modelId = "gemini-2.5-flash";
  
  const prompt = `
    Search for a comprehensive list of soccer matches scheduled for ${period}. 
    Include all professional leagues globally (e.g., Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, Primeira Liga, Championship, MLS, Brasileirão, J-League, etc.).
    
    Output the list strictly in the following format for each match (one per line):
    TIME (UTC) | LEAGUE NAME | HOME TEAM vs AWAY TEAM
    
    Example:
    14:00 | Premier League | Arsenal vs Chelsea
    16:30 | Eredivisie | Ajax vs PSV
    19:00 | Brasileirão | Flamengo vs Palmeiras

    Do not include any introductory text or bolding. Just the list.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const lines = text.split('\n');
    const fixtures: Fixture[] = [];
    const todayDate = new Date().toISOString().split('T')[0];

    lines.forEach((line, index) => {
      const cleanLine = line.replace(/\*\*/g, '').trim();
      const parts = cleanLine.split('|').map(p => p.trim());
      
      if (parts.length >= 3) {
        const teamsParts = parts[2].split('vs');
        if (teamsParts.length === 2) {
            fixtures.push({
                id: `gemini-${index}-${Date.now()}`,
                date: todayDate, // Approximate
                time: parts[0],
                league: parts[1],
                homeTeam: teamsParts[0].trim(),
                awayTeam: teamsParts[1].trim(),
                status: 'SCHEDULED',
                homeScore: null,
                awayScore: null,
                rawString: cleanLine
            });
        }
      }
    });

    return { fixtures, rawText: text };
  } catch (error) {
    console.error("Error fetching fixtures from Gemini:", error);
    throw error;
  }
};

export const analyzeMatch = async (fixture: Fixture): Promise<{ 
  analysis: string, 
  sources: string[], 
  confidence: number,
  bestMarket: string 
}> => {
  const modelId = "gemini-2.5-flash";

  // Format the markets list clearly for the prompt
  const marketList = BETTING_MARKETS.map(m => `- ${m}`).join('\n');

  const prompt = `
    Act as an expert soccer betting analyst. Study the game between ${fixture.homeTeam} and ${fixture.awayTeam} (${fixture.league}) to find the highest probability bet.
    
    Match Details:
    - Time: ${fixture.time} UTC
    - Status: ${fixture.status}
    ${fixture.homeScore !== null ? `- Current Score: ${fixture.homeTeam} ${fixture.homeScore} - ${fixture.awayScore} ${fixture.awayTeam}` : ''}
    
    TASK 1: DEEP DIVE ANALYSIS
    Search for and analyze:
       - Team Form: Last 5 matches results and performance for both.
       - Head-to-Head (H2H): Outcomes of the last 3-5 meetings.
       - Goal Stats: Avg goals scored/conceded, clean sheets, failure to score.
       - Trends: Corner counts, card averages per game.
       - Context: Injuries, suspensions, table motivation, home/away advantage.

    TASK 2: SELECT BEST MARKET
    Based on the data, choose the SINGLE BEST BET from the list below. 
    Select the market where the statistical evidence is strongest.
    
    Allowed Markets:
    ${marketList}

    TASK 3: GENERATE PREDICTION
    - Provide the specific outcome (e.g., "Over 2.5 Goals", "Home Team Win", "Under 10.5 Corners").
    - Assign a Confidence Score (0-100%) reflecting the probability based on stats.

    Output strictly in Markdown:
    ## Match Analysis
    [Detailed breakdown of form, H2H, and key stats]

    ## Verdict
    **Best Market:** [Market Name from list]
    **Prediction:** [Specific Prediction]
    **Confidence:** [Score]%
    **Reasoning:** [Concise summary of the key stat that drives this prediction]
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "Analysis unavailable.";
    const sources = extractSources(response);

    const confidenceMatch = text.match(/Confidence:\s*\*?(\d+)%?/i);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 0;

    const marketMatch = text.match(/Best Market:\s*\*?([^\n]+)/i);
    let bestMarket = marketMatch ? marketMatch[1].trim() : "General";
    // Remove bolding/markdown from market name if caught
    bestMarket = bestMarket.replace(/\*\*/g, '').replace(/\*/g, '').trim();

    return {
      analysis: text,
      sources,
      confidence,
      bestMarket
    };
  } catch (error) {
    console.error("Error analyzing match:", error);
    throw error;
  }
};

export const generateSafeMultiBet = async (fixtures: Fixture[], count: number): Promise<MultiBetResult> => {
  const modelId = "gemini-2.5-flash";

  const fixtureList = fixtures.slice(0, 40).map(f => `${f.league}: ${f.homeTeam} vs ${f.awayTeam} (${f.time})`).join('\n');

  const prompt = `
    Act as a conservative soccer betting strategist. I have a list of matches. 
    Your task is to build a "Safe Multi Bet" (Accumulator) containing exactly ${count} selections.

    Task:
    1. Review the list of matches below.
    2. Identify exactly ${count} matches that offer the highest probability of winning (Safest Bets).
    3. For each selected match, choose the safest possible market from this list: ${BETTING_MARKETS.join(', ')}.
    4. Prioritize "Double Chance", "Over/Under Goals", or "Draw No Bet" if they are safer than Match Winner.
    5. Estimate the decimal odds (e.g., 1.35) for each leg based on typical market values for such a fixture.

    Match List:
    ${fixtureList}

    Output strictly in this JSON format:
    {
      "legs": [
        {
          "fixture": "Home vs Away",
          "market": "Market Name",
          "prediction": "Specific Outcome",
          "odds": "1.xx",
          "reason": "Short reason"
        }
      ],
      "totalOdds": "Approx Total Odds",
      "analysis": "Brief summary of why this accumulator is safe."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      },
    });

    const text = response.text || "{}";
    try {
        const data = JSON.parse(text);
        return data as MultiBetResult;
    } catch (e) {
        console.error("Failed to parse multi bet JSON", text);
        throw new Error("Failed to generate valid bet slip.");
    }
  } catch (error) {
    console.error("Error generating multi bet:", error);
    throw error;
  }
};

export const estimateMatchOdds = async (fixture: Fixture): Promise<Market[]> => {
  const modelId = "gemini-2.5-flash";

  // We ask for a subset of key markets to keep the card UI clean and response fast.
  const prompt = `
    Act as a bookmaker. Estimate the decimal odds for the match: ${fixture.homeTeam} vs ${fixture.awayTeam} (${fixture.league}).
    
    Provide estimated odds for the following markets based on team reputation and recent form:
    1. Match Result (1X2)
    2. Double Chance
    3. Both Teams to Score (BTTS)
    4. Over/Under 2.5 Goals

    Output STRICTLY valid JSON in this structure:
    [
      {
        "name": "Match Result",
        "selections": [
          { "name": "${fixture.homeTeam}", "price": "2.10" },
          { "name": "Draw", "price": "3.40" },
          { "name": "${fixture.awayTeam}", "price": "3.10" }
        ]
      },
      ... other markets
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      },
    });

    const text = response.text || "[]";
    const data = JSON.parse(text);
    return data as Market[];
  } catch (error) {
    console.error("Error estimating odds:", error);
    return [];
  }
};