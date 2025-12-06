'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, Home, TrendingUp, DollarSign, Calculator } from 'lucide-react';
import { getAuthHeaders } from '@/lib/apiClient';

interface PropertyAnalysis {
  id: string;
  propertyAddress: string;
  propertyDetails: {
    address: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
  };
  marketData: {
    estimatedValue?: number;
    arv?: number;
    repairEstimate?: number;
    mao?: number;
    comps: Array<{
      address: string;
      soldPrice: number;
      soldDate: string;
      distance?: number;
      bedrooms?: number;
      bathrooms?: number;
      squareFeet?: number;
    }>;
    dataSource?: string;
    fetchedAt: string;
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
  createdAt: string;
  cached?: boolean;
}

export default function MarketIntelligence() {
  const [address, setAddress] = useState('');
  const [repairEstimate, setRepairEstimate] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PropertyAnalysis | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!address.trim()) {
      setError('Please enter a property address');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const propertyDetails: any = {};
      if (repairEstimate) {
        const repairValue = parseFloat(repairEstimate);
        if (!isNaN(repairValue) && repairValue >= 0) {
          propertyDetails.repairEstimate = repairValue;
        }
      }

      const response = await fetch('/api/market/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          address: address.trim(),
          propertyDetails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze property');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze property. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Market Intelligence & Comps
          </CardTitle>
          <CardDescription>
            Analyze properties and find comparable sales to determine ARV and MAO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-2">
                Property Address
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 123 Main St, Phoenix, AZ 85001"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleAnalyze();
                  }
                }}
              />
            </div>
            <div>
              <label htmlFor="repairEstimate" className="block text-sm font-medium mb-2">
                Repair Estimate (Optional)
              </label>
              <input
                id="repairEstimate"
                type="number"
                value={repairEstimate}
                onChange={(e) => setRepairEstimate(e.target.value)}
                placeholder="e.g., 35000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                min="0"
                step="1000"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={loading || !address.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Analyze Property
                </>
              )}
            </Button>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Estimated Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analysis.marketData.estimatedValue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  ARV
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analysis.marketData.arv)}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">After Repair Value</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  MAO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analysis.marketData.mao)}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max Allowable Offer</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Repairs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analysis.marketData.repairEstimate)}</div>
              </CardContent>
            </Card>
          </div>

          {/* AI-Generated Insights */}
          {analysis.aiAnalysis && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>
                  Intelligent analysis powered by AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recommended ARV */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Recommended ARV
                  </h3>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      {formatCurrency(analysis.aiAnalysis.recommendedARV.value)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Range: {formatCurrency(analysis.aiAnalysis.recommendedARV.range.min)} - {formatCurrency(analysis.aiAnalysis.recommendedARV.range.max)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Confidence: {analysis.aiAnalysis.recommendedARV.confidence}%
                    </div>
                    {analysis.aiAnalysis.recommendedARV.factors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Key Factors:</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                          {analysis.aiAnalysis.recommendedARV.factors.map((factor, i) => (
                            <li key={i}>{factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Market Trends */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    {analysis.aiAnalysis.marketTrends.direction === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                    {analysis.aiAnalysis.marketTrends.direction === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                    {analysis.aiAnalysis.marketTrends.direction === 'stable' && <Minus className="w-4 h-4 text-gray-600" />}
                    Market Trends
                  </h3>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Direction: </span>
                      <span className={`capitalize ${
                        analysis.aiAnalysis.marketTrends.direction === 'up' ? 'text-green-600' :
                        analysis.aiAnalysis.marketTrends.direction === 'down' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {analysis.aiAnalysis.marketTrends.direction}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({analysis.aiAnalysis.marketTrends.confidence}% confidence)
                      </span>
                    </div>
                    {analysis.aiAnalysis.marketTrends.insights.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1">Insights:</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                          {analysis.aiAnalysis.marketTrends.insights.map((insight, i) => (
                            <li key={i}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="text-xs">
                      <p className="font-medium mb-1">Predictions:</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <strong>3 Months:</strong> {analysis.aiAnalysis.marketTrends.predictions.next3Months}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <strong>6 Months:</strong> {analysis.aiAnalysis.marketTrends.predictions.next6Months}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${
                      analysis.aiAnalysis.riskAssessment.level === 'high' ? 'text-red-600' :
                      analysis.aiAnalysis.riskAssessment.level === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`} />
                    Risk Assessment
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        analysis.aiAnalysis.riskAssessment.level === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        analysis.aiAnalysis.riskAssessment.level === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {analysis.aiAnalysis.riskAssessment.level.toUpperCase()}
                      </span>
                    </div>
                    {analysis.aiAnalysis.riskAssessment.factors.length > 0 && (
                      <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                        {analysis.aiAnalysis.riskAssessment.factors.map((factor, i) => (
                          <li key={i}>{factor}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                {analysis.aiAnalysis.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      Recommendations
                    </h3>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1">
                      {analysis.aiAnalysis.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Comparable Properties */}
          <Card>
            <CardHeader>
              <CardTitle>Comparable Properties ({analysis.marketData.comps.length})</CardTitle>
              <CardDescription>
                Recent sales used to calculate ARV
                {analysis.cached && (
                  <span className="ml-2 text-xs text-gray-500">(Cached result)</span>
                )}
                {analysis.aiAnalysis && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(AI-ranked)</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-2 font-medium">Rank</th>
                      <th className="text-left p-2 font-medium">Address</th>
                      <th className="text-right p-2 font-medium">Sold Price</th>
                      <th className="text-right p-2 font-medium">Sold Date</th>
                      <th className="text-right p-2 font-medium">Distance</th>
                      <th className="text-right p-2 font-medium">Bed/Bath</th>
                      <th className="text-right p-2 font-medium">Sq Ft</th>
                      {analysis.aiAnalysis && (
                        <th className="text-right p-2 font-medium">AI Score</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.marketData.comps.map((comp, index) => {
                      const ranking = analysis.aiAnalysis?.compsRanking.find(r => r.compId === index);
                      return (
                        <tr
                          key={index}
                          className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            ranking && ranking.score >= 80 ? 'bg-green-50/50 dark:bg-green-900/10' :
                            ranking && ranking.score >= 60 ? 'bg-yellow-50/50 dark:bg-yellow-900/10' :
                            ''
                          }`}
                        >
                          <td className="p-2 font-medium text-gray-900 dark:text-gray-100">
                            {ranking ? (
                              <span className="flex items-center gap-1">
                                <span className="font-bold">#{ranking.compId + 1}</span>
                                {ranking.score >= 80 && <CheckCircle className="w-3 h-3 text-green-600" />}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-2 font-medium text-gray-900 dark:text-gray-100">
                            {comp.address}
                            {ranking && ranking.reasoning && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {ranking.reasoning}
                              </div>
                            )}
                          </td>
                          <td className="text-right p-2 font-semibold">
                            {formatCurrency(comp.soldPrice)}
                          </td>
                          <td className="text-right p-2 text-gray-600 dark:text-gray-400">
                            {formatDate(comp.soldDate)}
                          </td>
                          <td className="text-right p-2 text-gray-600 dark:text-gray-400">
                            {comp.distance ? `${comp.distance.toFixed(2)} mi` : 'N/A'}
                          </td>
                          <td className="text-right p-2 text-gray-600 dark:text-gray-400">
                            {comp.bedrooms || 'N/A'} / {comp.bathrooms || 'N/A'}
                          </td>
                          <td className="text-right p-2 text-gray-600 dark:text-gray-400">
                            {comp.squareFeet ? comp.squareFeet.toLocaleString() : 'N/A'}
                          </td>
                          {analysis.aiAnalysis && (
                            <td className="text-right p-2">
                              {ranking ? (
                                <span className={`font-semibold ${
                                  ranking.score >= 80 ? 'text-green-600' :
                                  ranking.score >= 60 ? 'text-yellow-600' :
                                  'text-gray-600'
                                }`}>
                                  {ranking.score}/100
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

