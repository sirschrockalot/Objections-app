import mongoose, { Schema, Model } from 'mongoose';

export interface IReviewSchedule {
  _id: string;
  userId: string;
  objectionId: string;
  nextReviewDate: string; // ISO date string (YYYY-MM-DD)
  interval: number; // days until next review
  easeFactor: number; // difficulty multiplier (default 2.5)
  repetitions: number; // number of successful reviews
  lastReviewDate: string | null;
  isDue: boolean;
}

type ReviewScheduleModel = Model<IReviewSchedule>;

const ReviewScheduleSchema = new Schema<IReviewSchedule>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    objectionId: {
      type: String,
      required: true,
      index: true,
    },
    nextReviewDate: {
      type: String,
      required: true,
      index: true,
    },
    interval: {
      type: Number,
      required: true,
      default: 1,
    },
    easeFactor: {
      type: Number,
      required: true,
      default: 2.5,
    },
    repetitions: {
      type: Number,
      required: true,
      default: 0,
    },
    lastReviewDate: {
      type: String,
      default: null,
    },
    isDue: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

ReviewScheduleSchema.index({ userId: 1, objectionId: 1 }, { unique: true });
ReviewScheduleSchema.index({ userId: 1, isDue: 1, nextReviewDate: 1 });

const ReviewSchedule: ReviewScheduleModel =
  mongoose.models.ReviewSchedule ||
  mongoose.model<IReviewSchedule, ReviewScheduleModel>('ReviewSchedule', ReviewScheduleSchema);

export default ReviewSchedule;

