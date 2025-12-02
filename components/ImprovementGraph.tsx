'use client';

import { TrendDataPoint } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ImprovementGraphProps {
  data: { category: string; data: TrendDataPoint[] }[];
}

export default function ImprovementGraph({ data }: ImprovementGraphProps) {
  if (data.length === 0 || data.every(d => d.data.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Improvement by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const categoryColors: Record<string, string> = {
    'Price': '#ef4444',
    'Timing': '#eab308',
    'Trust': '#a855f7',
    'Property': '#22c55e',
    'Financial': '#3b82f6',
    'Interest': '#f97316',
  };

  // Get all unique dates
  const allDates = new Set<string>();
  data.forEach(category => {
    category.data.forEach(point => allDates.add(point.date));
  });
  const sortedDates = Array.from(allDates).sort();

  // Find max value across all categories
  const maxValue = Math.max(
    ...data.flatMap(category => category.data.map(d => d.value)),
    5
  );

  const width = 800;
  const height = 400;
  const padding = 50;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Improvement by Category</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Track confidence trends across different objection categories
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
            {/* Grid lines */}
            {[0, 1, 2, 3, 4, 5].map(value => {
              const y = padding + chartHeight - (value / maxValue) * chartHeight;
              return (
                <g key={value}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-500"
                  >
                    {value.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Draw lines for each category */}
            {data.filter(category => category.data.length > 0).map((category, catIndex) => {
              const color = categoryColors[category.category] || '#6b7280';
              const points = category.data.map((point, index) => {
                const dateIndex = sortedDates.indexOf(point.date);
                const x = padding + (dateIndex / (sortedDates.length - 1 || 1)) * chartWidth;
                const y = padding + chartHeight - (point.value / maxValue) * chartHeight;
                return { x, y, ...point };
              });

              const pathData = points.map((point, index) => {
                return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
              }).join(' ');

              return (
                <g key={category.category}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                  />
                  {points.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r="3"
                      fill={color}
                      className="hover:r-5 transition-all cursor-pointer"
                    />
                  ))}
                </g>
              );
            })}

            {/* Legend */}
            <g transform={`translate(${width - padding - 150}, ${padding})`}>
              {data.filter(category => category.data.length > 0).map((category, index) => {
                const color = categoryColors[category.category] || '#6b7280';
                return (
                  <g key={category.category} transform={`translate(0, ${index * 20})`}>
                    <rect width="12" height="12" fill={color} rx="2" />
                    <text x="18" y="10" className="text-xs fill-gray-700">
                      {category.category}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* X-axis labels */}
            {sortedDates.filter((_, i) => i % Math.ceil(sortedDates.length / 6) === 0 || i === sortedDates.length - 1).map((date, index) => {
              const x = padding + (sortedDates.indexOf(date) / (sortedDates.length - 1 || 1)) * chartWidth;
              return (
                <text
                  key={index}
                  x={x}
                  y={height - padding + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

