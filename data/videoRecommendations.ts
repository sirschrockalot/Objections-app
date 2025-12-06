/**
 * YouTube video recommendations from top real estate wholesaling experts
 * Organized by objection category and difficulty level
 * 
 * Channel URLs:
 * - Tony Mont: https://www.youtube.com/@thetonymont
 * - Eric Cline: https://www.youtube.com/@ericclineofficial
 * - Andy Elliott: https://www.youtube.com/@AndyElliottOfficial
 * 
 * NOTE: The video URLs are placeholders. Replace them with actual YouTube video URLs
 * from the channels above.
 * 
 * To find and add videos:
 * 1. Visit each channel URL above
 * 2. Search for videos about objection handling, sales techniques, and real estate wholesaling
 * 3. Look for videos that match the category and difficulty level
 * 4. Copy the video URL (right-click video > Copy video URL)
 * 5. Replace the placeholder URL in the corresponding video object below
 * 6. Update the title and description to match the actual video content
 */

export interface VideoRecommendation {
  id: string;
  title: string;
  url: string;
  creator: 'Andy Elliott' | 'Eric Cline' | 'Tony Mont';
  category: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  thumbnail?: string;
}

export const videoRecommendations: VideoRecommendation[] = [
  // Price Objections
  {
    id: 'price-1',
    title: 'How to Handle Price Objections in Real Estate',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder - replace with actual video
    creator: 'Andy Elliott',
    category: ['Price'],
    difficulty: 'beginner',
    description: 'Learn proven techniques to overcome price objections from sellers',
  },
  {
    id: 'price-2',
    title: 'Price Objections: The Complete Guide',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Eric Cline',
    category: ['Price'],
    difficulty: 'intermediate',
    description: 'Advanced strategies for handling price negotiations',
  },
  {
    id: 'price-3',
    title: 'Turning Price Objections into Closes',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Tony Mont',
    category: ['Price'],
    difficulty: 'advanced',
    description: 'Master-level techniques for price objection handling',
  },

  // Timing Objections
  {
    id: 'timing-1',
    title: 'Overcoming "I Need More Time" Objections',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Andy Elliott',
    category: ['Timing'],
    difficulty: 'beginner',
    description: 'How to create urgency and handle timing objections',
  },
  {
    id: 'timing-2',
    title: 'Timing Objections: Creating Urgency',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Eric Cline',
    category: ['Timing'],
    difficulty: 'intermediate',
    description: 'Advanced techniques for managing seller timelines',
  },
  {
    id: 'timing-3',
    title: 'The Psychology of Timing in Real Estate',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Tony Mont',
    category: ['Timing'],
    difficulty: 'advanced',
    description: 'Deep dive into timing psychology and objection handling',
  },

  // Trust Objections
  {
    id: 'trust-1',
    title: 'Building Trust with Sellers',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Andy Elliott',
    category: ['Trust'],
    difficulty: 'beginner',
    description: 'Fundamentals of building credibility and trust',
  },
  {
    id: 'trust-2',
    title: 'Overcoming Trust Objections',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Eric Cline',
    category: ['Trust'],
    difficulty: 'intermediate',
    description: 'Strategies for establishing trust quickly',
  },
  {
    id: 'trust-3',
    title: 'Trust-Based Selling in Wholesaling',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Tony Mont',
    category: ['Trust'],
    difficulty: 'advanced',
    description: 'Advanced trust-building techniques',
  },

  // Property Objections
  {
    id: 'property-1',
    title: 'Handling Property Condition Objections',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Andy Elliott',
    category: ['Property'],
    difficulty: 'beginner',
    description: 'How to address concerns about property condition',
  },
  {
    id: 'property-2',
    title: 'Property Objections: Location and Value',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Eric Cline',
    category: ['Property'],
    difficulty: 'intermediate',
    description: 'Addressing location and valuation concerns',
  },
  {
    id: 'property-3',
    title: 'Advanced Property Analysis Objections',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Tony Mont',
    category: ['Property'],
    difficulty: 'advanced',
    description: 'Complex property-related objection handling',
  },

  // Financial Objections
  {
    id: 'financial-1',
    title: 'Financial Objections: The Basics',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Andy Elliott',
    category: ['Financial'],
    difficulty: 'beginner',
    description: 'Fundamentals of handling financial concerns',
  },
  {
    id: 'financial-2',
    title: 'Overcoming Financial Objections',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Eric Cline',
    category: ['Financial'],
    difficulty: 'intermediate',
    description: 'Strategies for financial objection handling',
  },
  {
    id: 'financial-3',
    title: 'Complex Financial Negotiations',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Tony Mont',
    category: ['Financial'],
    difficulty: 'advanced',
    description: 'Advanced financial objection techniques',
  },

  // Interest Objections
  {
    id: 'interest-1',
    title: 'Converting "Not Interested" to Interested',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Andy Elliott',
    category: ['Interest'],
    difficulty: 'beginner',
    description: 'Basic techniques for generating interest',
  },
  {
    id: 'interest-2',
    title: 'Interest Objections: Re-engagement Strategies',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Eric Cline',
    category: ['Interest'],
    difficulty: 'intermediate',
    description: 'How to re-engage disinterested sellers',
  },
  {
    id: 'interest-3',
    title: 'Advanced Interest Generation',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Tony Mont',
    category: ['Interest'],
    difficulty: 'advanced',
    description: 'Master-level interest generation techniques',
  },

  // General/Objection Handling
  {
    id: 'general-1',
    title: 'The Complete Guide to Objection Handling',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Andy Elliott',
    category: ['Price', 'Timing', 'Trust', 'Property', 'Financial', 'Interest'],
    difficulty: 'beginner',
    description: 'Comprehensive guide to handling all types of objections',
  },
  {
    id: 'general-2',
    title: 'Objection Handling Masterclass',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Eric Cline',
    category: ['Price', 'Timing', 'Trust', 'Property', 'Financial', 'Interest'],
    difficulty: 'intermediate',
    description: 'Advanced objection handling strategies',
  },
  {
    id: 'general-3',
    title: 'Elite Objection Handling Techniques',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    creator: 'Tony Mont',
    category: ['Price', 'Timing', 'Trust', 'Property', 'Financial', 'Interest'],
    difficulty: 'advanced',
    description: 'Master-level objection handling for top performers',
  },
];

/**
 * Get video recommendations for a specific objection category and difficulty
 */
export function getVideoRecommendations(
  category: string,
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
): VideoRecommendation[] {
  let recommendations = videoRecommendations.filter(video =>
    video.category.includes(category) || video.category.includes('General')
  );

  // Filter by difficulty if specified
  if (difficulty) {
    recommendations = recommendations.filter(
      video => !video.difficulty || video.difficulty === difficulty
    );
  }

  // Prioritize category-specific videos over general ones
  const categorySpecific = recommendations.filter(v => v.category.includes(category));
  const general = recommendations.filter(v => !v.category.includes(category));

  // Return category-specific first, then general, limit to 3
  return [...categorySpecific, ...general].slice(0, 3);
}

/**
 * Get all videos from a specific creator
 */
export function getVideosByCreator(creator: 'Andy Elliott' | 'Eric Cline' | 'Tony Mont'): VideoRecommendation[] {
  return videoRecommendations.filter(video => video.creator === creator);
}

