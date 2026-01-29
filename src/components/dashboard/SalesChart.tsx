'use client';

import React from 'react';

// Interfaces
interface ChartDataPoint {
    label: string;
    value: number;
    date?: string;
}

interface SalesChartProps {
    data?: ChartDataPoint[];
}

export default function SalesChart({ data }: SalesChartProps) {
    const chartData = data && data.length > 0 ? data : [];

    // Calculate range
    const maxVal = Math.max(...chartData.map(d => d.value), 10);
    const MAX_VALUE = Math.ceil(maxVal * 1.1);

    const Y_AXIS_STEPS = 5;
    const yLabels = Array.from({ length: Y_AXIS_STEPS }, (_, i) => {
        return (MAX_VALUE / (Y_AXIS_STEPS - 1)) * i;
    }).reverse();

    if (chartData.length === 0) {
        return (
            <div className="w-full h-full bg-white p-6 rounded-md shadow-md border flex items-center justify-center p-8" style={{ minHeight: '400px' }}>
                <p className="text-secondary">No hay datos para mostrar</p>
            </div>
        );
    }

    // SVG Coordinates Calculation
    // We use a 0-100 coordinate system for the SVG content to be responsive
    const totalPoints = chartData.length;
    // We want points centered in their 'sections'. 
    // Section width = 100 / totalPoints.
    // Point X = (Section Width * i) + (Section Width / 2)
    const getX = (index: number) => ((100 / totalPoints) * index) + ((100 / totalPoints) / 2);
    // Y = 100 - (Value / Max * 100)
    const getY = (value: number) => 100 - ((value / MAX_VALUE) * 100);

    const points = chartData.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
    const areaPoints = `0,100 ${points} 100,100`; // Start bottom-left, go through points, end bottom-right, close loop? 
    // Better area path:
    // Start at first X, bottom (100).
    // Go to first X, Y.
    // ... all points ...
    // Go to last X, Y.
    // Go to last X, bottom (100).
    const firstX = getX(0);
    const lastX = getX(totalPoints - 1);
    const areaPath = `${firstX},100 ${points} ${lastX},100`;

    return (
        <div className="w-full bg-white p-6 rounded-md shadow-md border flex flex-col font-sans" style={{ minHeight: '400px' }}>
            <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-primary">Evolución de Ventas</h2>
            </div>

            <div className="flex-1 flex gap-4 relative" style={{ minHeight: '300px' }}>
                {/* Y-Axis */}
                <div className="flex flex-col justify-between items-end text-right pr-3 text-xs font-semibold text-secondary" style={{ width: '60px' }}>
                    {yLabels.map((val, idx) => (
                        <div key={idx} className="flex items-center justify-end" style={{ height: '0px' }}>
                            <span style={{ transform: 'translateY(5px)' }}>
                                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Chart Area */}
                <div className="relative flex-1 border-l border-b border-gray-200">

                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {yLabels.map((_, idx) => (
                            <div key={idx} className="w-full border-t border-gray-100 h-0"></div>
                        ))}
                    </div>

                    {/* SVG Chart */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">

                        {/* Area Fill */}
                        <polygon
                            points={areaPath}
                            fill="url(#gradient)"
                            opacity="0.2"
                        />

                        {/* Define Gradient */}
                        <defs>
                            <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#004b8d" />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Line Stroke */}
                        <polyline
                            points={points}
                            fill="none"
                            stroke="#004b8d"
                            strokeWidth="0.8"
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Data Points (Dots) */}
                        {chartData.map((d, i) => (
                            <g key={i}>
                                <circle
                                    cx={getX(i)}
                                    cy={getY(d.value)}
                                    r="1.5"
                                    fill="white"
                                    stroke="#ec0000"
                                    strokeWidth="0.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                                {/* Value Label above point (only if > 0) */}
                                {d.value > 0 && (
                                    <text
                                        x={getX(i)}
                                        y={getY(d.value) - 3}
                                        textAnchor="middle"
                                        fontSize="3"
                                        fill="#004b8d"
                                        fontWeight="bold"
                                    >
                                        {d.value}
                                    </text>
                                )}
                            </g>
                        ))}
                    </svg>

                </div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex gap-4 mt-2">
                <div style={{ width: '60px' }}></div>
                <div className="flex-1 flex relative">
                    {chartData.map((d, i) => (
                        <div key={i} className="flex justify-center" style={{ width: `${100 / totalPoints}%` }}>
                            <span className="text-xs text-gray-500 font-medium truncate px-1">
                                {d.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
