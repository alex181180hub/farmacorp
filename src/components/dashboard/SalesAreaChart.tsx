'use client';

import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps
} from 'recharts';

interface ChartDataPoint {
    label: string;
    value: number;
    date?: string;
}

interface SalesAreaChartProps {
    data?: ChartDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                backgroundColor: '#fff',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                border: 'none',
                outline: 'none',
                minWidth: '150px'
            }}>
                <p className="text-sm font-semibold text-gray-700 mb-1">{label}</p>
                <p className="text-lg font-bold text-blue-600">
                    {new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(payload[0].value as number)}
                </p>
            </div>
        );
    }
    return null;
};

export default function SalesAreaChart({ data }: SalesAreaChartProps) {
    const chartData = data && data.length > 0 ? data : [];

    if (chartData.length === 0) {
        return (
            <div className="w-full h-96 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-400">No hay datos para mostrar</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">Tendencia de Ventas</h2>
                <p className="text-sm text-gray-500 mt-1">Evolución diaria de ventas netas</p>
            </div>

            <div className="flex-1 min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{
                            top: 10,
                            right: 10,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickFormatter={(value) =>
                                new Intl.NumberFormat('es-BO', {
                                    notation: 'compact',
                                    compactDisplay: 'short'
                                }).format(value)
                            }
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fill="url(#colorValue)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
