import mongoose, { Schema, Model } from 'mongoose';

export interface IPropertyAnalysis {
  _id: string;
  userId: string;
  propertyAddress: string;
  propertyDetails: {
    address: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    lotSize?: number;
    yearBuilt?: number;
    propertyType?: string;
    condition?: string;
  };
  marketData: {
    estimatedValue?: number;
    arv?: number;
    repairEstimate?: number;
    mao?: number; // Maximum Allowable Offer
    comps: Array<{
      address: string;
      soldPrice: number;
      soldDate: string;
      distance?: number;
      bedrooms?: number;
      bathrooms?: number;
      squareFeet?: number;
      propertyType?: string;
    }>;
    dataSource?: string;
    fetchedAt: Date;
  };
  aiAnalysis?: {
    compsRanking: Array<{
      compId: number;
      score: number;
      reasoning: string;
      adjustments: {
        size?: number;
        condition?: number;
        location?: number;
        timing?: number;
      };
    }>;
    marketTrends: {
      direction: 'up' | 'down' | 'stable';
      confidence: number;
      insights: string[];
      predictions: {
        next3Months: string;
        next6Months: string;
      };
    };
    recommendedARV: {
      value: number;
      range: { min: number; max: number };
      confidence: number;
      factors: string[];
    };
    riskAssessment: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
    };
    recommendations: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

type PropertyAnalysisModel = Model<IPropertyAnalysis>;

const PropertyAnalysisSchema = new Schema<IPropertyAnalysis, PropertyAnalysisModel>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    propertyAddress: {
      type: String,
      required: true,
      index: true,
    },
    propertyDetails: {
      type: Schema.Types.Mixed,
      required: true,
    },
    marketData: {
      type: Schema.Types.Mixed,
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
    timestamps: false, // We're managing timestamps manually
  }
);

// Indexes for faster lookups
PropertyAnalysisSchema.index({ userId: 1, createdAt: -1 });
PropertyAnalysisSchema.index({ propertyAddress: 1 });
// Compound index for cache lookup query (userId + propertyAddress + createdAt)
PropertyAnalysisSchema.index({ userId: 1, propertyAddress: 1, createdAt: -1 });

export default mongoose.models.PropertyAnalysis ||
  mongoose.model<IPropertyAnalysis>('PropertyAnalysis', PropertyAnalysisSchema);

