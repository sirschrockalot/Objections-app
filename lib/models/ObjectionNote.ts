import mongoose, { Schema, Model } from 'mongoose';

export interface IObjectionNote {
  _id: string;
  userId: string;
  objectionId: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

type ObjectionNoteModel = Model<IObjectionNote>;

const ObjectionNoteSchema = new Schema<IObjectionNote>(
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
    note: {
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
  },
  {
    timestamps: false,
  }
);

ObjectionNoteSchema.index({ userId: 1, objectionId: 1 }, { unique: true });

const ObjectionNote: ObjectionNoteModel =
  mongoose.models.ObjectionNote ||
  mongoose.model<IObjectionNote, ObjectionNoteModel>('ObjectionNote', ObjectionNoteSchema);

export default ObjectionNote;

