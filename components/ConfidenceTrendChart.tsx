'use client';

import { TrendDataPoint } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfidenceTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
}

export default function ConfidenceTrendChart({ data, title = 'Confidence Trend' }: ConfidenceTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No data available yet. Start practicing to see your trends!</p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 5);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  const width = 800;
  const height = 300;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate points
  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;
    return { x, y, ...point };
  });

  // Create path for line
  const pathData = points.map((point, index) => {
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' ');

  // Create area path
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
            {/* Grid lines */}
            {[0, 1, 2, 3, 4, 5].map(value => {
              const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
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

            {/* Area under curve */}
            <path
              d={areaPath}
              fill="url(#gradient)"
              opacity="0.3"
            />

            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points */}
            {points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#3b82f6"
                  className="hover:r-6 transition-all cursor-pointer"
                />
                <title>{point.label || point.date}: {point.value.toFixed(1)}/5</title>
              </g>
            ))}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* X-axis labels */}
            {points.filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === points.length - 1).map((point, index) => (
              <text
                key={index}
                x={point.x}
                y={height - padding + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {point.label || point.date.split('-').slice(1).join('/')}
              </text>
            ))}
          </svg>
        </div>
        <div className="mt-4 text-sm text-gray-600 text-center">
          Average: {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(2)}/5
        </div>
      </CardContent>
    </Card>
  );
}

