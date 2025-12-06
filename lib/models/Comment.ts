import mongoose, { Schema, Model } from 'mongoose';

export interface IComment {
  _id: string;
  userId: string;
  responseId: string;
  objectionId: string;
  text: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string; // For threaded replies
  edited?: boolean;
}

type CommentModel = Model<IComment>;

const CommentSchema = new Schema<IComment>(
  {
    userId: {
      type: String,
      required: true,
    },
    responseId: {
      type: String,
      required: true,
    },
    objectionId: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    parentId: {
      type: String,
    },
    edited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
  }
);

CommentSchema.index({ responseId: 1, createdAt: -1 });
CommentSchema.index({ objectionId: 1 });

const Comment: CommentModel =
  mongoose.models.Comment ||
  mongoose.model<IComment, CommentModel>('Comment', CommentSchema);

export default Comment;

