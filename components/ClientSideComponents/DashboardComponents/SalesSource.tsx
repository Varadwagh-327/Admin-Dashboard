"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#ff2d78", "#ff8fb3", "#ffc8d9"];

const DATASETS: Record<string, { name: string; value: number }[]> = {
  Weekly: [
    { name: "Advertising", value: 40 },
    { name: "Promotion", value: 35 },
    { name: "Affiliate Marketing", value: 25 },
  ],
  Monthly: [
    { name: "Advertising", value: 55 },
    { name: "Promotion", value: 18 },
    { name: "Affiliate Marketing", value: 27 },
  ],
  Yearly: [
    { name: "Advertising", value: 60 },
    { name: "Promotion", value: 25 },
    { name: "Affiliate Marketing", value: 15 },
  ],
};

export default function SalesSourceCard() {
  const [period, setPeriod] = useState<"Weekly" | "Monthly" | "Yearly">(
    "Monthly"
  );

  const data = DATASETS[period];
  const total = useMemo(
    () => data.reduce((s, item) => s + item.value, 0),
    [data]
  );

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow p-4 max-w-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Sale&apos;s source</h3>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as "Weekly" | "Monthly" | "Yearly")}
          className="border rounded px-3 py-1 text-sm"
        >
          <option>Weekly</option>
          <option>Monthly</option>
          <option>Yearly</option>
        </select>
      </div>

      <div className="h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              label={({ percent }) => `${Math.round((percent || 0) * 100)}%`}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(val:number) => `${val}`} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom legend with percent values */}
      <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span>{d.name}</span>
            </div>
            <div className="text-zinc-500">
              {d.value} ({Math.round((d.value / total) * 100)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
