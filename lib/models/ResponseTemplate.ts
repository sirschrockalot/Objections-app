import mongoose, { Schema, Model } from 'mongoose';

export interface IResponseTemplate {
  _id: string;
  userId: string;
  templateId: string;
  name: string;
  acknowledge: string;
  reframe: string;
  value: string;
  nextStep: string;
  createdAt: Date;
}

type ResponseTemplateModel = Model<IResponseTemplate>;

const ResponseTemplateSchema = new Schema<IResponseTemplate>(
  {
    userId: {
      type: String,
      required: true,
    },
    templateId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    acknowledge: {
      type: String,
      required: true,
    },
    reframe: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    nextStep: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

ResponseTemplateSchema.index({ userId: 1, templateId: 1 }, { unique: true });

const ResponseTemplate: ResponseTemplateModel =
  mongoose.models.ResponseTemplate ||
  mongoose.model<IResponseTemplate, ResponseTemplateModel>('ResponseTemplate', ResponseTemplateSchema);

export default ResponseTemplate;

