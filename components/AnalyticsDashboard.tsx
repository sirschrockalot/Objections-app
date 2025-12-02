'use client';

import { useState, useEffect } from 'react';
import { 
  getConfidenceTrendData, 
  getHeatMapData, 
  getCategoryMasteryData,
  getWeeklyReports,
  getMonthlyReports,
  getImprovementData,
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

  // Load data
  const confidenceTrend = getConfidenceTrendData(trendDays);
  const heatMapData = getHeatMapData();
  const categoryMastery = getCategoryMasteryData();
  const weeklyReports = getWeeklyReports(8);
  const monthlyReports = getMonthlyReports(6);
  const improvementData = getImprovementData();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'heatmap', label: 'Heat Map', icon: Flame },
    { id: 'mastery', label: 'Mastery', icon: Trophy },
    { id: 'reports', label: 'Reports', icon: Calendar },
  ];

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
          <ConfidenceTrendChart data={getConfidenceTrendData(trendDays)} />
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

