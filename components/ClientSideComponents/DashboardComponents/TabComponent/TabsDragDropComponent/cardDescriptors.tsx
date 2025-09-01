"use client";

import React from "react";
import { CardDescriptor, DashboardData } from "../SeverSide/types";
import { CardId } from "../SeverSide/constants";

// Import your existing cards
import SalesChart from "@/components/ClientSideComponents/DashboardComponents/SalesCharts";
import SalesSourceCard from "@/components/ClientSideComponents/DashboardComponents/SalesSource";
import Transactions from "@/components/ClientSideComponents/DashboardComponents/Transactions";
import RecentUsersTable from "@/components/ClientSideComponents/DashboardComponents/RecentUsers";

export function makeCardDescriptors(data: DashboardData | null): Record<CardId, CardDescriptor> {
  return {
    "card-sales": {
      id: "card-sales",
      title: "Sales Chart",
      render: (data) => <SalesChart salesData={data?.salesChart || []} />,
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
      render: (data) => <RecentUsersTable users={data?.recentUsers || []} />,
    },
  };
}
