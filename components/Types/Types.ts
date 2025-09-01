// src/types/orders.ts

// API response wrapper
export interface PaginatedResponse<T> {
  result?: T[];
  data?: T[];
  orders?: T[];
  results?: T[];
  payload?: T[];
  total?: number;
  count?: number;
  total_count?: number;
}

// Order Item type
export interface OrderItem {
  id?: number | string;
  productId?: number | string;
  variantId?: number | string;
  name?: string;
  SKU?: string;
  quantity?: number;
  price?: number;
  selling_price?: number;
  variant?: {
    SKU?: string;
    images?: { url?: string; image?: string }[];
    product?: {
      name?: string;
      images?: { image?: string }[];
    };
  };
  product?: {
    name?: string;
    images?: { image?: string }[];
  };
}

// Order type
export interface Order {
  id?: number | string;
  _id?: number | string;
  orderId?: number | string;

  createdAt?: string;
  created_at?: string;
  orderDate?: string;
  date?: string;

  status?: string;
  order_status?: string;

  finalAmount?: number | string;
  totalAmount?: number | string;
  subtotal?: number | string;
  total?: number | string;
  amount?: number | string;

  billingAddress?: string;
  items?: OrderItem[];
}

// Status list type
export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";
