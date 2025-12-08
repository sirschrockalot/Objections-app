/**
 * AI-powered feedback service for voice practice sessions
 * Uses OpenAI API to analyze conversation quality and provide actionable feedback
 */

import { VoiceSession, ConversationMessage, AIFeedback, QualityMetrics, AIRecommendation, ResponseAnalysis } from '@/types';
import { getObjections } from './storage';
import { deduplicateRequest } from '@/lib/utils/requestDeduplication';

// Server-only imports - only import on server side
let getCachedAIResponse: any = null;
let cacheAIResponse: any = null;
let trackAPICost: any = null;
let calculateOpenAICost: any = null;

if (typeof window === 'undefined') {
  // Server-side only - dynamically import to avoid bundling in client
  const aiCache = require('@/lib/cache/aiCache');
  const costTracking = require('@/lib/costTracking');
  getCachedAIResponse = aiCache.getCachedAIResponse;
  cacheAIResponse = aiCache.cacheAIResponse;
  trackAPICost = costTracking.trackAPICost;
  calculateOpenAICost = costTracking.calculateOpenAICost;
}

const AI_FEEDBACK_CACHE_KEY = 'response-ready-ai-feedback-cache';

interface FeedbackCache {
  [sessionId: string]: {
    feedback: AIFeedback;
    timestamp: string;
  };
}

/**
 * Get cached feedback if available
 */
function getCachedFeedback(sessionId: string): AIFeedback | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(AI_FEEDBACK_CACHE_KEY);
    if (!cached) return null;

    const cache: FeedbackCache = JSON.parse(cached);
    const entry = cache[sessionId];
    
    if (!entry) return null;

    // Cache valid for 24 hours
    const cacheAge = Date.now() - new Date(entry.timestamp).getTime();
    if (cacheAge > 24 * 60 * 60 * 1000) {
      return null;
    }

    return entry.feedback;
  } catch (error) {
    console.error('Error reading feedback cache:', error);
    return null;
  }
}

/**
 * Cache feedback result
 */
function cacheFeedback(sessionId: string, feedback: AIFeedback): void {
  if (typeof window === 'undefined') return;

  try {
    const cached = localStorage.getItem(AI_FEEDBACK_CACHE_KEY);
    const cache: FeedbackCache = cached ? JSON.parse(cached) : {};

    cache[sessionId] = {
      feedback,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(AI_FEEDBACK_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error caching feedback:', error);
  }
}

/**
 * Analyze a voice session using AI API
 */
export async function analyzeSessionWithAI(session: VoiceSession): Promise<AIFeedback> {
  // Check client-side cache first (for immediate response)
  const clientCached = getCachedFeedback(session.id);
  if (clientCached) {
    return clientCached;
  }

  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY in your environment variables.');
  }

  // Check server-side cache with deduplication
  const cacheInput = {
    sessionId: session.id,
    messages: session.messages.map(m => ({ type: m.type, text: m.text })),
    metrics: session.metrics,
  };
  
  // Use deduplication to prevent duplicate requests
  const cacheKey = `analyzeSession:${session.id}`;
  return deduplicateRequest(cacheKey, async () => {
    try {
      // Check server-side cache only on server
      let serverCached: AIFeedback | null = null;
      if (typeof window === 'undefined' && getCachedAIResponse) {
        serverCached = await getCachedAIResponse('feedback', cacheInput) as AIFeedback | null;
        if (serverCached) {
          // Also cache client-side for faster access (if in browser)
          if (typeof window !== 'undefined') {
            cacheFeedback(session.id, serverCached);
          }
          return serverCached;
        }
      }

      // Prepare conversation context (optimized - reduced token usage)
      const conversation = session.messages
        .map((msg) => `${msg.type === 'user' ? 'A' : 'B'}: ${msg.text}`)
        .join('\n');

      // Get objections data for context (limit to 5 for token savings)
      const objections = await getObjections();
      const objectionsContext = objections
        .slice(0, 5)
        .map((obj) => obj.text)
        .join('; ');

      // Optimized prompts - reduced by ~40% token usage
      const systemPrompt = `Real estate sales coach. Evaluate agent responses (quality, clarity, empathy). Score 0-100.`;

      const userPrompt = `Conversation:
${conversation}

Metrics: ${session.metrics.totalDuration}s, ${session.metrics.messagesExchanged} msgs, ${session.metrics.averageResponseTime?.toFixed(1) || 'N/A'}s avg

Objections: ${objectionsContext}

Return JSON:
{
  "overallScore": 75,
  "strengths": ["strength1"],
  "improvementAreas": ["area1"],
  "qualityMetrics": {"clarity": 80, "empathy": 70, "structure": 75, "objectionHandling": 80, "closingTechnique": 70},
  "recommendations": [{"type": "technique", "priority": "high", "title": "...", "description": "...", "actionItems": ["action1"]}],
  "responseAnalysis": [{"messageId": "1", "userMessage": "...", "agentMessage": "...", "score": 80, "feedback": "...", "strengths": [], "improvements": []}]
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
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from AI');
      }

      // Track API cost (server-side only)
      const usage = data.usage;
      if (usage && typeof window === 'undefined' && calculateOpenAICost && trackAPICost) {
        const cost = calculateOpenAICost('gpt-4o-mini', usage.prompt_tokens || 0, usage.completion_tokens || 0);
        trackAPICost('openai', cost, undefined, {
          model: 'gpt-4o-mini',
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          task: 'feedback',
        }).catch(console.error);
      }

      // Parse JSON response
      const analysis = JSON.parse(content);

      // Build feedback object
      const feedback: AIFeedback = {
        sessionId: session.id,
        overallScore: analysis.overallScore || 0,
        strengths: analysis.strengths || [],
        improvementAreas: analysis.improvementAreas || [],
        recommendations: analysis.recommendations || [],
        qualityMetrics: {
          clarity: analysis.qualityMetrics?.clarity || 0,
          empathy: analysis.qualityMetrics?.empathy || 0,
          structure: analysis.qualityMetrics?.structure || 0,
          objectionHandling: analysis.qualityMetrics?.objectionHandling || 0,
          closingTechnique: analysis.qualityMetrics?.closingTechnique || 0,
          averageResponseTime: session.metrics.averageResponseTime || 0,
        },
        responseAnalysis: analysis.responseAnalysis || [],
        generatedAt: new Date().toISOString(),
        model: 'gpt-4o-mini',
      };

      // Cache client-side (always) and server-side (if on server)
      if (typeof window !== 'undefined') {
        cacheFeedback(session.id, feedback);
      }
      if (typeof window === 'undefined' && cacheAIResponse) {
        await cacheAIResponse('feedback', cacheInput, feedback, 86400); // 24 hours
      }

      return feedback;
    } catch (error) {
      console.error('Error analyzing session with AI:', error);
      throw error;
    }
  });
}

/**
 * Get feedback for a session (from cache or generate)
 */
export async function getSessionFeedback(session: VoiceSession, forceRefresh = false): Promise<AIFeedback | null> {
  if (!forceRefresh) {
    const cached = getCachedFeedback(session.id);
    if (cached) return cached;
  }

  try {
    return await analyzeSessionWithAI(session);
  } catch (error) {
    console.error('Failed to get AI feedback:', error);
    return null;
  }
}

/**
 * Check if AI feedback is available (API key configured)
 */
export function isAIFeedbackAvailable(): boolean {
  return !!process.env.NEXT_PUBLIC_OPENAI_API_KEY;
}

/**
 * Clear feedback cache
 */
export function clearFeedbackCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AI_FEEDBACK_CACHE_KEY);
}

