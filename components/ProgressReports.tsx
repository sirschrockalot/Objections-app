'use client';

import { WeeklyReport, MonthlyReport } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Clock, Target } from 'lucide-react';

interface ProgressReportsProps {
  weeklyReports: WeeklyReport[];
  monthlyReports: MonthlyReport[];
}

export default function ProgressReports({ weeklyReports, monthlyReports }: ProgressReportsProps) {
  return (
    <div className="space-y-6">
      {/* Weekly Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Progress Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyReports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No weekly data available yet.</p>
          ) : (
            <div className="space-y-4">
              {weeklyReports.map((report, index) => (
                <motion.div
                  key={report.week}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">
                      Week of {new Date(report.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {report.sessions} session{report.sessions !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-lg font-bold text-gray-900">{report.objectionsPracticed}</div>
                        <div className="text-xs text-gray-600">Objections</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{report.averageConfidence.toFixed(1)}</div>
                        <div className="text-xs text-gray-600">Avg Confidence</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <div>
                        <div className="text-lg font-bold text-gray-900">{report.practiceTime}m</div>
                        <div className="text-xs text-gray-600">Practice Time</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{report.categoriesPracticed.length}</div>
                      <div className="text-xs text-gray-600">Categories</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly Progress Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyReports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No monthly data available yet.</p>
          ) : (
            <div className="space-y-4">
              {monthlyReports.map((report, index) => (
                <motion.div
                  key={report.month}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg">{report.month}</h4>
                    {report.improvement !== 0 && (
                      <div className={`flex items-center gap-1 ${
                        report.improvement > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {report.improvement > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-bold">
                          {report.improvement > 0 ? '+' : ''}{report.improvement.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{report.sessions}</div>
                      <div className="text-xs text-gray-600">Sessions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{report.objectionsPracticed}</div>
                      <div className="text-xs text-gray-600">Objections</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{report.averageConfidence.toFixed(1)}</div>
                      <div className="text-xs text-gray-600">Avg Confidence</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{report.practiceTime}m</div>
                      <div className="text-xs text-gray-600">Practice Time</div>
                    </div>
                  </div>
                  
                  {report.topCategories.length > 0 && (
                    <div className="pt-3 border-t border-blue-200">
                      <div className="text-xs font-medium text-gray-700 mb-2">Top Categories:</div>
                      <div className="flex flex-wrap gap-2">
                        {report.topCategories.map((cat, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 bg-white rounded border border-blue-200 text-gray-700"
                          >
                            {cat.category} ({cat.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

