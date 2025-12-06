# How to Find and Add YouTube Videos

## Channel URLs

1. **Tony Mont**: https://www.youtube.com/@thetonymont
2. **Eric Cline**: https://www.youtube.com/@ericclineofficial
3. **Andy Elliott**: https://www.youtube.com/@AndyElliottOfficial

## Step-by-Step Guide

### 1. Visit Each Channel

Open each channel URL in your browser and browse their videos.

### 2. Search for Relevant Videos

Look for videos with titles/keywords like:
- "Objection handling"
- "Price objections"
- "Sales objections"
- "How to handle [objection type]"
- "Overcoming objections"
- "Real estate objections"
- "Seller objections"
- "Wholesaling objections"

### 3. Identify Video Category and Difficulty

Match videos to categories:
- **Price**: Videos about price negotiations, low offers, value discussions
- **Timing**: Videos about urgency, "I need time", scheduling
- **Trust**: Videos about building credibility, trust, rapport
- **Property**: Videos about property condition, location, repairs
- **Financial**: Videos about money, financing, cash offers
- **Interest**: Videos about generating interest, "not interested" responses

Difficulty levels:
- **Beginner**: Basic concepts, fundamentals, introductory content
- **Intermediate**: More advanced techniques, specific strategies
- **Advanced**: Master-level, complex scenarios, expert techniques

### 4. Get the Video URL

1. Click on the video you want to add
2. Right-click on the video player
3. Select "Copy video URL" (or use the Share button)
4. The URL will look like: `https://www.youtube.com/watch?v=VIDEO_ID`

### 5. Update the Data File

1. Open `data/videoRecommendations.ts`
2. Find the video object that matches the category and creator
3. Replace the placeholder URL with the actual video URL
4. Update the `title` to match the actual video title
5. Update the `description` to match the video's content

### Example

**Before:**
```typescript
{
  id: 'price-1',
  title: 'How to Handle Price Objections in Real Estate',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
  creator: 'Andy Elliott',
  category: ['Price'],
  difficulty: 'beginner',
  description: 'Learn proven techniques to overcome price objections from sellers',
},
```

**After:**
```typescript
{
  id: 'price-1',
  title: 'How to Handle Price Objections - Real Estate Wholesaling',
  url: 'https://www.youtube.com/watch?v=abc123xyz', // Actual video URL
  creator: 'Andy Elliott',
  category: ['Price'],
  difficulty: 'beginner',
  description: 'Learn proven techniques to overcome price objections from sellers',
},
```

## Quick Tips

- **Watch the video first** to ensure it matches the category and difficulty
- **Use descriptive titles** that match the actual video content
- **Update descriptions** to accurately reflect what the video covers
- **Test the URLs** after updating to make sure they work
- **Consider video length** - shorter videos (5-15 min) are often better for quick learning

## YouTube Video URL Formats

YouTube URLs can appear in different formats:
- `https://www.youtube.com/watch?v=VIDEO_ID` (standard)
- `https://youtu.be/VIDEO_ID` (short format)
- `https://www.youtube.com/embed/VIDEO_ID` (embed format)

All formats work, but the standard format (`watch?v=`) is recommended.

## Video Recommendations by Category

### Price Objections
Look for videos about:
- Negotiating price
- Low ball offers
- Value discussions
- Price objections
- Making competitive offers

### Timing Objections
Look for videos about:
- Creating urgency
- "I need more time"
- Scheduling objections
- Timeline discussions
- Urgency techniques

### Trust Objections
Look for videos about:
- Building rapport
- Establishing credibility
- Trust building
- Overcoming skepticism
- Professionalism

### Property Objections
Look for videos about:
- Property condition
- Location concerns
- Repair estimates
- Property value
- Inspection objections

### Financial Objections
Look for videos about:
- Cash offers
- Financing concerns
- Money discussions
- Payment terms
- Financial negotiations

### Interest Objections
Look for videos about:
- "Not interested" responses
- Generating interest
- Re-engagement strategies
- Interest building
- Follow-up techniques

