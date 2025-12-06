import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth } from '@/lib/authMiddleware';
import { createRateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter';
import { getPropertyData, findComparables } from '@/lib/marketData';
import { analyzeComps, analyzeMarketTrends, isAIAnalysisAvailable } from '@/lib/ai/marketAnalysis';
import PropertyAnalysis from '@/lib/models/PropertyAnalysis';
import { sanitizeString } from '@/lib/inputValidation';
import { getSafeErrorMessage, logError } from '@/lib/errorHandler';

const apiRateLimit = createRateLimitMiddleware(RATE_LIMITS.api);

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Require authentication
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { address, propertyDetails } = body;

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Property address is required' },
        { status: 400 }
      );
    }

    // Sanitize address
    const sanitizedAddress = sanitizeString(address, 500);
    if (!sanitizedAddress) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    // Check if we have a recent analysis (cache for 24 hours)
    const existingAnalysis = await PropertyAnalysis.findOne({
      userId: auth.userId,
      propertyAddress: sanitizedAddress.toLowerCase(),
      createdAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      },
    });

    if (existingAnalysis) {
      const response = NextResponse.json({
        analysis: {
          id: existingAnalysis._id.toString(),
          propertyAddress: existingAnalysis.propertyAddress,
          propertyDetails: existingAnalysis.propertyDetails,
          marketData: existingAnalysis.marketData,
          aiAnalysis: existingAnalysis.aiAnalysis || undefined,
          createdAt: existingAnalysis.createdAt,
        },
        cached: true,
      });
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      return response;
    }

    // Fetch market data
    const marketData = await getPropertyData(sanitizedAddress, propertyDetails);

    // Find comparable properties
    const comps = findComparables(marketData, propertyDetails);

    // AI Analysis (Phase 2)
    let aiAnalysis = null;
    if (isAIAnalysisAvailable() && comps.length > 0) {
      try {
        const [compAnalysis, marketTrends] = await Promise.all([
          analyzeComps(
            { address: sanitizedAddress, ...propertyDetails },
            comps,
            marketData
          ),
          analyzeMarketTrends(comps, sanitizedAddress),
        ]);

        aiAnalysis = {
          compsRanking: compAnalysis.ranking,
          marketTrends,
          recommendedARV: compAnalysis.recommendedARV,
          riskAssessment: compAnalysis.riskAssessment,
          recommendations: compAnalysis.recommendations,
        };

        // Use AI-recommended ARV if available, otherwise fall back to average
        const arv = compAnalysis.recommendedARV.value || 
          (marketData.estimatedValue || 
            (comps.length > 0 
              ? Math.round(comps.reduce((sum, comp) => sum + comp.soldPrice, 0) / comps.length)
              : 0));

        const repairEstimate = propertyDetails?.repairEstimate || 0;
        const mao = Math.round((arv * 0.7) - repairEstimate);

        // Save analysis with AI insights
        const analysis = await PropertyAnalysis.create({
          userId: auth.userId!,
          propertyAddress: sanitizedAddress.toLowerCase(),
          propertyDetails: {
            address: sanitizedAddress,
            ...propertyDetails,
          },
          marketData: {
            estimatedValue: marketData.estimatedValue,
            arv,
            repairEstimate,
            mao,
            comps,
            dataSource: marketData.dataSource,
            fetchedAt: marketData.fetchedAt,
          },
          aiAnalysis,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const response = NextResponse.json({
          analysis: {
            id: analysis._id.toString(),
            propertyAddress: analysis.propertyAddress,
            propertyDetails: analysis.propertyDetails,
            marketData: analysis.marketData,
            aiAnalysis: analysis.aiAnalysis,
            createdAt: analysis.createdAt,
          },
          cached: false,
        });

        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        return response;
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
        // Fall through to basic analysis
      }
    }

    // Basic analysis (fallback or when AI is not available)
    const arv = marketData.estimatedValue || 
      (comps.length > 0 
        ? Math.round(comps.reduce((sum, comp) => sum + comp.soldPrice, 0) / comps.length)
        : 0);

    // Calculate MAO (Maximum Allowable Offer) - 70% of ARV minus repairs
    const repairEstimate = propertyDetails?.repairEstimate || 0;
    const mao = Math.round((arv * 0.7) - repairEstimate);

    // Save analysis (basic, without AI)
    const analysis = await PropertyAnalysis.create({
      userId: auth.userId!,
      propertyAddress: sanitizedAddress.toLowerCase(),
      propertyDetails: {
        address: sanitizedAddress,
        ...propertyDetails,
      },
      marketData: {
        estimatedValue: marketData.estimatedValue,
        arv,
        repairEstimate,
        mao,
        comps,
        dataSource: marketData.dataSource,
        fetchedAt: marketData.fetchedAt,
      },
      aiAnalysis: aiAnalysis || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = NextResponse.json({
      analysis: {
        id: analysis._id.toString(),
        propertyAddress: analysis.propertyAddress,
        propertyDetails: analysis.propertyDetails,
        marketData: analysis.marketData,
        aiAnalysis: analysis.aiAnalysis || undefined,
        createdAt: analysis.createdAt,
      },
      cached: false,
    });

    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    return response;
  } catch (error: any) {
    logError('Market Analysis', error);
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'Failed to analyze property') },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve saved analyses
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Require authentication
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const analyses = await PropertyAnalysis.find({ userId: auth.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const total = await PropertyAnalysis.countDocuments({ userId: auth.userId });

    const response = NextResponse.json({
      analyses: analyses.map(analysis => ({
        id: analysis._id.toString(),
        propertyAddress: analysis.propertyAddress,
        propertyDetails: analysis.propertyDetails,
        marketData: analysis.marketData,
        createdAt: analysis.createdAt,
      })),
      total,
      limit,
      offset,
    });

    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    return response;
  } catch (error: any) {
    logError('Get Market Analyses', error);
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'Failed to retrieve analyses') },
      { status: 500 }
    );
  }
}

