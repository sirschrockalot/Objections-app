# YouTube Video Recommendations Feature

## Overview

This feature recommends YouTube videos from top real estate wholesaling experts (Andy Elliott, Eric Cline, and Tony Mont) based on the type of objection being practiced. The recommendations appear in the ObjectionCard component and help users learn from industry experts.

## How It Works

1. **Contextual Recommendations**: Videos are recommended based on:
   - Objection category (Price, Timing, Trust, Property, Financial, Interest)
   - Difficulty level (beginner, intermediate, advanced)

2. **Smart Filtering**: The system prioritizes:
   - Category-specific videos first
   - Videos matching the objection's difficulty level
   - General objection handling videos as fallback

3. **User Experience**:
   - Videos appear in a collapsible card below the objection responses
   - Users can expand/collapse the recommendations
   - Clicking "Watch" opens the video in a new tab
   - Each video shows the creator, difficulty level, and description

## Files Created

1. **`data/videoRecommendations.ts`**:
   - Contains the video recommendation data structure
   - Includes filtering functions (`getVideoRecommendations`, `getVideosByCreator`)
   - Currently has placeholder URLs that need to be replaced

2. **`components/VideoRecommendations.tsx`**:
   - React component that displays video recommendations
   - Integrated into `ObjectionCard.tsx`
   - Features expandable/collapsible UI with smooth animations

## Integration

The `VideoRecommendations` component is automatically displayed in the `ObjectionCard` component for every objection. It appears below the responses section and adapts to the objection's category and difficulty.

## Adding Video Recommendations

You have two options for adding video recommendations:

### Option 1: Automatic (Recommended) 🤖

Use the automated script to search YouTube channels and categorize videos with AI:

1. **Set up YouTube Data API**:
   - Get a YouTube Data API v3 key from Google Cloud Console
   - See `YOUTUBE_API_SETUP.md` for detailed instructions
   - Add `YOUTUBE_API_KEY` to your `.env.local` file

2. **Run the Auto-Population Script**:
   ```bash
   npx tsx scripts/auto-populate-video-recommendations.ts
   ```

   The script will:
   - Search each creator's channel for relevant videos
   - Use AI to categorize videos by objection type and difficulty
   - Automatically generate `data/videoRecommendations.ts`

### Option 2: Manual 📝

Manually add videos by visiting each channel:

#### Channel URLs

- **Tony Mont**: https://www.youtube.com/@thetonymont
- **Eric Cline**: https://www.youtube.com/@ericclineofficial
- **Andy Elliott**: https://www.youtube.com/@AndyElliottOfficial

#### Steps

1. **Visit Each Channel**: Open the channel URLs above
2. **Find Relevant Videos**: Search for videos about objection handling, sales techniques, etc.
3. **Get Video URLs**: Copy the video URL from YouTube
4. **Update the Data File**: Edit `data/videoRecommendations.ts` with the actual URLs

See `scripts/find-youtube-videos.md` for detailed manual instructions.

3. **Optional Enhancements**:
   - Add video thumbnails (YouTube provides thumbnail URLs)
   - Add video duration
   - Add view counts or ratings
   - Add tags for better filtering

## Example Video URL Format

YouTube video URLs typically look like:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`

## Video Categories

Videos are organized by objection category:

- **Price**: Videos about handling price objections
- **Timing**: Videos about timing and urgency objections
- **Trust**: Videos about building trust and credibility
- **Property**: Videos about property condition and location objections
- **Financial**: Videos about financial concerns and objections
- **Interest**: Videos about generating and maintaining interest

Each category has videos at beginner, intermediate, and advanced difficulty levels.

## Analytics

The component includes analytics tracking (if Google Analytics is configured):
- Tracks video clicks
- Records video ID, title, creator, category, and difficulty

## Future Enhancements

Potential improvements:
1. **Video Search API**: Automatically find and update videos from creators' channels
2. **User Preferences**: Allow users to favorite videos or mark as watched
3. **Progress Tracking**: Track which videos users have watched
4. **Playlist Integration**: Create playlists for specific objection types
5. **Embedded Player**: Show video previews or embedded players
6. **Video Ratings**: Allow users to rate helpfulness of videos

