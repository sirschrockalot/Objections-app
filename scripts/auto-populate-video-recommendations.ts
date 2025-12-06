/**
 * Script to automatically search YouTube channels and categorize videos
 * for objection handling recommendations
 * 
 * Requirements:
 * - YouTube Data API v3 key (set YOUTUBE_API_KEY in .env.local)
 * - OpenAI API key (set OPENAI_API_KEY in .env.local)
 * 
 * Usage: npx tsx scripts/auto-populate-video-recommendations.ts
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Channel configurations
const CHANNELS = {
  'Tony Mont': {
    handle: '@thetonymont',
    url: 'https://www.youtube.com/@thetonymont',
    channelId: null as string | null, // Will be fetched
  },
  'Eric Cline': {
    handle: '@ericclineofficial',
    url: 'https://www.youtube.com/@ericclineofficial',
    channelId: null as string | null,
  },
  'Andy Elliott': {
    handle: '@AndyElliottOfficial',
    url: 'https://www.youtube.com/@AndyElliottOfficial',
    channelId: null as string | null,
  },
};

// Objection categories
const CATEGORIES = ['Price', 'Timing', 'Trust', 'Property', 'Financial', 'Interest'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  duration?: string;
  viewCount?: number;
}

interface CategorizedVideo {
  id: string;
  title: string;
  url: string;
  creator: 'Andy Elliott' | 'Eric Cline' | 'Tony Mont';
  category: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  thumbnail?: string;
}

/**
 * Get channel ID from channel handle using YouTube Data API
 */
async function getChannelId(handle: string, apiKey: string): Promise<string | null> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(handle)}&type=channel&key=${apiKey}&maxResults=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.channelId;
    }

    // Try alternative: search by channel handle directly
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handle.replace('@', '')}&key=${apiKey}`;
    const channelResponse = await fetch(channelUrl);
    const channelData = await channelResponse.json();

    if (channelData.items && channelData.items.length > 0) {
      return channelData.items[0].id;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching channel ID for ${handle}:`, error);
    return null;
  }
}

/**
 * Search for videos on a channel using YouTube Data API
 */
async function searchChannelVideos(
  channelId: string,
  apiKey: string,
  maxResults: number = 50
): Promise<YouTubeVideo[]> {
  try {
    const searchTerms = [
      'objection',
      'objection handling',
      'sales objection',
      'price objection',
      'overcome objection',
      'real estate objection',
      'seller objection',
      'wholesaling objection',
      'negotiation',
      'sales technique',
      'closing',
      'persuasion',
    ];

    const allVideos: YouTubeVideo[] = [];

    for (const term of searchTerms) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&q=${encodeURIComponent(term)}&type=video&key=${apiKey}&maxResults=${Math.ceil(maxResults / searchTerms.length)}&order=relevance`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.items) {
        for (const item of data.items) {
          // Get video details
          const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${item.id.videoId}&key=${apiKey}`;
          const detailsResponse = await fetch(videoDetailsUrl);
          const detailsData = await detailsResponse.json();

          if (detailsData.items && detailsData.items.length > 0) {
            const video = detailsData.items[0];
            const videoUrl = `https://www.youtube.com/watch?v=${item.id.videoId}`;

            // Check if we already have this video
            if (!allVideos.find(v => v.id === item.id.videoId)) {
              allVideos.push({
                id: item.id.videoId,
                title: video.snippet.title,
                description: video.snippet.description || '',
                url: videoUrl,
                channelId: video.snippet.channelId,
                channelTitle: video.snippet.channelTitle,
                publishedAt: video.snippet.publishedAt,
                thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url || '',
                viewCount: parseInt(video.statistics?.viewCount || '0'),
              });
            }
          }
        }
      }

      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return allVideos;
  } catch (error) {
    console.error(`Error searching videos for channel ${channelId}:`, error);
    return [];
  }
}

/**
 * Use OpenAI to categorize a video
 */
async function categorizeVideoWithAI(
  video: YouTubeVideo,
  creator: string,
  apiKey: string
): Promise<CategorizedVideo | null> {
  try {
    const prompt = `You are analyzing a YouTube video about real estate wholesaling and sales. Categorize this video based on objection handling topics.

Video Title: ${video.title}
Video Description: ${video.description.substring(0, 500)}

Objection Categories:
- Price: Videos about price negotiations, low offers, value discussions, pricing objections
- Timing: Videos about urgency, "I need time", scheduling, timeline objections
- Trust: Videos about building credibility, trust, rapport, trust objections
- Property: Videos about property condition, location, repairs, property objections
- Financial: Videos about money, financing, cash offers, financial objections
- Interest: Videos about generating interest, "not interested" responses, interest objections

Difficulty Levels:
- beginner: Basic concepts, fundamentals, introductory content
- intermediate: More advanced techniques, specific strategies
- advanced: Master-level, complex scenarios, expert techniques

Analyze the video and determine:
1. Which objection categories it covers (can be multiple)
2. The difficulty level (beginner, intermediate, or advanced)
3. A brief description (1-2 sentences)

Respond in JSON format:
{
  "categories": ["Price", "Timing", ...], // Array of relevant categories
  "difficulty": "beginner" | "intermediate" | "advanced",
  "description": "Brief description of what the video covers",
  "relevant": true // false if video is not about objection handling
}

Only return videos that are relevant to objection handling. If the video is not about objection handling, set "relevant" to false.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at categorizing educational content about real estate sales and objection handling.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return null;
    }

    const analysis = JSON.parse(content);

    if (!analysis.relevant || !analysis.categories || analysis.categories.length === 0) {
      return null;
    }

    return {
      id: uuidv4(),
      title: video.title,
      url: video.url,
      creator: creator as 'Andy Elliott' | 'Eric Cline' | 'Tony Mont',
      category: analysis.categories,
      difficulty: analysis.difficulty || 'intermediate',
      description: analysis.description || '',
      thumbnail: video.thumbnail,
    };
  } catch (error) {
    console.error(`Error categorizing video ${video.id}:`, error);
    return null;
  }
}

/**
 * Generate video recommendations file
 */
function generateVideoRecommendationsFile(categorizedVideos: CategorizedVideo[]): string {
  // Group by category and difficulty
  const byCategory: Record<string, Record<string, CategorizedVideo[]>> = {};

  for (const video of categorizedVideos) {
    for (const category of video.category) {
      if (!byCategory[category]) {
        byCategory[category] = {};
      }
      const difficulty = video.difficulty || 'intermediate';
      if (!byCategory[category][difficulty]) {
        byCategory[category][difficulty] = [];
      }
      byCategory[category][difficulty].push(video);
    }
  }

  // Build the file content
  let content = `/**
 * YouTube video recommendations from top real estate wholesaling experts
 * Organized by objection category and difficulty level
 * 
 * Channel URLs:
 * - Tony Mont: https://www.youtube.com/@thetonymont
 * - Eric Cline: https://www.youtube.com/@ericclineofficial
 * - Andy Elliott: https://www.youtube.com/@AndyElliottOfficial
 * 
 * This file is auto-generated by scripts/auto-populate-video-recommendations.ts
 * Last updated: ${new Date().toISOString()}
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
`;

  // Add videos organized by category
  for (const category of CATEGORIES) {
    if (byCategory[category]) {
      content += `  // ${category} Objections\n`;
      
      for (const difficulty of DIFFICULTIES) {
        if (byCategory[category][difficulty]) {
          // Get one video per creator for this category-difficulty combination
          const creators = ['Andy Elliott', 'Eric Cline', 'Tony Mont'] as const;
          for (const creator of creators) {
            const creatorVideos = byCategory[category][difficulty].filter(v => v.creator === creator);
            if (creatorVideos.length > 0) {
              // Take the first video from this creator
              const selectedVideo = creatorVideos[0];
              content += `  {
    id: '${selectedVideo.id}',
    title: ${JSON.stringify(selectedVideo.title)},
    url: '${selectedVideo.url}',
    creator: '${selectedVideo.creator}',
    category: ${JSON.stringify(selectedVideo.category)},
    difficulty: '${selectedVideo.difficulty}',
    description: ${JSON.stringify(selectedVideo.description || '')},
    thumbnail: ${selectedVideo.thumbnail ? `'${selectedVideo.thumbnail}'` : 'undefined'},
  },
`;
            }
          }
        }
      }
    }
  }

  // Add general videos
  content += `  // General/Objection Handling
`;

  // Get general videos (videos that cover multiple categories)
  const generalVideos = categorizedVideos.filter(v => v.category.length >= 3);
  for (const difficulty of DIFFICULTIES) {
    const difficultyVideos = generalVideos.filter(v => v.difficulty === difficulty);
    for (const creator of ['Andy Elliott', 'Eric Cline', 'Tony Mont'] as const) {
      const creatorVideo = difficultyVideos.find(v => v.creator === creator);
      if (creatorVideo) {
        content += `  {
    id: '${creatorVideo.id}',
    title: ${JSON.stringify(creatorVideo.title)},
    url: '${creatorVideo.url}',
    creator: '${creatorVideo.creator}',
    category: ${JSON.stringify(creatorVideo.category)},
    difficulty: '${creatorVideo.difficulty}',
    description: ${JSON.stringify(creatorVideo.description || '')},
    thumbnail: ${creatorVideo.thumbnail ? `'${creatorVideo.thumbnail}'` : 'undefined'},
  },
`;
      }
    }
  }

  content += `];

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
`;

  return content;
}

/**
 * Main function
 */
async function main() {
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  if (!youtubeApiKey) {
    console.error('❌ Error: YOUTUBE_API_KEY not found in environment variables');
    console.error('   Get your API key from: https://console.cloud.google.com/apis/credentials');
    process.exit(1);
  }

  if (!openaiApiKey) {
    console.error('❌ Error: OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY not found');
    console.error('   Get your API key from: https://platform.openai.com/api-keys');
    process.exit(1);
  }

  console.log('🚀 Starting video recommendation population...\n');

  // Step 1: Get channel IDs
  console.log('📺 Fetching channel IDs...');
  for (const [creator, config] of Object.entries(CHANNELS)) {
    console.log(`   Fetching ${creator}...`);
    const channelId = await getChannelId(config.handle, youtubeApiKey);
    if (channelId) {
      CHANNELS[creator as keyof typeof CHANNELS].channelId = channelId;
      console.log(`   ✅ Found channel ID: ${channelId}`);
    } else {
      console.log(`   ⚠️  Could not find channel ID for ${creator}`);
    }
    await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
  }

  // Step 2: Search for videos
  console.log('\n🔍 Searching for videos...');
  const allVideos: YouTubeVideo[] = [];
  for (const [creator, config] of Object.entries(CHANNELS)) {
    if (config.channelId) {
      console.log(`   Searching ${creator}...`);
      const videos = await searchChannelVideos(config.channelId, youtubeApiKey, 30);
      console.log(`   ✅ Found ${videos.length} videos`);
      allVideos.push(...videos);
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
  }

  console.log(`\n📊 Total videos found: ${allVideos.length}`);

  // Step 3: Categorize videos with AI
  console.log('\n🤖 Categorizing videos with AI...');
  const categorizedVideos: CategorizedVideo[] = [];
  let processed = 0;

  for (const video of allVideos) {
    const creator = Object.keys(CHANNELS).find(
      c => video.channelTitle.includes(c.split(' ')[0]) || video.channelTitle.includes(c)
    ) || 'Andy Elliott';

    console.log(`   Processing: ${video.title.substring(0, 50)}...`);
    const categorized = await categorizeVideoWithAI(video, creator, openaiApiKey);

    if (categorized) {
      categorizedVideos.push(categorized);
      console.log(`   ✅ Categorized: ${categorized.category.join(', ')} - ${categorized.difficulty}`);
    } else {
      console.log(`   ⏭️  Skipped (not relevant)`);
    }

    processed++;
    if (processed % 10 === 0) {
      console.log(`   Progress: ${processed}/${allVideos.length}`);
    }

    await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
  }

  console.log(`\n✅ Categorized ${categorizedVideos.length} relevant videos`);

  // Step 4: Generate file
  console.log('\n📝 Generating videoRecommendations.ts...');
  const fileContent = generateVideoRecommendationsFile(categorizedVideos);
  const filePath = path.join(process.cwd(), 'data', 'videoRecommendations.ts');
  fs.writeFileSync(filePath, fileContent, 'utf-8');
  console.log(`   ✅ Saved to ${filePath}`);

  console.log('\n🎉 Video recommendations populated successfully!');
  console.log(`   Total videos: ${categorizedVideos.length}`);
  console.log(`   Categories: ${new Set(categorizedVideos.flatMap(v => v.category)).size}`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});