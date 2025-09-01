import { CardId } from "./constants";

export type DashboardData = {
  metrics?: { title: string; value: string | number }[];
  salesChart?: { month: string; sales: number }[];
  recentUsers?: { id: number; name: string; email: string }[];
};

export type CardDescriptor = {
  id: CardId;
  title: string;
  render: (data: DashboardData | null) => React.ReactNode;
};
