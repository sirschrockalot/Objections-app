import { 
  getPracticeSessions, 
  getConfidenceRatings, 
  getPracticeHistory,
  getObjections,
  getCategoryStats,
} from './storage';
import { Objection, ConfidenceRating, PracticeHistoryEntry } from '@/types';

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface HeatMapData {
  objectionId: string;
  objectionText: string;
  category: string;
  practiceCount: number;
  averageConfidence: number;
  lastPracticed?: string;
  intensity: number; // 0-100 for heat map coloring
}

export interface CategoryMastery {
  category: string;
  practiced: number;
  total: number;
  averageConfidence: number;
  masteryPercentage: number;
  lastPracticed?: string;
}

export interface WeeklyReport {
  week: string;
  sessions: number;
  objectionsPracticed: number;
  averageConfidence: number;
  practiceTime: number; // in minutes
  categoriesPracticed: string[];
}

export interface MonthlyReport {
  month: string;
  sessions: number;
  objectionsPracticed: number;
  averageConfidence: number;
  practiceTime: number; // in minutes
  improvement: number; // percentage change from previous month
  topCategories: { category: string; count: number }[];
}

// Confidence Trend Analytics
export function getConfidenceTrendData(days: number = 30): TrendDataPoint[] {
  const ratings = getConfidenceRatings();
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  // Group ratings by date
  const ratingsByDate = new Map<string, number[]>();
  
  ratings.forEach(rating => {
    const ratingDate = new Date(rating.date);
    if (ratingDate >= startDate) {
      const dateKey = ratingDate.toISOString().split('T')[0];
      if (!ratingsByDate.has(dateKey)) {
        ratingsByDate.set(dateKey, []);
      }
      ratingsByDate.get(dateKey)!.push(rating.rating);
    }
  });
  
  // Calculate average for each date
  const trendData: TrendDataPoint[] = [];
  ratingsByDate.forEach((ratings, date) => {
    const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    trendData.push({
      date,
      value: average,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  });
  
  // Sort by date
  trendData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return trendData;
}

// Heat Map Analytics
export function getHeatMapData(): HeatMapData[] {
  const objections = getObjections();
  const history = getPracticeHistory();
  const ratings = getConfidenceRatings();
  
  // Calculate practice counts
  const practiceCounts = new Map<string, number>();
  history.forEach(entry => {
    practiceCounts.set(entry.objectionId, (practiceCounts.get(entry.objectionId) || 0) + 1);
  });
  
  // Calculate average confidence per objection
  const confidenceByObjection = new Map<string, number[]>();
  ratings.forEach(rating => {
    if (!confidenceByObjection.has(rating.objectionId)) {
      confidenceByObjection.set(rating.objectionId, []);
    }
    confidenceByObjection.get(rating.objectionId)!.push(rating.rating);
  });
  
  // Get last practiced dates
  const lastPracticed = new Map<string, string>();
  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  history.forEach(entry => {
    if (!lastPracticed.has(entry.objectionId)) {
      lastPracticed.set(entry.objectionId, entry.date);
    }
  });
  
  // Build heat map data
  const heatMapData: HeatMapData[] = objections.map(obj => {
    const count = practiceCounts.get(obj.id) || 0;
    const confidences = confidenceByObjection.get(obj.id) || [];
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((sum, r) => sum + r, 0) / confidences.length
      : 0;
    
    // Calculate intensity (0-100) based on practice count and confidence
    // More practice + higher confidence = higher intensity
    const maxCount = Math.max(...Array.from(practiceCounts.values()), 1);
    const countIntensity = (count / maxCount) * 50; // 0-50 points
    const confidenceIntensity = (avgConfidence / 5) * 50; // 0-50 points
    const intensity = Math.min(100, countIntensity + confidenceIntensity);
    
    return {
      objectionId: obj.id,
      objectionText: obj.text,
      category: obj.category,
      practiceCount: count,
      averageConfidence: avgConfidence,
      lastPracticed: lastPracticed.get(obj.id),
      intensity,
    };
  });
  
  return heatMapData;
}

// Category Mastery Analytics
export function getCategoryMasteryData(): CategoryMastery[] {
  const objections = getObjections();
  const categoryStats = getCategoryStats();
  const ratings = getConfidenceRatings();
  const history = getPracticeHistory();
  
  // Group ratings by category
  const ratingsByCategory = new Map<string, number[]>();
  ratings.forEach(rating => {
    const objection = objections.find(o => o.id === rating.objectionId);
    if (objection) {
      if (!ratingsByCategory.has(objection.category)) {
        ratingsByCategory.set(objection.category, []);
      }
      ratingsByCategory.get(objection.category)!.push(rating.rating);
    }
  });
  
  // Get last practiced dates by category
  const lastPracticedByCategory = new Map<string, string>();
  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  history.forEach(entry => {
    const objection = objections.find(o => o.id === entry.objectionId);
    if (objection && !lastPracticedByCategory.has(objection.category)) {
      lastPracticedByCategory.set(objection.category, entry.date);
    }
  });
  
  // Build mastery data
  const masteryData: CategoryMastery[] = Object.keys(categoryStats).map(category => {
    const stats = categoryStats[category];
    const categoryRatings = ratingsByCategory.get(category) || [];
    const avgConfidence = categoryRatings.length > 0
      ? categoryRatings.reduce((sum, r) => sum + r, 0) / categoryRatings.length
      : 0;
    
    // Mastery = (practiced/total) * (average confidence/5) * 100
    const masteryPercentage = stats.total > 0
      ? (stats.practiced / stats.total) * (avgConfidence / 5) * 100
      : 0;
    
    return {
      category,
      practiced: stats.practiced,
      total: stats.total,
      averageConfidence: avgConfidence,
      masteryPercentage: Math.round(masteryPercentage),
      lastPracticed: lastPracticedByCategory.get(category),
    };
  });
  
  return masteryData.sort((a, b) => b.masteryPercentage - a.masteryPercentage);
}

// Weekly Report Analytics
export function getWeeklyReports(weeks: number = 8): WeeklyReport[] {
  const sessions = getPracticeSessions();
  const history = getPracticeHistory();
  const ratings = getConfidenceRatings();
  
  const reports: WeeklyReport[] = [];
  const now = new Date();
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekKey = weekStart.toISOString().split('T')[0];
    
    // Filter sessions in this week
    const weekSessions = sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });
    
    // Get objections practiced this week
    const weekObjections = new Set<string>();
    weekSessions.forEach(session => {
      session.objectionsPracticed.forEach(id => weekObjections.add(id));
    });
    
    // Get ratings from this week
    const weekRatings = ratings.filter(rating => {
      const ratingDate = new Date(rating.date);
      return ratingDate >= weekStart && ratingDate <= weekEnd;
    });
    
    const avgConfidence = weekRatings.length > 0
      ? weekRatings.reduce((sum, r) => sum + r.rating, 0) / weekRatings.length
      : 0;
    
    // Get categories practiced
    const categoriesPracticed = new Set<string>();
    weekObjections.forEach(id => {
      const objection = getObjections().find(o => o.id === id);
      if (objection) {
        categoriesPracticed.add(objection.category);
      }
    });
    
    const totalTime = weekSessions.reduce((sum, s) => sum + s.duration, 0) / 60; // Convert to minutes
    
    reports.push({
      week: weekKey,
      sessions: weekSessions.length,
      objectionsPracticed: weekObjections.size,
      averageConfidence: avgConfidence,
      practiceTime: Math.round(totalTime),
      categoriesPracticed: Array.from(categoriesPracticed),
    });
  }
  
  return reports;
}

// Monthly Report Analytics
export function getMonthlyReports(months: number = 6): MonthlyReport[] {
  const sessions = getPracticeSessions();
  const history = getPracticeHistory();
  const ratings = getConfidenceRatings();
  const objections = getObjections();
  
  const reports: MonthlyReport[] = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    
    const monthKey = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    // Filter sessions in this month
    const monthSessions = sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= monthStart && sessionDate <= monthEnd;
    });
    
    // Get objections practiced this month
    const monthObjections = new Set<string>();
    monthSessions.forEach(session => {
      session.objectionsPracticed.forEach(id => monthObjections.add(id));
    });
    
    // Get ratings from this month
    const monthRatings = ratings.filter(rating => {
      const ratingDate = new Date(rating.date);
      return ratingDate >= monthStart && ratingDate <= monthEnd;
    });
    
    const avgConfidence = monthRatings.length > 0
      ? monthRatings.reduce((sum, r) => sum + r.rating, 0) / monthRatings.length
      : 0;
    
    // Get top categories
    const categoryCounts = new Map<string, number>();
    monthObjections.forEach(id => {
      const objection = objections.find(o => o.id === id);
      if (objection) {
        categoryCounts.set(objection.category, (categoryCounts.get(objection.category) || 0) + 1);
      }
    });
    
    const topCategories = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    const totalTime = monthSessions.reduce((sum, s) => sum + s.duration, 0) / 60; // Convert to minutes
    
    // Calculate improvement from previous month
    let improvement = 0;
    if (i < months - 1 && reports.length > 0) {
      const previousReport = reports[reports.length - 1];
      if (previousReport.averageConfidence > 0) {
        improvement = ((avgConfidence - previousReport.averageConfidence) / previousReport.averageConfidence) * 100;
      }
    }
    
    reports.push({
      month: monthKey,
      sessions: monthSessions.length,
      objectionsPracticed: monthObjections.size,
      averageConfidence: avgConfidence,
      practiceTime: Math.round(totalTime),
      improvement: Math.round(improvement * 10) / 10,
      topCategories,
    });
  }
  
  return reports;
}

// Improvement Graph Data
export function getImprovementData(): { category: string; data: TrendDataPoint[] }[] {
  const objections = getObjections();
  const categories = Array.from(new Set(objections.map(o => o.category)));
  const ratings = getConfidenceRatings();
  
  return categories.map(category => {
    const categoryObjections = objections.filter(o => o.category === category);
    const categoryRatings = ratings.filter(r => 
      categoryObjections.some(o => o.id === r.objectionId)
    );
    
    // Group by date
    const ratingsByDate = new Map<string, number[]>();
    categoryRatings.forEach(rating => {
      const dateKey = rating.date.split('T')[0];
      if (!ratingsByDate.has(dateKey)) {
        ratingsByDate.set(dateKey, []);
      }
      ratingsByDate.get(dateKey)!.push(rating.rating);
    });
    
    // Calculate averages
    const data: TrendDataPoint[] = [];
    ratingsByDate.forEach((ratings, date) => {
      const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      data.push({
        date,
        value: average,
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    });
    
    data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return { category, data };
  });
}

