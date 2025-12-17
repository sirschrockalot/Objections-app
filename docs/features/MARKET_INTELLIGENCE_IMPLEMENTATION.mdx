# Market Intelligence & Comps Tool - Implementation Plan

## Overview
This document details the technical implementation of the Market Intelligence & Comps Tool, including AI integration for enhanced analysis and insights.

---

## 🏗️ Architecture

### High-Level Architecture
```
User Input (Address/Property)
    ↓
API Gateway / Backend Route
    ↓
┌─────────────────────────────────────┐
│  Data Aggregation Layer             │
│  - Zillow API                       │
│  - Redfin API                       │
│  - Realtor.com API                  │
│  - County Records API               │
│  - MLS Data (if available)          │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Data Processing & Storage           │
│  - Normalize data formats            │
│  - Cache results                     │
│  - Store in MongoDB                  │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  AI Analysis Layer                   │
│  - OpenAI GPT-4 for insights        │
│  - Trend analysis                   │
│  - Value prediction                 │
│  - Report generation                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Presentation Layer                  │
│  - Comps table                      │
│  - Market trends chart              │
│  - AI-generated insights            │
│  - PDF report                       │
└─────────────────────────────────────┘
```

---

## 📊 Data Sources & APIs

### 1. Primary Data Sources

#### A. Zillow API (Zillow Zestimate)
**What it provides:**
- Property Zestimate (estimated value)
- Historical Zestimate data
- Property details (bedrooms, bathrooms, sqft)
- Neighborhood data
- Recent sales

**Limitations:**
- Rate limits (1,000 calls/day on free tier)
- Not always accurate for distressed properties
- May require paid subscription for commercial use

**Implementation:**
```typescript
// lib/marketData/zillow.ts
interface ZillowProperty {
  zpid: string;
  address: string;
  zestimate: number;
  rentZestimate: number;
  lastSoldPrice: number;
  lastSoldDate: string;
  propertyDetails: {
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    lotSize: number;
  };
}

async function getZillowData(address: string): Promise<ZillowProperty> {
  // Use Zillow API or web scraping (with legal considerations)
  // Note: Zillow doesn't have a public API, may need to use:
  // - Zillow RapidAPI wrapper
  // - Web scraping (check ToS)
  // - Third-party data aggregators
}
```

#### B. Redfin API
**What it provides:**
- Property estimates
- Recent sales
- Market trends
- School ratings

**Implementation:**
```typescript
// lib/marketData/redfin.ts
// Redfin has limited API access, may need web scraping
// Consider using Redfin Data Center for bulk data
```

#### C. Realtor.com API
**What it provides:**
- Property listings
- Sold properties
- Market statistics
- Neighborhood information

**Implementation:**
```typescript
// lib/marketData/realtor.ts
// Realtor.com API requires partnership/approval
// Alternative: Use RapidAPI Realtor.com wrapper
```

#### D. County Records / Public Records
**What it provides:**
- Ownership history
- Tax assessments
- Property characteristics
- Sales history

**Implementation:**
```typescript
// lib/marketData/countyRecords.ts
// Each county has different systems
// May need to integrate with:
// - PropertyRadar API
// - DataTree API
// - County-specific APIs
```

### 2. Alternative Data Aggregators (Recommended)

#### A. RentSpider / Rentals.com API
- Comprehensive property data
- Multiple sources aggregated
- More reliable than individual APIs

#### B. RealtyMole Property API
- Property data
- Comps
- Rent estimates
- Market trends

#### C. ATTOM Data Solutions
- Comprehensive property data
- Market trends
- Investment analytics
- **Cost:** Paid service ($100-500/month)

#### D. CoreLogic / RealtyTrac
- Property data
- Foreclosure data
- Market analytics
- **Cost:** Enterprise pricing

---

## 🤖 AI Integration

### AI Use Cases

#### 1. **Intelligent Comps Selection**
**Problem:** Finding truly comparable properties is complex (same size, condition, location, timing)

**AI Solution:**
```typescript
// lib/ai/compsAnalysis.ts
import OpenAI from 'openai';

interface CompAnalysisRequest {
  subjectProperty: PropertyDetails;
  potentialComps: PropertyData[];
  marketContext: MarketData;
}

async function analyzeComps(request: CompAnalysisRequest): Promise<CompAnalysis> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const prompt = `You are a real estate valuation expert. Analyze these properties and determine which are the best comparables for the subject property.

Subject Property:
- Address: ${request.subjectProperty.address}
- ARV: $${request.subjectProperty.arv}
- Bedrooms: ${request.subjectProperty.bedrooms}
- Bathrooms: ${request.subjectProperty.bathrooms}
- Square Feet: ${request.subjectProperty.squareFeet}
- Condition: ${request.subjectProperty.condition}
- Property Type: ${request.subjectProperty.propertyType}

Potential Comparables:
${request.potentialComps.map((comp, i) => `
${i + 1}. ${comp.address}
   - Sold Price: $${comp.soldPrice}
   - Sold Date: ${comp.soldDate}
   - Bedrooms: ${comp.bedrooms}
   - Bathrooms: ${comp.bathrooms}
   - Square Feet: ${comp.squareFeet}
   - Distance: ${comp.distance} miles
   - Condition: ${comp.condition}
`).join('\n')}

Market Context:
- Market Type: ${request.marketContext.marketType}
- Days on Market Average: ${request.marketContext.avgDaysOnMarket}
- Inventory Level: ${request.marketContext.inventory}

Please:
1. Rank the comparables from best to worst match
2. Explain why each is or isn't a good comp
3. Adjust for differences (size, condition, location, timing)
4. Provide a recommended ARV range
5. Identify any red flags or concerns

Format your response as JSON.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are an expert real estate appraiser with 20 years of experience.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3, // Lower temperature for more consistent, factual responses
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

#### 2. **Market Trend Analysis**
**AI Solution:**
```typescript
// lib/ai/marketTrends.ts
async function analyzeMarketTrends(propertyData: PropertyData[], location: string): Promise<MarketInsights> {
  const prompt = `Analyze these market trends for ${location}:

Recent Sales Data:
${propertyData.map(p => `- ${p.address}: Sold $${p.soldPrice} on ${p.soldDate} (${p.squareFeet} sqft)`).join('\n')}

Provide:
1. Price trend (increasing/decreasing/stable)
2. Market velocity (fast/slow)
3. Inventory levels
4. Buyer/seller market indicators
5. Predictions for next 3-6 months
6. Investment opportunities or risks

Format as JSON with insights and confidence levels.`;

  // Use GPT-4 to analyze trends
  // Could also use time-series analysis models
}
```

#### 3. **ARV Prediction & Validation**
**AI Solution:**
```typescript
// lib/ai/arvPrediction.ts
async function predictARV(property: PropertyDetails, comps: PropertyData[]): Promise<ARVPrediction> {
  const prompt = `Predict the After Repair Value (ARV) for this property:

Property Details:
${JSON.stringify(property, null, 2)}

Comparable Sales:
${JSON.stringify(comps, null, 2)}

Consider:
- Property condition and needed repairs
- Location and neighborhood trends
- Market timing
- Comparable adjustments

Provide:
1. Predicted ARV (with confidence range)
2. Key factors influencing the value
3. Risk factors
4. Recommended offer price (70% of ARV minus repairs)

Format as JSON.`;
}
```

#### 4. **Natural Language Queries**
**AI Solution:**
```typescript
// lib/ai/propertyQuery.ts
async function queryProperty(question: string, propertyData: PropertyData): Promise<string> {
  // Allow users to ask questions like:
  // "Is this a good deal?"
  // "What's the risk level?"
  // "How does this compare to similar properties?"
  // "What repairs will have the best ROI?"
  
  const prompt = `Answer this question about the property: "${question}"

Property Data:
${JSON.stringify(propertyData, null, 2)}

Provide a clear, concise answer based on the data.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a real estate investment advisor.' },
      { role: 'user', content: prompt }
    ]
  });

  return response.choices[0].message.content;
}
```

#### 5. **Automated Report Generation**
**AI Solution:**
```typescript
// lib/ai/reportGenerator.ts
async function generateMarketReport(property: PropertyDetails, analysis: CompAnalysis): Promise<string> {
  const prompt = `Generate a professional market analysis report for:

Property: ${property.address}
ARV: $${property.arv}
Analysis Results: ${JSON.stringify(analysis, null, 2)}

Create a comprehensive report including:
1. Executive Summary
2. Property Overview
3. Comparable Sales Analysis
4. Market Trends
5. Investment Analysis
6. Recommendations
7. Risk Assessment

Format as professional markdown.`;

  // Generate report, then convert to PDF
}
```

---

## 💻 Technical Implementation

### 1. Database Schema

```typescript
// lib/models/PropertyAnalysis.ts
import mongoose from 'mongoose';

interface IPropertyAnalysis {
  _id: string;
  userId: string;
  propertyAddress: string;
  propertyDetails: {
    address: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    lotSize: number;
    yearBuilt: number;
    propertyType: string;
  };
  marketData: {
    zestimate?: number;
    arv: number;
    repairEstimate: number;
    mao: number; // Maximum Allowable Offer
    comps: Array<{
      address: string;
      soldPrice: number;
      soldDate: string;
      distance: number;
      adjustments: {
        size: number;
        condition: number;
        location: number;
        timing: number;
      };
    }>;
  };
  aiAnalysis: {
    compsRanking: Array<{
      compId: string;
      score: number;
      reasoning: string;
    }>;
    marketTrends: {
      direction: 'up' | 'down' | 'stable';
      confidence: number;
      insights: string[];
    };
    arvPrediction: {
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

const PropertyAnalysisSchema = new Schema<IPropertyAnalysis>({
  userId: { type: String, required: true, index: true },
  propertyAddress: { type: String, required: true },
  propertyDetails: { type: Schema.Types.Mixed, required: true },
  marketData: { type: Schema.Types.Mixed, required: true },
  aiAnalysis: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPropertyAnalysis>('PropertyAnalysis', PropertyAnalysisSchema);
```

### 2. API Route Structure

```typescript
// app/api/market/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authMiddleware';
import { getPropertyData } from '@/lib/marketData/aggregator';
import { analyzeComps, predictARV, analyzeMarketTrends } from '@/lib/ai';
import PropertyAnalysis from '@/lib/models/PropertyAnalysis';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { address, propertyDetails } = body;

    // 1. Fetch market data from multiple sources
    const marketData = await getPropertyData(address);

    // 2. Find comparable properties
    const comps = await findComparables(marketData, propertyDetails);

    // 3. AI Analysis
    const [compsAnalysis, arvPrediction, marketTrends] = await Promise.all([
      analyzeComps({ subjectProperty: propertyDetails, potentialComps: comps, marketContext: marketData }),
      predictARV(propertyDetails, comps),
      analyzeMarketTrends(comps, address)
    ]);

    // 4. Calculate MAO
    const repairEstimate = propertyDetails.repairEstimate || 0;
    const mao = (arvPrediction.value * 0.7) - repairEstimate;

    // 5. Save analysis
    const analysis = await PropertyAnalysis.create({
      userId: auth.userId!,
      propertyAddress: address,
      propertyDetails,
      marketData: {
        ...marketData,
        arv: arvPrediction.value,
        repairEstimate,
        mao,
        comps
      },
      aiAnalysis: {
        compsRanking: compsAnalysis.ranking,
        marketTrends,
        arvPrediction,
        riskAssessment: compsAnalysis.riskAssessment,
        recommendations: compsAnalysis.recommendations
      }
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Market analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze property' },
      { status: 500 }
    );
  }
}
```

### 3. Frontend Component

```typescript
// components/MarketIntelligence.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MarketIntelligence() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/market/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Market Intelligence & Comps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter property address"
              className="w-full p-2 border rounded"
            />
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze Property'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">ARV Prediction</h3>
                  <p>${analysis.aiAnalysis.arvPrediction.value.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">
                    Range: ${analysis.aiAnalysis.arvPrediction.range.min.toLocaleString()} - 
                    ${analysis.aiAnalysis.arvPrediction.range.max.toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Market Trends</h3>
                  <p>{analysis.aiAnalysis.marketTrends.insights.join(', ')}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Recommendations</h3>
                  <ul className="list-disc list-inside">
                    {analysis.aiAnalysis.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparable Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Sold Price</th>
                    <th>Distance</th>
                    <th>AI Score</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.marketData.comps.map((comp, i) => (
                    <tr key={i}>
                      <td>{comp.address}</td>
                      <td>${comp.soldPrice.toLocaleString()}</td>
                      <td>{comp.distance} miles</td>
                      <td>
                        {analysis.aiAnalysis.compsRanking.find(r => r.compId === comp.id)?.score || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
```

---

## 🔌 API Integration Options

### Option 1: RapidAPI (Recommended for MVP)
**Pros:**
- Multiple data sources in one place
- Pay-per-use pricing
- Easy integration
- Good documentation

**Services:**
- Zillow API (via RapidAPI)
- Realtor.com API
- RealtyMole Property API

**Cost:** ~$0.01-0.10 per API call

### Option 2: Direct API Partnerships
**Pros:**
- More reliable
- Better data quality
- Higher rate limits

**Cons:**
- Requires approval/partnership
- Higher costs
- More complex setup

**Services:**
- ATTOM Data
- CoreLogic
- Black Knight

**Cost:** $100-500/month

### Option 3: Web Scraping (Use with Caution)
**Pros:**
- Free
- Access to public data

**Cons:**
- Legal/ToS concerns
- Unreliable
- Requires maintenance
- May violate terms of service

**Recommendation:** Use only as backup, not primary source

---

## 💰 Cost Estimation

### Monthly Costs (Estimated)

1. **Data APIs:**
   - RapidAPI: $50-200/month (depending on usage)
   - ATTOM Data: $200-500/month (if using premium)

2. **AI (OpenAI GPT-4):**
   - ~$0.03 per analysis (input + output tokens)
   - 100 analyses/day = ~$90/month
   - 500 analyses/day = ~$450/month

3. **Storage:**
   - MongoDB: Included in current plan
   - Cache (Redis): $0-20/month

**Total Estimated:** $140-720/month depending on usage

---

## 🚀 Implementation Phases

### Phase 1: Basic Comps (Week 1-2)
- Integrate one data source (RapidAPI)
- Basic property lookup
- Simple comps table
- No AI yet

### Phase 2: AI Integration (Week 3-4)
- Add OpenAI integration
- Comps ranking
- ARV prediction
- Basic insights

### Phase 3: Enhanced Features (Week 5-6)
- Multiple data sources
- Market trends
- Report generation
- Caching layer

### Phase 4: Advanced AI (Week 7-8)
- Natural language queries
- Risk assessment
- Investment recommendations
- PDF reports

---

## 🔒 Legal & Compliance Considerations

1. **Data Usage:**
   - Review API terms of service
   - Ensure compliance with data licensing
   - Don't resell data without permission

2. **AI Disclaimers:**
   - Add disclaimers that AI predictions are estimates
   - Not a substitute for professional appraisal
   - Users should verify all data

3. **Rate Limiting:**
   - Implement rate limiting to prevent abuse
   - Cache results to reduce API calls
   - Monitor usage to control costs

---

## 📝 Next Steps

1. **Choose data provider** (recommend RapidAPI for MVP)
2. **Set up OpenAI account** and get API key
3. **Create database schema** for property analyses
4. **Build basic API route** for property lookup
5. **Integrate first data source**
6. **Add AI analysis layer**
7. **Build frontend component**
8. **Test with real properties**
9. **Add caching and optimization**
10. **Deploy and monitor**

---

## 🎯 Success Metrics

Track:
- Number of analyses per user
- Accuracy of ARV predictions (vs actual sales)
- User satisfaction with insights
- Cost per analysis
- API response times
- Cache hit rates

