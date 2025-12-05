import mongoose, { Schema, Model } from 'mongoose';

export interface IPoints {
  _id: string;
  userId: string;
  pointsId: string;
  points: number;
  reason: string;
  date: Date;
  metadata?: Record<string, any>;
}

type PointsModel = Model<IPoints>;

const PointsSchema = new Schema<IPoints>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    pointsId: {
      type: String,
      required: true,
      unique: true,
    },
    points: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false,
  }
);

PointsSchema.index({ userId: 1, date: -1 });

const Points: PointsModel =
  mongoose.models.Points ||
  mongoose.model<IPoints, PointsModel>('Points', PointsSchema);

export default Points;

