import mongoose, { Schema, Model } from 'mongoose';

export interface IPracticeHistory {
  _id: string;
  userId: string;
  objectionId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  sessionId: string;
  confidenceRating?: number;
  timesPracticed: number; // cumulative count
}

type PracticeHistoryModel = Model<IPracticeHistory>;

const PracticeHistorySchema = new Schema<IPracticeHistory>(
  {
    userId: {
      type: String,
      required: true,
    },
    objectionId: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    confidenceRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    timesPracticed: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: false,
  }
);

PracticeHistorySchema.index({ userId: 1, objectionId: 1, date: 1 }, { unique: true });
PracticeHistorySchema.index({ userId: 1, date: -1 });

const PracticeHistory: PracticeHistoryModel =
  mongoose.models.PracticeHistory ||
  mongoose.model<IPracticeHistory, PracticeHistoryModel>('PracticeHistory', PracticeHistorySchema);

export default PracticeHistory;

