/**
 * Cost tracking for API usage
 * Tracks costs for OpenAI, ElevenLabs, and other third-party services
 */

import connectDB from '@/lib/mongodb';
import mongoose, { Schema, Model } from 'mongoose';

export interface ICostTracking {
  _id: string;
  service: 'openai' | 'elevenlabs' | 'youtube' | 'rapidapi' | 'other';
  cost: number;
  userId?: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    inputTokens?: number;
    outputTokens?: number;
    [key: string]: any;
  };
}

const CostTrackingSchema = new Schema<ICostTracking>(
  {
    service: {
      type: String,
      required: true,
      index: true,
    },
    cost: {
      type: Number,
      required: true,
    },
    userId: {
      type: String,
      index: true,
    },
    timestamp: {
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

// Indexes for efficient queries
CostTrackingSchema.index({ service: 1, timestamp: -1 });
CostTrackingSchema.index({ userId: 1, timestamp: -1 });
CostTrackingSchema.index({ timestamp: -1 }); // For daily/monthly aggregations

const CostTracking: Model<ICostTracking> =
  mongoose.models.CostTracking ||
  mongoose.model<ICostTracking>('CostTracking', CostTrackingSchema);

/**
 * Calculate OpenAI cost based on model and tokens
 */
export function calculateOpenAICost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Pricing per 1M tokens (as of 2024)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-4': { input: 30.00, output: 60.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  };

  const modelPricing = pricing[model] || pricing['gpt-4o-mini'];
  const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
  const outputCost = (outputTokens / 1_000_000) * modelPricing.output;
  
  return inputCost + outputCost;
}

/**
 * Track API cost
 */
export async function trackAPICost(
  service: 'openai' | 'elevenlabs' | 'youtube' | 'rapidapi' | 'other',
  cost: number,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await connectDB();
    await CostTracking.create({
      service,
      cost,
      userId,
      timestamp: new Date(),
      metadata,
    });
  } catch (error) {
    console.error('Error tracking API cost:', error);
    // Don't throw - cost tracking failures shouldn't break the app
  }
}

/**
 * Get cost statistics for a time period
 */
export async function getCostStats(
  startDate: Date,
  endDate: Date,
  userId?: string
): Promise<{
  totalCost: number;
  costByService: Record<string, number>;
  dailyCosts: Array<{ date: string; cost: number }>;
  count: number;
}> {
  try {
    await connectDB();
    const match: any = {
      timestamp: { $gte: startDate, $lte: endDate },
    };
    if (userId) {
      match.userId = userId;
    }

    const stats = await CostTracking.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$cost' },
          count: { $sum: 1 },
          byService: {
            $push: {
              service: '$service',
              cost: '$cost',
            },
          },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        totalCost: 0,
        costByService: {},
        dailyCosts: [],
        count: 0,
      };
    }

    const costByService: Record<string, number> = {};
    stats[0].byService.forEach((item: { service: string; cost: number }) => {
      costByService[item.service] = (costByService[item.service] || 0) + item.cost;
    });

    // Get daily breakdown
    const dailyStats = await CostTracking.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          cost: { $sum: '$cost' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyCosts = dailyStats.map((stat: { _id: string; cost: number }) => ({
      date: stat._id,
      cost: stat.cost,
    }));

    return {
      totalCost: stats[0].totalCost,
      costByService,
      dailyCosts,
      count: stats[0].count,
    };
  } catch (error) {
    console.error('Error getting cost stats:', error);
    return {
      totalCost: 0,
      costByService: {},
      dailyCosts: [],
      count: 0,
    };
  }
}

/**
 * Check if daily cost limit is exceeded
 */
export async function checkDailyCostLimit(
  limit: number,
  userId?: string
): Promise<{ exceeded: boolean; currentCost: number; limit: number }> {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const stats = await getCostStats(startDate, endDate, userId);
  
  return {
    exceeded: stats.totalCost >= limit,
    currentCost: stats.totalCost,
    limit,
  };
}

