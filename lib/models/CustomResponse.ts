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
      index: true,
    },
    objectionId: {
      type: String,
      required: true,
      index: true,
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

CustomResponseSchema.index({ userId: 1, objectionId: 1 });
CustomResponseSchema.index({ responseId: 1 });

const CustomResponse: CustomResponseModel =
  mongoose.models.CustomResponse ||
  mongoose.model<ICustomResponse, CustomResponseModel>('CustomResponse', CustomResponseSchema);

export default CustomResponse;

