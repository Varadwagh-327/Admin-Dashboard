export const AUTO_SAVE = true; // toggle this to false while developing

export type CardId = "card-sales" | "card-sales-source" | "card-transactions" | "card-recent-users";

export const DEFAULT_ORDER: CardId[] = [
  "card-sales",
  "card-sales-source",
  "card-transactions",
  "card-recent-users",
];

export const LOCAL_ORDER_KEY = "dashboard-cards-order";
export const LOCAL_VISIBLE_KEY = "dashboard-cards-visible";
