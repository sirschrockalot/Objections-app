import mongoose, { Schema, Model } from 'mongoose';

export interface IVoiceSession {
  _id: string;
  userId: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  messages: Array<{
    id: string;
    type: 'agent' | 'user';
    text: string;
    timestamp: string;
    audioUrl?: string;
    isInterim?: boolean;
  }>;
  objectionsPresented: string[];
  userResponses: string[];
  metrics: {
    totalDuration: number;
    objectionsHandled: number;
    averageResponseTime: number;
    confidenceScore?: number;
    messagesExchanged: number;
  };
  status: 'active' | 'paused' | 'completed' | 'error' | 'recovered';
  lastSavedAt?: string;
  recoveryData?: {
    disconnectedAt: string;
    reconnectedAt?: string;
    messagesBeforeDisconnect: number;
  };
}

type VoiceSessionModel = Model<IVoiceSession>;

const VoiceSessionSchema = new Schema<IVoiceSession>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
    },
  messages: {
    type: [Schema.Types.Mixed] as any,
    default: [],
    },
    objectionsPresented: {
      type: [String],
      default: [],
    },
    userResponses: {
      type: [String],
      default: [],
    },
    metrics: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'error', 'recovered'],
      required: true,
      index: true,
    },
    lastSavedAt: {
      type: String,
    },
    recoveryData: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: false,
  }
);

VoiceSessionSchema.index({ userId: 1, startTime: -1 });
VoiceSessionSchema.index({ userId: 1, status: 1 });

const VoiceSession: VoiceSessionModel =
  mongoose.models.VoiceSession ||
  mongoose.model<IVoiceSession, VoiceSessionModel>('VoiceSession', VoiceSessionSchema);

export default VoiceSession;

