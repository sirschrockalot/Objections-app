export interface Response {
  id: string;
  text: string;
  isCustom: boolean;
  createdAt?: string;
  createdBy?: string;
  upvotes?: number;
  upvotedBy?: string[];
}

export interface Objection {
  id: string;
  text: string;
  category: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  defaultResponses: Response[];
  customResponses: Response[];
  personalNote?: string;
}

export interface ConfidenceRating {
  objectionId: string;
  rating: number; // 1-5
  date: string;
}

export interface PracticeSession {
  id: string;
  date: string;
  objectionsPracticed: string[];
  duration: number; // in seconds
  challengeMode?: boolean;
  timeLimit?: number; // in seconds
  goal?: number; // number of objections to complete
}

export interface ObjectionNote {
  objectionId: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  acknowledge: string;
  reframe: string;
  value: string;
  nextStep: string;
  createdAt: string;
}

export interface PracticeHistoryEntry {
  objectionId: string;
  date: string;
  sessionId: string;
  confidenceRating?: number;
  timesPracticed: number; // cumulative count
}

export interface Comment {
  id: string;
  responseId: string;
  objectionId: string;
  text: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string; // For threaded replies
  edited?: boolean;
}

export interface PointsEntry {
  id: string;
  userId: string;
  points: number;
  reason: string;
  date: string;
  metadata?: Record<string, any>;
}

export interface UserLevel {
  level: number;
  levelName: string;
  totalPoints: number;
  pointsToNextLevel: number;
  currentLevelPoints: number;
}

export interface CategoryMastery {
  category: string;
  masteryLevel: number; // 0-100
  objectionsPracticed: number;
  totalObjections: number;
  averageConfidence: number;
  badgeEarned?: string;
}

export interface ReviewSchedule {
  objectionId: string;
  nextReviewDate: string; // ISO date string
  interval: number; // days until next review
  easeFactor: number; // difficulty multiplier (default 2.5)
  repetitions: number; // number of successful reviews
  lastReviewDate: string | null;
  isDue: boolean;
}

export interface PropertyDetails {
  address: string;
  arv: number; // After Repair Value
  purchasePrice: number;
  repairEstimate: number;
  propertyType: 'single-family' | 'multi-family' | 'condo' | 'townhouse' | 'commercial';
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'needs-rehab';
  notes?: string;
}

export interface BuyerProfile {
  type: 'first-time-investor' | 'experienced-flipper' | 'buy-and-hold' | 'wholesaler' | 'cash-buyer' | 'new-agent';
  experience: 'beginner' | 'intermediate' | 'advanced';
  budget: number;
  goals: string[];
  concerns: string[];
  name?: string;
  background?: string;
}

export interface MarketConditions {
  marketType: 'hot' | 'balanced' | 'slow' | 'buyers-market' | 'sellers-market';
  inventory: 'low' | 'medium' | 'high';
  competition: 'low' | 'medium' | 'high';
  averageDaysOnMarket: number;
  notes?: string;
}

export interface ScenarioObjection {
  objectionId: string;
  order: number; // Order in which objection appears
  followUp?: {
    // If buyer responds to your response, what do they say?
    responses: string[]; // Possible buyer responses
    nextObjectionId?: string; // Next objection if they persist
  };
}

export interface PracticeScenario {
  id: string;
  title: string;
  description: string;
  property: PropertyDetails;
  buyer: BuyerProfile;
  market: MarketConditions;
  objections: ScenarioObjection[]; // Multiple objections in sequence
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  createdAt: string;
}

export interface DailyTip {
  id: string;
  title: string;
  content: string;
  category: 'technique' | 'psychology' | 'strategy' | 'communication' | 'closing';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  date?: string; // For scheduled tips
}

export interface ResponseTechnique {
  id: string;
  name: string;
  description: string;
  steps: string[];
  examples: string[];
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ObjectionOfTheDay {
  objectionId: string;
  date: string;
  featured: boolean;
  insights?: string;
  tips?: string[];
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  type: 'beginner' | 'category-mastery' | 'daily-challenge' | 'custom';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  objections: string[]; // Array of objection IDs in order
  category?: string; // For category mastery paths
  estimatedDuration: number; // in minutes
  prerequisites?: string[]; // Path IDs that must be completed first
  rewards?: {
    points?: number;
    badge?: string;
  };
  createdAt: string;
}

export interface LearningPathProgress {
  pathId: string;
  currentStep: number; // Index in objections array
  completedSteps: Set<string>; // Completed objection IDs
  startedAt: string;
  completedAt?: string;
  lastPracticedAt?: string;
}

export interface DailyChallenge {
  id: string;
  date: string;
  objections: string[]; // Pre-selected objections for the day
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  theme?: string; // Optional theme for the challenge
  completed: boolean;
}

// Voice Agent Types
export interface ConversationMessage {
  id: string;
  type: 'agent' | 'user';
  text: string;
  timestamp: string;
  audioUrl?: string; // For playback
  isInterim?: boolean; // For real-time transcription
}

export interface VoiceSessionMetrics {
  totalDuration: number; // in seconds
  objectionsHandled: number;
  averageResponseTime: number; // in seconds
  confidenceScore?: number; // 0-100
  messagesExchanged: number;
}

export interface VoiceSession {
  id: string;
  startTime: string;
  endTime?: string;
  messages: ConversationMessage[];
  objectionsPresented: string[]; // Objection IDs
  userResponses: string[]; // Response IDs or text
  metrics: VoiceSessionMetrics;
  status: 'active' | 'paused' | 'completed' | 'error';
}

export interface ElevenLabsAgentConfig {
  agentId: string;
  voiceId?: string;
  language?: string;
  conversationConfig?: {
    temperature?: number;
    maxResponseLength?: number;
  };
  scenarioContext?: string; // Formatted scenario instructions/context
}

export interface VoiceAgentState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  error: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

// AI Feedback Types
export interface AIFeedback {
  sessionId: string;
  overallScore: number; // 0-100
  strengths: string[];
  improvementAreas: string[];
  recommendations: AIRecommendation[];
  qualityMetrics: QualityMetrics;
  responseAnalysis: ResponseAnalysis[];
  generatedAt: string;
  model?: string; // AI model used
}

export interface QualityMetrics {
  clarity: number; // 0-100
  empathy: number; // 0-100
  structure: number; // 0-100
  objectionHandling: number; // 0-100
  closingTechnique: number; // 0-100
  averageResponseTime: number; // seconds
}

export interface AIRecommendation {
  type: 'technique' | 'objection' | 'practice' | 'general';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
}

export interface ResponseAnalysis {
  messageId: string;
  userMessage: string;
  agentMessage: string; // The objection/context
  score: number; // 0-100
  feedback: string;
  strengths: string[];
  improvements: string[];
  suggestedResponse?: string;
}

