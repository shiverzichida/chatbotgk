'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface LogData {
  date: string;
  weight: number;
  muscle: number;
  fat: number;
}

interface ProgressChartProps {
  data: LogData[];
}

export default function ProgressChart({ data }: ProgressChartProps) {
  // Urutkan data berdasarkan tanggal sebelum dirender ke grafik
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Format tanggal untuk tampilan sumbu X
  const chartData = sortedData.map(item => {
    const formattedDate = new Date(item.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
    return {
      ...item,
      displayDate: formattedDate
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900/95 dark:bg-zinc-950/95 border border-zinc-800 p-4 rounded-xl shadow-xl text-xs space-y-2">
          <p className="font-bold text-zinc-300 border-b border-zinc-850 pb-1 mb-1.5">{label}</p>
          <p className="flex items-center gap-2 font-medium text-sky-400">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>Berat: {payload[0].value} kg</span>
          </p>
          {payload[1] && (
            <p className="flex items-center gap-2 font-medium text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Otot: {payload[1].value} kg</span>
            </p>
          )}
          {payload[2] && (
            <p className="flex items-center gap-2 font-medium text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Lemak: {payload[2].value} kg</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80 sm:h-96">
      {chartData.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/10 p-6 text-center">
          <p className="text-zinc-500 text-sm">Belum ada data timbangan yang tercatat.</p>
          <p className="text-zinc-400 text-xs mt-1">Gunakan form di samping untuk mencatat log InBody pertama Anda.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid 
              strokeDasharray="4 4" 
              vertical={false} 
              className="stroke-zinc-100 dark:stroke-zinc-800" 
            />
            <XAxis 
              dataKey="displayDate" 
              stroke="#888888" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#888888" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              domain={['dataMin - 3', 'dataMax + 3']}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={40} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
            />
            {/* Berat Badan */}
            <Line
              type="monotone"
              dataKey="weight"
              name="Berat Badan"
              stroke="#0284c7"
              strokeWidth={3}
              dot={{ stroke: '#0284c7', strokeWidth: 1, r: 4, fill: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            {/* Skeletal Muscle Mass */}
            <Line
              type="monotone"
              dataKey="muscle"
              name="Massa Otot (SMM)"
              stroke="#059669"
              strokeWidth={3}
              dot={{ stroke: '#059669', strokeWidth: 1, r: 4, fill: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            {/* Body Fat Mass */}
            <Line
              type="monotone"
              dataKey="fat"
              name="Massa Lemak (BFM)"
              stroke="#e11d48"
              strokeWidth={3}
              dot={{ stroke: '#e11d48', strokeWidth: 1, r: 4, fill: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
