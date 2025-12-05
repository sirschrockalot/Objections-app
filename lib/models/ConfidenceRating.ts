import mongoose, { Schema, Model } from 'mongoose';

export interface IConfidenceRating {
  _id: string;
  userId: string;
  objectionId: string;
  rating: number; // 1-5
  date: Date;
}

type ConfidenceRatingModel = Model<IConfidenceRating>;

const ConfidenceRatingSchema = new Schema<IConfidenceRating>(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

ConfidenceRatingSchema.index({ userId: 1, objectionId: 1, date: -1 });

const ConfidenceRating: ConfidenceRatingModel =
  mongoose.models.ConfidenceRating ||
  mongoose.model<IConfidenceRating, ConfidenceRatingModel>('ConfidenceRating', ConfidenceRatingSchema);

export default ConfidenceRating;

