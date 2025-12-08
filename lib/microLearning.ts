import { ObjectionOfTheDay } from '@/types';
import { getObjections } from './storage';
import { error as logError } from './logger';

const OBJECTION_OF_THE_DAY_KEY = 'objections-app-objection-of-day';

/**
 * Get or set objection of the day
 */
export async function getObjectionOfTheDay(): Promise<ObjectionOfTheDay | null> {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(OBJECTION_OF_THE_DAY_KEY);
    if (stored) {
      const data: ObjectionOfTheDay = JSON.parse(stored);
      const today = new Date().toISOString().split('T')[0];
      
      // If it's from today, return it
      if (data.date === today) {
        return data;
      }
    }

    // Generate new objection of the day
    const objections = await getObjections();
    if (objections.length === 0) return null;

    // Select objection based on day of year for consistency
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const selectedObjection = objections[dayOfYear % objections.length];

    const objectionOfDay: ObjectionOfTheDay = {
      objectionId: selectedObjection.id,
      date: today.toISOString().split('T')[0],
      featured: true,
      insights: getInsightsForObjection(selectedObjection),
      tips: getTipsForObjection(selectedObjection),
    };

    localStorage.setItem(OBJECTION_OF_THE_DAY_KEY, JSON.stringify(objectionOfDay));
    return objectionOfDay;
  } catch (error) {
    logError('Failed to get objection of the day', error);
    return null;
  }
}

function getInsightsForObjection(objection: any): string {
  const insights: Record<string, string> = {
    '1': 'Price objections are the most common. The key is to reframe from "too expensive" to "opportunity for profit."',
    '2': 'When buyers need to run numbers, they\'re actually interested. Help them see the value while they calculate.',
    '3': '"Not interested" often means "not interested at this price/location/condition." Ask clarifying questions.',
    '4': 'Area preferences can be overcome by showing the numbers and potential ROI in that specific market.',
    '5': 'Busy buyers need convenience. Make it easy for them with flexible scheduling and clear information.',
    '6': 'Working with other wholesalers is actually a good sign - they\'re active buyers. Position yourself as another pipeline.',
    '7': '"Send it to me" is a brush-off. Get commitment by scheduling a walkthrough while they review.',
    '8': 'Properties needing work often have the best spreads. Reframe "too much work" as "bigger opportunity."',
  };

  return insights[objection.id] || 'This objection requires understanding the buyer\'s underlying concern and addressing it with empathy and value.';
}

function getTipsForObjection(objection: any): string[] {
  const tips: Record<string, string[]> = {
    '1': [
      'Reframe price as opportunity: "The spread is $35k after repairs"',
      'Invite them to see it: "Come walk it and give me your best number"',
      'Use social proof: "Most investors feel that way until they see it"',
    ],
    '2': [
      'Send information immediately while they review',
      'Schedule walkthrough proactively: "While you look at it, let\'s schedule a walkthrough"',
      'Remove risk: "If numbers don\'t match, no harm done"',
    ],
    '3': [
      'Ask clarifying questions: "Is it price, location, or condition?"',
      'Don\'t take it personally - find the real objection',
      'Keep the door open: "I\'ll keep sending you deals that fit"',
    ],
    '4': [
      'Acknowledge their preference',
      'Show the numbers work in that area',
      'Use it as a reason to walk: "Walking it helps me know what to send you"',
    ],
    '5': [
      'Acknowledge their busy schedule',
      'Create urgency: "This will move fast"',
      'Make it convenient: "I\'ll find a time that fits your schedule"',
    ],
    '6': [
      'Position as additional pipeline, not competition',
      'Highlight your volume: "We move 30-40 deals a month"',
      'Emphasize value: "Deeply discounted inventory"',
    ],
    '7': [
      'Send information immediately',
      'Get commitment: "While you review, let\'s pencil in a walkthrough"',
      'Create urgency: "So you don\'t miss it if it\'s a fit"',
    ],
    '8': [
      'Reframe as opportunity: "That\'s why the spread is so good"',
      'Explain the upside: "Heavy-rehab deals have highest upside"',
      'Invite to see: "Come walk it - you might find big equity"',
    ],
  };

  return tips[objection.id] || [
    'Acknowledge their concern with empathy',
    'Reframe the objection as an opportunity',
    'Provide specific value or numbers',
    'End with a clear next step',
  ];
}

/**
 * Check if user has seen today's tip
 */
export function hasSeenTipToday(tipId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem('objections-app-seen-tips');
    if (!stored) return false;

    const data: { tipId: string; date: string }[] = JSON.parse(stored);
    const today = new Date().toISOString().split('T')[0];
    return data.some(entry => entry.tipId === tipId && entry.date === today);
  } catch (error) {
    return false;
  }
}

/**
 * Mark tip as seen
 */
export function markTipAsSeen(tipId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem('objections-app-seen-tips');
    const data: { tipId: string; date: string }[] = stored ? JSON.parse(stored) : [];
    const today = new Date().toISOString().split('T')[0];

    // Remove old entries (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const filtered = data.filter(entry => new Date(entry.date) >= sevenDaysAgo);

    // Add new entry if not already seen today
    if (!filtered.some(entry => entry.tipId === tipId && entry.date === today)) {
      filtered.push({ tipId, date: today });
    }

    localStorage.setItem('objections-app-seen-tips', JSON.stringify(filtered));
  } catch (error) {
    logError('Failed to mark tip as seen', error);
  }
}

