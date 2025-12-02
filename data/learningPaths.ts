import { LearningPath } from '@/types';
import { initialObjections } from './objections';

/**
 * Beginner Path - Start with easy objections, progress to advanced
 */
export const beginnerPath: LearningPath = {
  id: 'beginner-path',
  name: 'Beginner Path',
  description: 'Start with easy objections and gradually progress to more advanced ones. Perfect for new agents.',
  type: 'beginner',
  difficulty: 'beginner',
  objections: [
    // Start with beginner difficulty objections
    '1', // Price is too high
    '2', // I need to run the numbers first
    '3', // I'm not interested
    '5', // I'm too busy
    '7', // Send it to me and I'll look later
    '16', // I want the seller to make repairs first
    '19', // Your photos don't show enough
    '20', // Call me back later
    // Then move to intermediate
    '4', // I only buy in certain areas
    '6', // I'm already working with other wholesalers
    '8', // This needs too much work
    '10', // The neighborhood isn't great
    '11', // I'm not liquid right now
    '15', // I don't want to get into a bidding war
    '18', // I'll wait for something better
    // Finally advanced
    '9', // It's not worth that ARV
    '12', // My lender won't approve it
    '13', // Is this an assignment? I don't like assignments
    '14', // I don't pay both sides of closing costs
    '17', // I don't trust wholesalers
  ],
  estimatedDuration: 120, // 2 hours total
  rewards: {
    points: 100,
    badge: 'Path Master',
  },
  createdAt: new Date().toISOString(),
};

/**
 * Category Mastery Paths - Complete all objections in a category
 */
export const categoryMasteryPaths: LearningPath[] = [
  {
    id: 'price-mastery',
    name: 'Price Objection Mastery',
    description: 'Master all price-related objections. Learn to handle concerns about pricing, ARV, and value.',
    type: 'category-mastery',
    difficulty: 'intermediate',
    category: 'Price',
    objections: ['1', '9'], // All price objections
    estimatedDuration: 30,
    rewards: {
      points: 50,
      badge: 'Price Master',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'timing-mastery',
    name: 'Timing Objection Mastery',
    description: 'Master all timing-related objections. Learn to handle delays, scheduling, and urgency concerns.',
    type: 'category-mastery',
    difficulty: 'beginner',
    category: 'Timing',
    objections: ['2', '5', '7', '11', '20'], // All timing objections
    estimatedDuration: 45,
    rewards: {
      points: 50,
      badge: 'Timing Master',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'trust-mastery',
    name: 'Trust Objection Mastery',
    description: 'Master all trust-related objections. Learn to build credibility and address wholesaler concerns.',
    type: 'category-mastery',
    difficulty: 'advanced',
    category: 'Trust',
    objections: ['6', '13', '17'], // All trust objections
    estimatedDuration: 40,
    rewards: {
      points: 50,
      badge: 'Trust Master',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'property-mastery',
    name: 'Property Objection Mastery',
    description: 'Master all property-related objections. Learn to handle concerns about condition, location, and repairs.',
    type: 'category-mastery',
    difficulty: 'intermediate',
    category: 'Property',
    objections: ['8', '10', '19'], // All property objections
    estimatedDuration: 35,
    rewards: {
      points: 50,
      badge: 'Property Master',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'financial-mastery',
    name: 'Financial Objection Mastery',
    description: 'Master all financial-related objections. Learn to handle concerns about financing, liquidity, and costs.',
    type: 'category-mastery',
    difficulty: 'advanced',
    category: 'Financial',
    objections: ['12', '14'], // All financial objections
    estimatedDuration: 25,
    rewards: {
      points: 50,
      badge: 'Financial Master',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'interest-mastery',
    name: 'Interest Objection Mastery',
    description: 'Master all interest-related objections. Learn to handle concerns about interest level, preferences, and alternatives.',
    type: 'category-mastery',
    difficulty: 'intermediate',
    category: 'Interest',
    objections: ['3', '4', '15', '16', '18'], // All interest objections
    estimatedDuration: 50,
    rewards: {
      points: 50,
      badge: 'Interest Master',
    },
    createdAt: new Date().toISOString(),
  },
];

/**
 * Get all available learning paths
 */
export function getAllLearningPaths(): LearningPath[] {
  return [beginnerPath, ...categoryMasteryPaths];
}

/**
 * Get learning path by ID
 */
export function getLearningPathById(id: string): LearningPath | undefined {
  const allPaths = getAllLearningPaths();
  return allPaths.find(path => path.id === id);
}

/**
 * Get paths by type
 */
export function getLearningPathsByType(type: LearningPath['type']): LearningPath[] {
  const allPaths = getAllLearningPaths();
  return allPaths.filter(path => path.type === type);
}

/**
 * Get category mastery paths
 */
export function getCategoryMasteryPaths(): LearningPath[] {
  return categoryMasteryPaths;
}

/**
 * Get beginner path
 */
export function getBeginnerPath(): LearningPath {
  return beginnerPath;
}

/**
 * Check if user has completed prerequisites for a path
 */
export function hasCompletedPrerequisites(pathId: string, completedPaths: string[]): boolean {
  const path = getLearningPathById(pathId);
  if (!path || !path.prerequisites || path.prerequisites.length === 0) {
    return true; // No prerequisites
  }
  return path.prerequisites.every(prereqId => completedPaths.includes(prereqId));
}

