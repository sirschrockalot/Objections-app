'use client';

import { useState, useEffect } from 'react';
import { 
  getConfidenceTrendData, 
  getHeatMapData, 
  getCategoryMasteryData,
  getWeeklyReports,
  getMonthlyReports,
  getImprovementData,
  TrendDataPoint,
  HeatMapData,
  CategoryMastery,
  WeeklyReport,
  MonthlyReport,
} from '@/lib/analytics';
import ConfidenceTrendChart from './ConfidenceTrendChart';
import HeatMap from './HeatMap';
import CategoryMasteryChart from './CategoryMasteryChart';
import ProgressReports from './ProgressReports';
import ImprovementGraph from './ImprovementGraph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Flame, Trophy, Calendar, TrendingUp, X } from 'lucide-react';

interface AnalyticsDashboardProps {
  onSelectObjection?: (objectionId: string) => void;
}

export default function AnalyticsDashboard({ onSelectObjection }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'heatmap' | 'mastery' | 'reports'>('overview');
  const [trendDays, setTrendDays] = useState(30);
  const [confidenceTrend, setConfidenceTrend] = useState<TrendDataPoint[]>([]);
  const [heatMapData, setHeatMapData] = useState<HeatMapData[]>([]);
  const [categoryMastery, setCategoryMastery] = useState<CategoryMastery[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [improvementData, setImprovementData] = useState<{ category: string; data: TrendDataPoint[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [trend, heatMap, mastery, weekly, monthly, improvement] = await Promise.all([
          getConfidenceTrendData(trendDays),
          getHeatMapData(),
          getCategoryMasteryData(),
          getWeeklyReports(8),
          getMonthlyReports(6),
          getImprovementData(),
        ]);
        setConfidenceTrend(trend);
        setHeatMapData(heatMap);
        setCategoryMastery(mastery);
        setWeeklyReports(weekly);
        setMonthlyReports(monthly);
        setImprovementData(improvement);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [trendDays]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'heatmap', label: 'Heat Map', icon: Flame },
    { id: 'mastery', label: 'Mastery', icon: Trophy },
    { id: 'reports', label: 'Reports', icon: Calendar },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConfidenceTrendChart data={confidenceTrend} title="Confidence Trend (30 Days)" />
          <CategoryMasteryChart data={categoryMastery} />
          <div className="lg:col-span-2">
            <HeatMap data={heatMapData.slice(0, 12)} onSelectObjection={onSelectObjection} />
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Confidence Trend</CardTitle>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={trendDays === 7 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTrendDays(7)}
                >
                  7 Days
                </Button>
                <Button
                  variant={trendDays === 30 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTrendDays(30)}
                >
                  30 Days
                </Button>
                <Button
                  variant={trendDays === 90 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTrendDays(90)}
                >
                  90 Days
                </Button>
              </div>
            </CardHeader>
          </Card>
          <ConfidenceTrendChart data={confidenceTrend} />
          <ImprovementGraph data={improvementData} />
        </div>
      )}

      {/* Heat Map Tab */}
      {activeTab === 'heatmap' && (
        <HeatMap data={heatMapData} onSelectObjection={onSelectObjection} />
      )}

      {/* Mastery Tab */}
      {activeTab === 'mastery' && (
        <CategoryMasteryChart data={categoryMastery} />
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <ProgressReports weeklyReports={weeklyReports} monthlyReports={monthlyReports} />
      )}
    </div>
  );
}

