import mongoose, { Schema, Model } from 'mongoose';

export interface ILearningPathProgress {
  _id: string;
  userId: string;
  pathId: string;
  currentStep: number;
  completedSteps: string[]; // Array of completed objection IDs
  startedAt: Date;
  completedAt?: Date;
  lastPracticedAt?: Date;
}

type LearningPathProgressModel = Model<ILearningPathProgress>;

const LearningPathProgressSchema = new Schema<ILearningPathProgress>(
  {
    userId: {
      type: String,
      required: true,
    },
    pathId: {
      type: String,
      required: true,
    },
    currentStep: {
      type: Number,
      required: true,
      default: 0,
    },
    completedSteps: {
      type: [String],
      default: [],
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    lastPracticedAt: {
      type: Date,
    },
  },
  {
    timestamps: false,
  }
);

LearningPathProgressSchema.index({ userId: 1, pathId: 1 }, { unique: true });

const LearningPathProgress: LearningPathProgressModel =
  mongoose.models.LearningPathProgress ||
  mongoose.model<ILearningPathProgress, LearningPathProgressModel>('LearningPathProgress', LearningPathProgressSchema);

export default LearningPathProgress;

