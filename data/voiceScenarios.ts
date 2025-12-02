/**
 * Voice practice scenarios for realistic conversation practice
 */

import { PracticeScenario } from '@/types';

export interface VoiceScenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  context: {
    property: {
      address: string;
      arv: number;
      purchasePrice: number;
      condition: string;
      propertyType: string;
    };
    buyer: {
      type: string;
      experience: string;
      budget: number;
      concerns: string[];
    };
    market: {
      type: string;
      competition: string;
    };
  };
  agentInstructions: string; // Instructions for the AI agent
  expectedObjections: string[]; // Objection IDs that should come up
  successCriteria: string[];
}

export const voiceScenarios: VoiceScenario[] = [
  {
    id: 'first-time-investor',
    name: 'First-Time Investor',
    description: 'Practice with a new investor who is cautious and needs education.',
    difficulty: 'beginner',
    estimatedDuration: 5,
    context: {
      property: {
        address: '123 Main St, Anytown, USA',
        arv: 150000,
        purchasePrice: 85000,
        condition: 'Needs cosmetic updates',
        propertyType: 'Single-family home',
      },
      buyer: {
        type: 'first-time-investor',
        experience: 'beginner',
        budget: 100000,
        concerns: ['Not sure about the process', 'Worried about repairs', 'First deal'],
      },
      market: {
        type: 'balanced',
        competition: 'medium',
      },
    },
    agentInstructions: `You are a first-time real estate investor named Sarah. You're interested in this property but have many questions and concerns. You're cautious and need reassurance. You don't have much experience, so you ask basic questions about the process, repairs, and what to expect. Be polite but hesitant. Common objections you might raise:
- "I'm not sure if I'm ready for this"
- "What if I can't find a buyer?"
- "I don't know much about repairs"
- "This seems too good to be true"
- "Can I back out if I change my mind?"

Keep the conversation natural and educational. Acknowledge good explanations from the agent.`,
    expectedObjections: ['1', '2', '3', '4', '5'],
    successCriteria: [
      'Agent explains the process clearly',
      'Agent addresses concerns about repairs',
      'Agent builds confidence in the buyer',
      'Agent provides next steps',
    ],
  },
  {
    id: 'experienced-flipper',
    name: 'Experienced Flipper',
    description: 'Deal with a seasoned investor who knows the market and negotiates hard.',
    difficulty: 'advanced',
    estimatedDuration: 8,
    context: {
      property: {
        address: '456 Oak Avenue, Metro City',
        arv: 280000,
        purchasePrice: 165000,
        condition: 'Needs full rehab',
        propertyType: 'Single-family home',
      },
      buyer: {
        type: 'experienced-flipper',
        experience: 'advanced',
        budget: 200000,
        concerns: ['Price is too high', 'Repair costs might be more', 'Timeline concerns'],
      },
      market: {
        type: 'hot',
        competition: 'high',
      },
    },
    agentInstructions: `You are an experienced house flipper named Mike. You've done 20+ deals and know the market well. You're interested but will negotiate aggressively. You know what properties are worth and won't overpay. Be professional but firm. Push back on weak points. Common objections:
- "Price is too high for the condition"
- "I need to see the comps first"
- "What about the repair costs?"
- "I have other deals I'm looking at"
- "Can you come down on the price?"

Be realistic but challenging. Test the agent's knowledge and negotiation skills.`,
    expectedObjections: ['1', '6', '7', '8', '9'],
    successCriteria: [
      'Agent provides comps or data',
      'Agent addresses repair cost concerns',
      'Agent handles price negotiation',
      'Agent creates urgency without being pushy',
    ],
  },
  {
    id: 'price-objection',
    name: 'Price Objection Focus',
    description: 'Practice handling multiple price-related objections in one conversation.',
    difficulty: 'intermediate',
    estimatedDuration: 6,
    context: {
      property: {
        address: '789 Elm Street, Suburbia',
        arv: 200000,
        purchasePrice: 120000,
        condition: 'Good condition, minor updates needed',
        propertyType: 'Single-family home',
      },
      buyer: {
        type: 'buy-and-hold',
        experience: 'intermediate',
        budget: 150000,
        concerns: ['Price seems high', 'ROI concerns', 'Market value questions'],
      },
      market: {
        type: 'sellers-market',
        competition: 'high',
      },
    },
    agentInstructions: `You are an investor named David who is interested in this property but has concerns about the price. You'll raise various price-related objections throughout the conversation. Start with general price concerns, then get more specific. Common objections:
- "The price is too high"
- "I need to run the numbers first"
- "What's the ARV?"
- "Can you do better on the price?"
- "I'm seeing better deals elsewhere"

Be persistent but reasonable. If the agent provides good value justification, acknowledge it but find another angle.`,
    expectedObjections: ['1', '2', '6', '7', '10'],
    successCriteria: [
      'Agent explains value proposition',
      'Agent provides ARV and spread',
      'Agent handles multiple price objections',
      'Agent maintains value without devaluing',
    ],
  },
  {
    id: 'timing-concerns',
    name: 'Timing & Urgency',
    description: 'Practice creating urgency while handling timing objections.',
    difficulty: 'intermediate',
    estimatedDuration: 7,
    context: {
      property: {
        address: '321 Pine Road, Downtown',
        arv: 175000,
        purchasePrice: 95000,
        condition: 'Fair condition, needs work',
        propertyType: 'Single-family home',
      },
      buyer: {
        type: 'cash-buyer',
        experience: 'intermediate',
        budget: 120000,
        concerns: ['Need more time', 'Want to think about it', 'Not in a rush'],
      },
      market: {
        type: 'hot',
        competition: 'high',
      },
    },
    agentInstructions: `You are an investor named Lisa who is interested but not in a hurry. You'll raise timing-related objections and want to take your time. You're not easily pressured. Common objections:
- "I need to think about it"
- "I'm not in a rush"
- "Can I get back to you?"
- "I need to check with my partner"
- "Let me sleep on it"

Be polite but resistant to urgency. If the agent creates good urgency, acknowledge it but still want time.`,
    expectedObjections: ['2', '11', '12', '13', '14'],
    successCriteria: [
      'Agent creates appropriate urgency',
      'Agent handles timing objections',
      'Agent gets commitment to next step',
      'Agent balances urgency with respect',
    ],
  },
  {
    id: 'trust-building',
    name: 'Building Trust',
    description: 'Practice building rapport and trust with a skeptical buyer.',
    difficulty: 'beginner',
    estimatedDuration: 6,
    context: {
      property: {
        address: '555 Maple Drive, Riverside',
        arv: 160000,
        purchasePrice: 100000,
        condition: 'Good condition',
        propertyType: 'Single-family home',
      },
      buyer: {
        type: 'new-agent',
        experience: 'beginner',
        budget: 120000,
        concerns: ['Not sure I can trust this', 'Is this legitimate?', 'Who are you?'],
      },
      market: {
        type: 'balanced',
        competition: 'low',
      },
    },
    agentInstructions: `You are a new investor named Tom who is interested but very skeptical. You've heard about scams and are cautious. You need to build trust before moving forward. Common objections:
- "How do I know this is real?"
- "Can I trust you?"
- "What's your track record?"
- "Why should I believe you?"
- "This seems too good to be true"

Be skeptical but open to being convinced. If the agent builds good rapport and provides proof, become more trusting.`,
    expectedObjections: ['15', '16', '17', '18', '19'],
    successCriteria: [
      'Agent builds rapport',
      'Agent provides credibility markers',
      'Agent addresses trust concerns',
      'Agent creates comfort and safety',
    ],
  },
];

/**
 * Get scenarios by difficulty level
 */
export function getVoiceScenariosByDifficulty(
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'all'
): VoiceScenario[] {
  if (!difficulty || difficulty === 'all') {
    return voiceScenarios;
  }
  return voiceScenarios.filter(s => s.difficulty === difficulty);
}

/**
 * Get a scenario by ID
 */
export function getVoiceScenarioById(id: string): VoiceScenario | undefined {
  return voiceScenarios.find(s => s.id === id);
}

