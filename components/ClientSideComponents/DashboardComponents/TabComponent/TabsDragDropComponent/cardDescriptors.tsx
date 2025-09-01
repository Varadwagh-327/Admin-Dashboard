"use client";

import React from "react";
import { CardDescriptor, DashboardData } from "../SeverSide/types";
import { CardId } from "../SeverSide/constants";

// Import your existing cards
import SalesChart from "@/components/ClientSideComponents/DashboardComponents/SalesCharts";
import SalesSourceCard from "@/components/ClientSideComponents/DashboardComponents/SalesSource";
import Transactions from "@/components/ClientSideComponents/DashboardComponents/Transactions";
import RecentUsersTable from "@/components/ClientSideComponents/DashboardComponents/RecentUsers";

/**
 * Normalizer for sales data.
 * - Accepts incoming items that may look like { month: string, sales: number }
 *   or { DataKey: string, sales: number } or other small variants.
 * - Returns an array of { DataKey: string, sales: number } which SalesChart expects.
 *
 * This does NOT mutate the original data; it only creates a normalized view for the chart.
 */
type RawSalesItem = {
  DataKey?: string;
  month?: string | number;
  label?: string | number;
  sales?: number | string;
  [k: string]: any;
};

function normalizeSalesArray(sales?: RawSalesItem[] | null) {
  if (!Array.isArray(sales)) return [];
  return sales.map((it) => {
    // choose DataKey if present, otherwise month, otherwise label, otherwise string of index-like value
    const DataKey =
      typeof it.DataKey === "string"
        ? it.DataKey
        : typeof it.month === "string" || typeof it.month === "number"
        ? String(it.month)
        : typeof it.label === "string" || typeof it.label === "number"
        ? String(it.label)
        : "";

    // ensure sales is a number
    const salesNum = Number(it.sales ?? 0) || 0;

    return { DataKey, sales: salesNum };
  });
}

export function makeCardDescriptors(
  dashboardData: DashboardData | null
): Record<CardId, CardDescriptor> {
  return {
    "card-sales": {
      id: "card-sales",
      title: "Sales Chart",
      render: (data) => {
        // prefer data coming from the render call (card runtime) if provided,
        // otherwise fall back to the top-level dashboardData passed in.
        const raw =
          (data && (data as any).salesChart) ??
          (dashboardData && (dashboardData as any).salesChart) ??
          null;

        const normalized = normalizeSalesArray(raw);

        // SalesChart expects { DataKey: string; sales: number }[]
        return <SalesChart salesData={normalized} />;
      },
    },
    "card-sales-source": {
      id: "card-sales-source",
      title: "Sales Source",
      render: () => <SalesSourceCard />,
    },
    "card-transactions": {
      id: "card-transactions",
      title: "Recent Payment Transactions",
      render: () => <Transactions />,
    },
    "card-recent-users": {
      id: "card-recent-users",
      title: "Recent Users",
      render: (data) => (
        <RecentUsersTable users={(data && (data as any).recentUsers) || (dashboardData && dashboardData.recentUsers) || []} />
      ),
    },
  };
}
