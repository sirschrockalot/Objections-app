import mongoose, { Schema, Model } from 'mongoose';

export interface ICustomResponse {
  _id: string;
  userId: string;
  objectionId: string;
  responseId: string;
  text: string;
  isCustom: boolean;
  createdAt: Date;
  createdBy?: string;
  upvotes: number;
  upvotedBy: string[];
}

type CustomResponseModel = Model<ICustomResponse>;

const CustomResponseSchema = new Schema<ICustomResponse>(
  {
    userId: {
      type: String,
      required: true,
    },
    objectionId: {
      type: String,
      required: true,
    },
    responseId: {
      type: String,
      required: true,
      unique: true,
    },
    text: {
      type: String,
      required: true,
    },
    isCustom: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: String,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    upvotedBy: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: false,
  }
);

// Indexes for efficient queries
CustomResponseSchema.index({ userId: 1, objectionId: 1 });
CustomResponseSchema.index({ userId: 1, createdAt: -1 }); // For listing user's responses
// Note: responseId already has an index from unique: true

const CustomResponse: CustomResponseModel =
  mongoose.models.CustomResponse ||
  mongoose.model<ICustomResponse, CustomResponseModel>('CustomResponse', CustomResponseSchema);

export default CustomResponse;

