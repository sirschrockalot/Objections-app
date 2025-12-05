import mongoose, { Schema, Model } from 'mongoose';

export interface IUserActivity {
  _id: string;
  userId: string;
  action: string;
  metadata: Record<string, any>;
  timestamp: Date;
  userAgent?: string;
  url?: string;
}

type UserActivityModel = Model<IUserActivity>;

const UserActivitySchema = new Schema<IUserActivity>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    userAgent: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient queries
UserActivitySchema.index({ userId: 1, timestamp: -1 });
UserActivitySchema.index({ userId: 1, action: 1 });

// TTL index to automatically delete old activities after 1 year (optional)
// UserActivitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

const UserActivity: UserActivityModel =
  mongoose.models.UserActivity ||
  mongoose.model<IUserActivity, UserActivityModel>('UserActivity', UserActivitySchema);

export default UserActivity;

