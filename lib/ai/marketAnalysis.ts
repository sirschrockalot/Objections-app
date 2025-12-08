/**
 * AI-powered market analysis using OpenAI
 * Provides intelligent comps ranking, ARV prediction, and market insights
 */

import { PropertyDetails, ComparableProperty, MarketData } from '@/lib/marketData/types';
import { getCachedAIResponse, cacheAIResponse } from '@/lib/cache/aiCache';
import { trackAPICost, calculateOpenAICost } from '@/lib/costTracking';
import { deduplicateRequest } from '@/lib/utils/requestDeduplication';
import { error as logError } from '../logger';

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

  // Check cache first
  const cacheInput = {
    address: subjectProperty.address,
    comps: potentialComps.map(c => ({ address: c.address, soldPrice: c.soldPrice, soldDate: c.soldDate })),
    estimatedValue: marketContext.estimatedValue,
  };
  
  // Use deduplication to prevent duplicate requests
  const cacheKey = `analyzeComps:${JSON.stringify(cacheInput)}`;
  return deduplicateRequest(cacheKey, async () => {
    try {
      const cached = await getCachedAIResponse<CompAnalysis>('market-analysis', cacheInput);
      if (cached) {
        return cached;
      }

      // Optimized prompts - reduced token usage by ~30%
      const systemPrompt = `Expert real estate appraiser. Analyze comparables and rank by relevance.`;

      const userPrompt = `Subject: ${subjectProperty.address} | ${subjectProperty.bedrooms || 'N/A'}br/${subjectProperty.bathrooms || 'N/A'}ba | ${subjectProperty.squareFeet || 'N/A'}sqft | ${subjectProperty.propertyType || 'N/A'}

Comps:
${potentialComps.map((comp, i) => `${i}. ${comp.address}: $${comp.soldPrice.toLocaleString()} (${comp.soldDate}) | ${comp.bedrooms || 'N/A'}br/${comp.bathrooms || 'N/A'}ba | ${comp.squareFeet || 'N/A'}sqft | ${comp.distance?.toFixed(1) || 'N/A'}mi`).join('\n')}

Est Value: ${marketContext.estimatedValue ? `$${marketContext.estimatedValue.toLocaleString()}` : 'N/A'}

Return JSON:
{
  "ranking": [{"compId": 0, "score": 85, "reasoning": "...", "adjustments": {"size": 0, "condition": 0, "location": 0, "timing": 0}}],
  "recommendedARV": {"value": 250000, "range": {"min": 240000, "max": 260000}, "confidence": 75, "factors": ["factor1"]},
  "riskAssessment": {"level": "medium", "factors": ["risk1"]},
  "recommendations": ["rec1"]
}`;

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
        logError('OpenAI API error in comp analysis', error);
        // Fallback to basic analysis
        return getBasicCompAnalysis(potentialComps);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        return getBasicCompAnalysis(potentialComps);
      }

      // Track API cost
      const usage = data.usage;
      if (usage) {
        const cost = calculateOpenAICost('gpt-4o-mini', usage.prompt_tokens || 0, usage.completion_tokens || 0);
        trackAPICost('openai', cost, undefined, {
          model: 'gpt-4o-mini',
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          task: 'market-analysis',
        }).catch((err) => logError('Failed to track API cost', err));
      }

      const analysis = JSON.parse(content);
      
      // Validate and normalize the response
      const result: CompAnalysis = {
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

      // Cache the result for 24 hours
      await cacheAIResponse('market-analysis', cacheInput, result, 86400);

      return result;
    } catch (error) {
      logError('Failed to analyze comps with AI', error);
      // Fallback to basic analysis
      return getBasicCompAnalysis(potentialComps);
    }
  });
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

  // Check cache first
  const cacheInput = {
    location,
    comps: comps.slice(0, 10).map(c => ({ address: c.address, soldPrice: c.soldPrice, soldDate: c.soldDate })),
  };
  
  // Use deduplication to prevent duplicate requests
  const cacheKey = `analyzeMarketTrends:${JSON.stringify(cacheInput)}`;
  return deduplicateRequest(cacheKey, async () => {
    try {
      const cached = await getCachedAIResponse<MarketTrends>('market-analysis', cacheInput);
      if (cached) {
        return cached;
      }

      // Sort comps by date
      const sortedComps = [...comps].sort((a, b) => 
        new Date(b.soldDate).getTime() - new Date(a.soldDate).getTime()
      );

      // Optimized prompt - reduced token usage
      const systemPrompt = `Real estate market analyst. Identify trends and predict movements.`;

      const userPrompt = `Location: ${location}

Sales: ${sortedComps.slice(0, 10).map(c => `${c.address}: $${c.soldPrice.toLocaleString()} (${c.soldDate})`).join(' | ')}

Return JSON:
{
  "direction": "up"|"down"|"stable",
  "confidence": 75,
  "insights": ["insight1"],
  "predictions": {"next3Months": "...", "next6Months": "..."}
}`;

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

      // Track API cost
      const usage = data.usage;
      if (usage) {
        const cost = calculateOpenAICost('gpt-4o-mini', usage.prompt_tokens || 0, usage.completion_tokens || 0);
        trackAPICost('openai', cost, undefined, {
          model: 'gpt-4o-mini',
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          task: 'market-trends',
        }).catch((err) => logError('Failed to track API cost', err));
      }

      const trends = JSON.parse(content);
      
      const result: MarketTrends = {
        direction: trends.direction || 'stable',
        confidence: trends.confidence || 50,
        insights: trends.insights || [],
        predictions: trends.predictions || {
          next3Months: 'Market conditions appear stable.',
          next6Months: 'Monitor market trends closely.',
        },
      };

      // Cache the result for 24 hours
      await cacheAIResponse('market-analysis', cacheInput, result, 86400);

      return result;
    } catch (error) {
      logError('Failed to analyze market trends', error);
      return getBasicMarketTrends(comps);
    }
  });
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

