import mongoose, { Schema, Model } from 'mongoose';

export interface IPracticeSession {
  _id: string;
  userId: string;
  sessionId: string;
  date: Date;
  objectionsPracticed: string[];
  duration: number; // in seconds
  challengeMode?: boolean;
  timeLimit?: number; // in seconds
  goal?: number; // number of objections to complete
}

type PracticeSessionModel = Model<IPracticeSession>;

const PracticeSessionSchema = new Schema<IPracticeSession>(
  {
    userId: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    objectionsPracticed: {
      type: [String],
      default: [],
    },
    duration: {
      type: Number,
      required: true,
    },
    challengeMode: {
      type: Boolean,
      default: false,
    },
    timeLimit: {
      type: Number,
    },
    goal: {
      type: Number,
    },
  },
  {
    timestamps: false,
  }
);

PracticeSessionSchema.index({ userId: 1, date: -1 });

const PracticeSession: PracticeSessionModel =
  mongoose.models.PracticeSession ||
  mongoose.model<IPracticeSession, PracticeSessionModel>('PracticeSession', PracticeSessionSchema);

export default PracticeSession;

