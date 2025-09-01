"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface SalesChartProps {
  salesData: { DataKey: string; sales: number }[];
}

export default function SalesChart({ salesData }: SalesChartProps) {
  const [filter, setFilter] = useState<"dayly" |"monthly" | "yearly">("monthly");

  // Transform data based on selected filter
  const filteredData = useMemo(() => {
    if (filter === "dayly") {
      return [
      { DataKey: "Sunday", sales: 4000 }, 
      { DataKey: "Monday", sales: 3000 },
      { DataKey: "Tuesday", sales: 5000 }, 
      { DataKey: "Wednesday", sales: 6000 },
      { DataKey: "Thursday", sales: 4000 }, 
      { DataKey: "Friday", sales: 3000 },
      { DataKey: "Saturday ", sales: 5000 }
      ];
    }
    if (filter === "monthly") {
      return [
      { DataKey: "Jan", sales: 4000 }, 
      { DataKey: "Feb", sales: 3000 },
      { DataKey: "Mar", sales: 5000 }, 
      { DataKey: "Apr", sales: 6000 },
      { DataKey: "May", sales: 4000 }, 
      { DataKey: "Jun", sales: 3000 },
      { DataKey: "Jul", sales: 5000 }, 
      { DataKey: "Aug", sales: 6000 },
      { DataKey: "Sep", sales: 4000 }, 
      { DataKey: "Oct", sales: 3000 },
      { DataKey: "Nov", sales: 5000 }, 
      { DataKey: "Dec", sales: 6000 },
      ];
    }
    if (filter === "yearly") {
      return [
        { DataKey: "2021", sales: 35000 },
        { DataKey: "2022", sales: 42000 },
        { DataKey: "2023", sales: 50000 },
      ];
    }
    return salesData; // default: monthly
  }, [filter, salesData]);

  return (
    <div >
      {/* Dropdown + Bar chart */}
      <div className="flexed bg-white border border-slate-200 rounded-2xl p-4 relative overflow-hidden min-h-[220px]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-semibold">Sales Overview</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "dayly" | "monthly" | "yearly")}
            className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none"
          > 
            <option value="dayly">dayly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div style={{ height: 260 }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="DataKey" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
