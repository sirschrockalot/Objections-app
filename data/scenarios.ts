import { PracticeScenario } from '@/types';
import { initialObjections } from './objections';

export const practiceScenarios: PracticeScenario[] = [
  {
    id: 'scenario-1',
    title: 'First-Time Investor in Hot Market',
    description: 'A new investor is interested in their first deal but is hesitant about the price and process.',
    property: {
      address: '123 Main St, Phoenix, AZ',
      arv: 250000,
      purchasePrice: 180000,
      repairEstimate: 35000,
      propertyType: 'single-family',
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1500,
      lotSize: '0.25 acres',
      condition: 'needs-rehab',
      notes: 'Needs new roof, HVAC, and kitchen update. Good neighborhood with strong comps.',
    },
    buyer: {
      type: 'first-time-investor',
      experience: 'beginner',
      budget: 200000,
      goals: ['Learn the process', 'Make first profit', 'Build portfolio'],
      concerns: ['Price seems high', 'Unsure about repairs', 'First deal anxiety'],
      name: 'Sarah',
      background: 'Recently saved up $50k for first investment. Has been watching YouTube videos about house flipping.',
    },
    market: {
      marketType: 'hot',
      inventory: 'low',
      competition: 'high',
      averageDaysOnMarket: 12,
      notes: 'Properties are selling fast. Multiple offers common.',
    },
    objections: [
      {
        objectionId: '1', // Price is too high
        order: 1,
        followUp: {
          responses: [
            "I've seen similar properties for less",
            "I don't think I can make money at that price",
            "Can you come down on the price?",
          ],
          nextObjectionId: '2', // What's the catch?
        },
      },
      {
        objectionId: '1', // Price is too high (follow-up)
        order: 2,
      },
    ],
    difficulty: 'beginner',
    estimatedDuration: 10,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'scenario-2',
    title: 'Experienced Flipper in Slow Market',
    description: 'A seasoned flipper is interested but concerned about market conditions and timing.',
    property: {
      address: '456 Oak Ave, Tampa, FL',
      arv: 320000,
      purchasePrice: 220000,
      repairEstimate: 45000,
      propertyType: 'single-family',
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2200,
      lotSize: '0.3 acres',
      condition: 'fair',
      notes: 'Needs cosmetic updates and some structural work. Great location near schools.',
    },
    buyer: {
      type: 'experienced-flipper',
      experience: 'advanced',
      budget: 300000,
      goals: ['Quick flip', 'Maximize profit', 'Minimize risk'],
      concerns: ['Market is slowing', 'Repair costs might be higher', 'Holding costs'],
      name: 'Mike',
      background: 'Has flipped 15+ properties. Very numbers-focused and analytical.',
    },
    market: {
      marketType: 'slow',
      inventory: 'high',
      competition: 'low',
      averageDaysOnMarket: 45,
      notes: 'Market is cooling. Properties sitting longer. More negotiation room.',
    },
    objections: [
      {
        objectionId: '3', // Market is slowing
        order: 1,
        followUp: {
          responses: [
            "I'm worried about holding costs if it doesn't sell quickly",
            "What if the market drops while I'm renovating?",
            "I've seen prices dropping in this area",
          ],
        },
      },
      {
        objectionId: '3', // I'm not interested
        order: 2,
      },
    ],
    difficulty: 'intermediate',
    estimatedDuration: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'scenario-3',
    title: 'Buy-and-Hold Investor with Financing Concerns',
    description: 'An investor wants to buy and hold but has concerns about financing and property condition.',
    property: {
      address: '789 Pine Rd, Atlanta, GA',
      arv: 195000,
      purchasePrice: 140000,
      repairEstimate: 28000,
      propertyType: 'multi-family',
      bedrooms: 6, // 3 per unit
      bathrooms: 4, // 2 per unit
      squareFeet: 2400,
      lotSize: '0.2 acres',
      condition: 'poor',
      notes: 'Duplex. Needs significant work but great rental potential. Both units need full renovation.',
    },
    buyer: {
      type: 'buy-and-hold',
      experience: 'intermediate',
      budget: 180000,
      goals: ['Long-term rental income', 'Build wealth', 'Tax benefits'],
      concerns: ['Financing might be difficult', 'Property needs too much work', 'Rental market uncertainty'],
      name: 'Jennifer',
      background: 'Has 3 rental properties already. Looking to expand portfolio but cautious about cash flow.',
    },
    market: {
      marketType: 'balanced',
      inventory: 'medium',
      competition: 'medium',
      averageDaysOnMarket: 28,
      notes: 'Stable market. Good rental demand in area.',
    },
    objections: [
      {
        objectionId: '5', // Not liquid / financing concerns
        order: 1,
        followUp: {
          responses: [
            "I'm not sure I can get financing for a property in this condition",
            "The bank might not appraise it high enough",
            "I need to check with my lender first",
          ],
        },
      },
      {
        objectionId: '6', // Property needs too much work
        order: 2,
      },
    ],
    difficulty: 'intermediate',
    estimatedDuration: 12,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'scenario-4',
    title: 'Cash Buyer with Trust Issues',
    description: 'A cash buyer is interested but doesn\'t trust wholesalers and has concerns about the assignment process.',
    property: {
      address: '321 Elm St, Dallas, TX',
      arv: 280000,
      purchasePrice: 195000,
      repairEstimate: 40000,
      propertyType: 'single-family',
      bedrooms: 3,
      bathrooms: 2.5,
      squareFeet: 1800,
      lotSize: '0.22 acres',
      condition: 'good',
      notes: 'Well-maintained but dated. Needs cosmetic updates. Strong rental area.',
    },
    buyer: {
      type: 'cash-buyer',
      experience: 'advanced',
      budget: 250000,
      goals: ['Quick close', 'No financing delays', 'Good deal'],
      concerns: ['Assignment fees', 'Wholesaler reputation', 'Hidden issues'],
      name: 'Robert',
      background: 'Professional investor with cash ready. Has been burned by wholesalers before.',
    },
    market: {
      marketType: 'buyers-market',
      inventory: 'high',
      competition: 'low',
      averageDaysOnMarket: 60,
      notes: 'More inventory than buyers. Good negotiating position.',
    },
    objections: [
      {
        objectionId: '7', // Don't trust wholesalers
        order: 1,
        followUp: {
          responses: [
            "I've had bad experiences with wholesalers before",
            "How do I know this isn't a scam?",
            "Why should I trust you?",
          ],
        },
      },
      {
        objectionId: '6', // I'm already working with other wholesalers
        order: 2,
      },
    ],
    difficulty: 'advanced',
    estimatedDuration: 15,
    createdAt: new Date().toISOString(),
  },
];

export function getScenarioById(id: string): PracticeScenario | undefined {
  return practiceScenarios.find(s => s.id === id);
}

export function getScenariosByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): PracticeScenario[] {
  return practiceScenarios.filter(s => s.difficulty === difficulty);
}

