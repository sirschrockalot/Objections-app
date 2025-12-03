# ElevenLabs Voice Agent Implementation Plan

## Overview
This document outlines the implementation plan for integrating an ElevenLabs voice agent into ResponseReady, allowing users to practice objection handling through real-time voice conversations.

## Feature Description
Users can engage in live voice conversations with an AI agent that:
- Presents realistic buyer objections in natural speech
- Listens to user responses in real-time
- Provides contextual feedback and follow-up questions
- Adapts conversation flow based on user responses
- Tracks performance metrics during voice practice sessions

---

## Architecture

### High-Level Flow
```
User → Browser (WebSocket) → ElevenLabs Agent → Audio Response → Browser → User
     ← Speech-to-Text ←                        ← Text-to-Speech ←
```

### Components Needed

1. **VoicePracticeMode Component** (`components/VoicePracticeMode.tsx`)
   - Main UI for voice conversation interface
   - Conversation transcript display
   - Audio controls (start/stop/pause)
   - Real-time status indicators

2. **ElevenLabs Service** (`lib/elevenlabs.ts`)
   - WebSocket connection management
   - Audio streaming (input/output)
   - Event handling (conversation events)
   - Error handling and reconnection logic

3. **Voice Agent Hook** (`hooks/useElevenLabsAgent.ts`)
   - React hook for managing agent state
   - Connection lifecycle
   - Audio playback management
   - Conversation state tracking

4. **Audio Utilities** (`lib/audioUtils.ts`)
   - Microphone access and audio capture
   - Audio playback management
   - Audio format conversion if needed

5. **Voice Session Types** (`types/index.ts`)
   - TypeScript interfaces for voice sessions
   - Conversation message types
   - Agent configuration types

---

## Technical Implementation

### 1. ElevenLabs Setup

#### Prerequisites
- ElevenLabs API key (stored in environment variable)
- Agent ID (created via ElevenLabs dashboard or API)
- WebSocket endpoint for real-time communication

#### Agent Configuration
The agent should be configured with:
- **System Prompt**: 
  ```
  You are a realistic potential real estate buyer practicing objections with a disposition agent. 
  Present common objections naturally and conversationally. After the agent responds, provide 
  follow-up questions or push back on weak points. Be realistic but fair - acknowledge good 
  responses. Keep conversations natural and flowing.
  ```

- **Knowledge Base**: 
  - All objections from `data/objections.ts`
  - Common buyer concerns and follow-up questions
  - Realistic conversation patterns

- **Voice Model**: Professional, conversational voice (e.g., "Rachel" or "Adam")

### 2. WebSocket Connection

#### Connection Flow
```typescript
// Establish WebSocket connection
const ws = new WebSocket(`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${AGENT_ID}`);

// Authentication
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'conversation_initiation_settings',
    conversation_config: {
      agent: { agent_id: AGENT_ID }
    }
  }));
};

// Handle incoming audio
ws.onmessage = (event) => {
  if (event.data instanceof Blob) {
    // Audio response from agent
    playAudio(event.data);
  } else {
    // Text events (transcripts, status updates)
    handleTextEvent(JSON.parse(event.data));
  }
};
```

### 3. Audio Handling

#### Microphone Input
- Use `navigator.mediaDevices.getUserMedia()` for microphone access
- Stream audio chunks to ElevenLabs via WebSocket
- Handle permissions and errors gracefully

#### Audio Output
- Receive audio chunks from ElevenLabs
- Use `AudioContext` and `AudioBuffer` for playback
- Queue audio chunks for smooth playback

### 4. Conversation State Management

#### State Structure
```typescript
interface VoiceSession {
  id: string;
  startTime: string;
  endTime?: string;
  messages: ConversationMessage[];
  objectionsPresented: string[];
  userResponses: UserResponse[];
  metrics: VoiceSessionMetrics;
}

interface ConversationMessage {
  id: string;
  type: 'agent' | 'user';
  text: string;
  timestamp: string;
  audioUrl?: string; // For playback
}

interface VoiceSessionMetrics {
  totalDuration: number;
  objectionsHandled: number;
  averageResponseTime: number;
  confidenceScore?: number;
}
```

---

## UI/UX Design

### Voice Practice Mode Interface

```
┌─────────────────────────────────────────┐
│  🎤 Voice Practice Mode                 │
│  [●] Recording  [⏸] Pause  [⏹] Stop   │
├─────────────────────────────────────────┤
│                                         │
│  Agent: "I'm interested, but the price │
│         seems too high for this area."  │
│                                         │
│  You: "I understand your concern. Let   │
│       me show you the comps..."         │
│                                         │
│  Agent: "Okay, but what about the       │
│         condition? It needs work."      │
│                                         │
└─────────────────────────────────────────┘
```

### Features
- **Real-time transcript**: Shows conversation as it happens
- **Audio visualization**: Waveform or visual indicator
- **Controls**: Start, pause, stop, replay last message
- **Settings**: Voice selection, conversation style, difficulty
- **Metrics**: Display session stats in real-time
- **Feedback**: Visual indicators for good responses

---

## Implementation Steps

### Phase 1: Foundation (Week 1)
1. ✅ Set up ElevenLabs account and create agent
2. ✅ Create TypeScript types for voice sessions
3. ✅ Build `lib/elevenlabs.ts` service layer
4. ✅ Create `hooks/useElevenLabsAgent.ts` hook
5. ✅ Implement basic WebSocket connection

### Phase 2: Audio Integration (Week 1-2)
1. ✅ Implement microphone capture (`lib/audioUtils.ts`)
2. ✅ Implement audio playback system
3. ✅ Stream audio to/from ElevenLabs
4. ✅ Handle audio format conversion if needed
5. ✅ Test audio quality and latency

### Phase 3: UI Components (Week 2)
1. ✅ Create `VoicePracticeMode` component
2. ✅ Build conversation transcript UI
3. ✅ Add audio controls (start/stop/pause)
4. ✅ Implement real-time status indicators
5. ✅ Add settings panel for agent configuration

### Phase 4: Integration (Week 2-3)
1. ✅ Integrate with existing practice modes
2. ✅ Connect to objection data
3. ✅ Track voice sessions in practice history
4. ✅ Add voice session metrics to stats dashboard
5. ✅ Implement session recording/playback

### Phase 5: Enhancement (Week 3-4)
1. ✅ Add conversation analytics
2. ✅ Implement feedback system
3. ✅ Add difficulty levels
4. ✅ Create conversation scenarios
5. ✅ Add export functionality for voice sessions

---

## Code Structure

### File Organization
```
lib/
  ├── elevenlabs.ts          # ElevenLabs API client
  ├── audioUtils.ts          # Audio capture/playback utilities
  └── voiceSessionStorage.ts # Voice session persistence

hooks/
  └── useElevenLabsAgent.ts  # React hook for agent management

components/
  ├── VoicePracticeMode.tsx  # Main voice practice component
  ├── ConversationTranscript.tsx # Transcript display
  ├── AudioControls.tsx      # Playback controls
  └── VoiceSessionStats.tsx  # Session metrics

types/
  └── index.ts               # Voice session types (additions)
```

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key_here
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here

# OpenAI API (for AI Feedback feature)
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

**Security Note**: For production, consider using a backend proxy to keep API keys secure. The current approach exposes the API key to the client (acceptable for MVP, but should be improved for production).

---

## API Costs & Limits

### ElevenLabs Pricing Considerations
- **Free Tier**: Limited characters/minutes per month
- **Paid Tiers**: Pay-per-use or subscription
- **Cost Factors**:
  - Conversation duration
  - Number of messages
  - Audio quality settings

### Optimization Strategies
- Cache common responses
- Limit session duration
- Offer text-only practice as alternative
- Implement usage tracking and limits

---

## Error Handling

### Common Scenarios
1. **WebSocket Disconnection**
   - Auto-reconnect with exponential backoff
   - Show connection status to user
   - Save session state for recovery

2. **Microphone Permission Denied**
   - Clear error message
   - Instructions for enabling permissions
   - Fallback to text input

3. **API Rate Limits**
   - Show rate limit warning
   - Queue requests if needed
   - Suggest alternative practice modes

4. **Audio Playback Issues**
   - Fallback to text transcript
   - Show error message
   - Allow manual retry

---

## Testing Strategy

### Unit Tests
- WebSocket connection logic
- Audio utilities
- State management hooks
- Error handling

### Integration Tests
- End-to-end conversation flow
- Audio streaming
- Session persistence
- Metrics tracking

### User Testing
- Real-world conversation scenarios
- Audio quality assessment
- Latency measurement
- User experience feedback

---

## Future Enhancements

1. **Multi-language Support**
   - Support for different languages
   - Language-specific voice models

2. **Advanced Analytics**
   - Speech pattern analysis
   - Response quality scoring
   - Improvement recommendations

3. **Custom Scenarios**
   - Pre-defined conversation scenarios
   - Industry-specific objections
   - Role-play variations

4. **Team Features**
   - Share voice sessions
   - Team leaderboards
   - Collaborative practice

5. **AI Feedback Integration** ✅
   - ✅ Post-session AI-powered analysis
   - ✅ Response quality scoring (0-100)
   - ✅ Detailed feedback with strengths and improvements
   - ✅ Quality metrics breakdown (clarity, empathy, structure, objection handling, closing)
   - ✅ Actionable recommendations with priorities
   - ✅ Response-by-response analysis
   - ✅ Suggested improved responses
   - ⏳ Real-time response analysis (future)
   - ⏳ Suggestions during conversation (future)

---

## Dependencies

### New Packages Needed
```json
{
  "dependencies": {
    // WebSocket handling (native or library)
    // Audio processing (if needed)
  }
}
```

### Browser Requirements
- Modern browser with WebSocket support
- Microphone access permissions
- Audio playback support
- HTTPS (required for microphone access)

---

## Security Considerations

1. **API Key Protection**
   - Use environment variables
   - Consider backend proxy for production
   - Implement rate limiting

2. **User Privacy**
   - Clear data usage policy
   - Option to delete recordings
   - Secure storage of conversations

3. **Audio Data**
   - Transient storage only
   - User consent for recording
   - Clear data retention policy

---

## Success Metrics

- **Adoption**: % of users trying voice mode
- **Engagement**: Average session duration
- **Completion**: % of sessions completed
- **Quality**: User satisfaction ratings
- **Performance**: Response time improvements

---

## Implementation Status

✅ **Phase 1: Foundation** - COMPLETED
- TypeScript types for voice sessions
- ElevenLabs service layer (`lib/elevenlabs.ts`)
- Audio utilities (`lib/audioUtils.ts`)
- React hook (`hooks/useElevenLabsAgent.ts`)

✅ **Phase 2: Audio Integration** - COMPLETED
- Microphone capture implementation
- Audio playback system
- WebSocket audio streaming

✅ **Phase 3: UI Components** - COMPLETED
- `VoicePracticeMode` component
- `ConversationTranscript` component
- `AudioControls` component

✅ **Phase 4: Integration** - COMPLETED
- Integrated into main app as new practice mode
- Voice session storage
- Metrics tracking
- Points and achievements integration

✅ **Phase 5: AI Feedback** - COMPLETED
- Post-session AI analysis using OpenAI API
- Response quality scoring and metrics
- Detailed feedback with recommendations
- Response-by-response analysis
- Integration into Voice Session History

✅ **Phase 6: Session Comparison** - COMPLETED
- Multi-session side-by-side comparison
- Metrics comparison (duration, messages, response time)
- Quality metrics comparison with trends
- AI feedback scores comparison
- Progress insights and recommendations
- Visual trend indicators
- Best/worst session identification

## Next Steps

1. ✅ Set up ElevenLabs account and create agent
2. ✅ Configure environment variables (`.env.local`)
3. ✅ Test with sample conversations
4. ⏳ Iterate based on feedback
5. ⏳ Add advanced features (analytics, feedback, scenarios)

---

## Questions to Resolve

1. **Backend vs Frontend**: Should we use a backend proxy for API calls?
2. **Recording Storage**: Should we store full audio recordings or just transcripts?
3. **Cost Management**: How should we handle API costs (user limits, subscriptions)?
4. **Agent Personality**: What tone/personality should the agent have?
5. **Integration Point**: Should this be a separate practice mode or integrated into existing modes?

