/**
 * AI-powered feedback service for voice practice sessions
 * Uses OpenAI API to analyze conversation quality and provide actionable feedback
 */

import { VoiceSession, ConversationMessage, AIFeedback, QualityMetrics, AIRecommendation, ResponseAnalysis } from '@/types';
import { getObjections } from './storage';

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
  // Check cache first
  const cached = getCachedFeedback(session.id);
  if (cached) {
    return cached;
  }

  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY in your environment variables.');
  }

  // Prepare conversation context
  const conversation = session.messages
    .map((msg) => `${msg.type === 'user' ? 'Agent' : 'Buyer'}: ${msg.text}`)
    .join('\n');

  // Get objections data for context
  const objections = await getObjections();
  const objectionsContext = objections
    .map((obj) => `- ${obj.text}`)
    .slice(0, 10) // Limit to first 10 for context
    .join('\n');

  const systemPrompt = `You are an expert real estate sales coach analyzing a practice conversation between a disposition agent and a potential buyer. 

Your task is to:
1. Evaluate the agent's responses for quality, clarity, empathy, and effectiveness
2. Identify strengths and areas for improvement
3. Provide specific, actionable recommendations
4. Score responses on a 0-100 scale

Context - Common Objections:
${objectionsContext}

Best Practices:
- Acknowledge the buyer's concern first
- Provide specific, relevant information
- Build rapport and trust
- Address objections directly
- Use clear, confident language
- Guide toward next steps

Analyze the conversation and provide detailed feedback.`;

  const userPrompt = `Analyze this practice conversation:

${conversation}

Session Details:
- Duration: ${session.metrics.totalDuration} seconds
- Messages: ${session.metrics.messagesExchanged}
- Average Response Time: ${session.metrics.averageResponseTime?.toFixed(1) || 'N/A'} seconds

Provide a comprehensive analysis in JSON format with this structure:
{
  "overallScore": <number 0-100>,
  "strengths": [<array of 3-5 specific strengths>],
  "improvementAreas": [<array of 3-5 specific areas needing work>],
  "qualityMetrics": {
    "clarity": <number 0-100>,
    "empathy": <number 0-100>,
    "structure": <number 0-100>,
    "objectionHandling": <number 0-100>,
    "closingTechnique": <number 0-100>
  },
  "recommendations": [
    {
      "type": "technique" | "objection" | "practice" | "general",
      "priority": "high" | "medium" | "low",
      "title": "<short title>",
      "description": "<detailed description>",
      "actionItems": [<array of 2-3 specific actions>]
    }
  ],
  "responseAnalysis": [
    {
      "messageId": "<message id>",
      "userMessage": "<agent's response text>",
      "agentMessage": "<buyer's objection/context>",
      "score": <number 0-100>,
      "feedback": "<specific feedback for this response>",
      "strengths": [<array of strengths>],
      "improvements": [<array of improvements>],
      "suggestedResponse": "<optional improved response example>"
    }
  ]
}

Focus on the agent's responses (marked as "Agent:"). Be specific and constructive.`;

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

    // Cache the result
    cacheFeedback(session.id, feedback);

    return feedback;
  } catch (error) {
    console.error('Error analyzing session with AI:', error);
    throw error;
  }
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

