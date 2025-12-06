/**
 * AI-powered market analysis using OpenAI
 * Provides intelligent comps ranking, ARV prediction, and market insights
 */

import { PropertyDetails, ComparableProperty, MarketData } from '@/lib/marketData/types';

export interface CompAnalysis {
  ranking: Array<{
    compId: number;
    score: number;
    reasoning: string;
    adjustments: {
      size?: number;
      condition?: number;
      location?: number;
      timing?: number;
    };
  }>;
  recommendedARV: {
    value: number;
    range: { min: number; max: number };
    confidence: number;
    factors: string[];
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  recommendations: string[];
}

export interface MarketTrends {
  direction: 'up' | 'down' | 'stable';
  confidence: number;
  insights: string[];
  predictions: {
    next3Months: string;
    next6Months: string;
  };
}

/**
 * Analyze comparable properties and rank them by relevance
 */
export async function analyzeComps(
  subjectProperty: PropertyDetails,
  potentialComps: ComparableProperty[],
  marketContext: MarketData
): Promise<CompAnalysis> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback to basic analysis if AI is not configured
    return getBasicCompAnalysis(potentialComps);
  }

  const systemPrompt = `You are an expert real estate appraiser with 20 years of experience in property valuation. Your task is to analyze comparable properties and determine which are the best matches for a subject property.`;

  const userPrompt = `Analyze these properties and determine which are the best comparables for the subject property.

Subject Property:
- Address: ${subjectProperty.address}
- Bedrooms: ${subjectProperty.bedrooms || 'N/A'}
- Bathrooms: ${subjectProperty.bathrooms || 'N/A'}
- Square Feet: ${subjectProperty.squareFeet || 'N/A'}
- Property Type: ${subjectProperty.propertyType || 'N/A'}
- Condition: ${subjectProperty.condition || 'N/A'}
- Year Built: ${subjectProperty.yearBuilt || 'N/A'}

Potential Comparables:
${potentialComps.map((comp, i) => `
${i + 1}. ${comp.address}
   - Sold Price: $${comp.soldPrice.toLocaleString()}
   - Sold Date: ${comp.soldDate}
   - Distance: ${comp.distance?.toFixed(2) || 'N/A'} miles
   - Bedrooms: ${comp.bedrooms || 'N/A'}
   - Bathrooms: ${comp.bathrooms || 'N/A'}
   - Square Feet: ${comp.squareFeet || 'N/A'}
   - Property Type: ${comp.propertyType || 'N/A'}
`).join('\n')}

Market Context:
- Estimated Value: ${marketContext.estimatedValue ? `$${marketContext.estimatedValue.toLocaleString()}` : 'N/A'}
- Data Source: ${marketContext.dataSource}

Please provide:
1. Rank the comparables from best to worst match (1 = best)
2. For each comp, provide:
   - A relevance score (0-100)
   - Reasoning for why it is or isn't a good comp
   - Adjustments needed for differences (size, condition, location, timing) in dollars
3. Based on the best comps, provide:
   - Recommended ARV (After Repair Value) with confidence range
   - Key factors influencing the value
   - Risk assessment (low/medium/high) with factors
   - Investment recommendations

Format your response as JSON with this structure:
{
  "ranking": [
    {
      "compId": <index starting from 0>,
      "score": <number 0-100>,
      "reasoning": "<explanation>",
      "adjustments": {
        "size": <dollar adjustment>,
        "condition": <dollar adjustment>,
        "location": <dollar adjustment>,
        "timing": <dollar adjustment>
      }
    }
  ],
  "recommendedARV": {
    "value": <number>,
    "range": { "min": <number>, "max": <number> },
    "confidence": <number 0-100>,
    "factors": ["<factor1>", "<factor2>"]
  },
  "riskAssessment": {
    "level": "low" | "medium" | "high",
    "factors": ["<risk1>", "<risk2>"]
  },
  "recommendations": ["<recommendation1>", "<recommendation2>"]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using cost-effective model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent, factual responses
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      // Fallback to basic analysis
      return getBasicCompAnalysis(potentialComps);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return getBasicCompAnalysis(potentialComps);
    }

    const analysis = JSON.parse(content);
    
    // Validate and normalize the response
    return {
      ranking: analysis.ranking || [],
      recommendedARV: analysis.recommendedARV || {
        value: marketContext.estimatedValue || 0,
        range: { min: 0, max: 0 },
        confidence: 50,
        factors: [],
      },
      riskAssessment: analysis.riskAssessment || {
        level: 'medium',
        factors: [],
      },
      recommendations: analysis.recommendations || [],
    };
  } catch (error) {
    console.error('Error analyzing comps with AI:', error);
    // Fallback to basic analysis
    return getBasicCompAnalysis(potentialComps);
  }
}

/**
 * Analyze market trends from comparable sales
 */
export async function analyzeMarketTrends(
  comps: ComparableProperty[],
  location: string
): Promise<MarketTrends> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    return getBasicMarketTrends(comps);
  }

  // Sort comps by date
  const sortedComps = [...comps].sort((a, b) => 
    new Date(b.soldDate).getTime() - new Date(a.soldDate).getTime()
  );

  const systemPrompt = `You are a real estate market analyst specializing in identifying trends and predicting market movements.`;

  const userPrompt = `Analyze these market trends for ${location}:

Recent Sales Data:
${sortedComps.slice(0, 10).map(comp => 
  `- ${comp.address}: Sold $${comp.soldPrice.toLocaleString()} on ${comp.soldDate} (${comp.squareFeet || 'N/A'} sqft)`
).join('\n')}

Provide:
1. Price trend (increasing/decreasing/stable)
2. Market velocity indicators
3. Insights about the market
4. Predictions for next 3-6 months
5. Confidence level (0-100)

Format as JSON:
{
  "direction": "up" | "down" | "stable",
  "confidence": <number 0-100>,
  "insights": ["<insight1>", "<insight2>"],
  "predictions": {
    "next3Months": "<prediction>",
    "next6Months": "<prediction>"
  }
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      return getBasicMarketTrends(comps);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return getBasicMarketTrends(comps);
    }

    const trends = JSON.parse(content);
    
    return {
      direction: trends.direction || 'stable',
      confidence: trends.confidence || 50,
      insights: trends.insights || [],
      predictions: trends.predictions || {
        next3Months: 'Market conditions appear stable.',
        next6Months: 'Monitor market trends closely.',
      },
    };
  } catch (error) {
    console.error('Error analyzing market trends:', error);
    return getBasicMarketTrends(comps);
  }
}

/**
 * Fallback basic comp analysis when AI is not available
 */
function getBasicCompAnalysis(comps: ComparableProperty[]): CompAnalysis {
  const avgPrice = comps.length > 0
    ? comps.reduce((sum, comp) => sum + comp.soldPrice, 0) / comps.length
    : 0;

  return {
    ranking: comps.map((comp, i) => ({
      compId: i,
      score: 75 - (i * 5), // Decreasing score
      reasoning: `Comparable property ${i + 1} with similar characteristics.`,
      adjustments: {},
    })),
    recommendedARV: {
      value: Math.round(avgPrice),
      range: {
        min: Math.round(avgPrice * 0.9),
        max: Math.round(avgPrice * 1.1),
      },
      confidence: 60,
      factors: ['Average of comparable sales'],
    },
    riskAssessment: {
      level: 'medium',
      factors: ['Limited comp data available'],
    },
    recommendations: [
      'Verify property condition',
      'Check for any recent market changes',
      'Consider getting a professional appraisal',
    ],
  };
}

/**
 * Fallback basic market trends when AI is not available
 */
function getBasicMarketTrends(comps: ComparableProperty[]): MarketTrends {
  if (comps.length === 0) {
    return {
      direction: 'stable',
      confidence: 0,
      insights: ['Insufficient data for trend analysis'],
      predictions: {
        next3Months: 'Unable to predict without sufficient data.',
        next6Months: 'Unable to predict without sufficient data.',
      },
    };
  }

  // Simple trend: compare recent vs older sales
  const sortedComps = [...comps].sort((a, b) => 
    new Date(b.soldDate).getTime() - new Date(a.soldDate).getTime()
  );
  
  const recent = sortedComps.slice(0, Math.ceil(sortedComps.length / 2));
  const older = sortedComps.slice(Math.ceil(sortedComps.length / 2));
  
  const recentAvg = recent.reduce((sum, c) => sum + c.soldPrice, 0) / recent.length;
  const olderAvg = older.length > 0 
    ? older.reduce((sum, c) => sum + c.soldPrice, 0) / older.length
    : recentAvg;

  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  return {
    direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
    confidence: Math.min(70, comps.length * 10),
    insights: [
      `Recent sales average: $${Math.round(recentAvg).toLocaleString()}`,
      `Price change: ${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
    ],
    predictions: {
      next3Months: change > 0 
        ? 'Prices may continue to rise based on recent trends.'
        : change < 0
        ? 'Prices may continue to decline based on recent trends.'
        : 'Prices expected to remain relatively stable.',
      next6Months: 'Monitor market conditions and inventory levels.',
    },
  };
}

/**
 * Check if AI analysis is available
 */
export function isAIAnalysisAvailable(): boolean {
  return !!process.env.NEXT_PUBLIC_OPENAI_API_KEY;
}

