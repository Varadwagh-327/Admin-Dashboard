"use client";

import { useState } from "react";

interface Product {
  id: number;
  name: string;
  category: string;
  type: "Product" | "Sales";
  quantity: number;
  revenue: string;
}

const cosmetics: Product[] = [
  { id: 1, name: "Lipstick", category: "Makeup", type: "Product", quantity: 2, revenue: "$40" },
  { id: 2, name: "Foundation", category: "Makeup", type: "Sales", quantity: 1, revenue: "$30" },
  { id: 3, name: "Perfume", category: "Fragrance", type: "Product", quantity: 3, revenue: "$90" },
  { id: 4, name: "Face Cream", category: "Skincare", type: "Sales", quantity: 1, revenue: "$25" },
  { id: 5, name: "Shampoo", category: "Haircare", type: "Product", quantity: 2, revenue: "$50" },
];

export default function Transactions() {
  const [filter, setFilter] = useState<"All" | "Product" | "Sales">("All");

  const filteredProducts = cosmetics
    .filter((p) => {
      if (filter === "All") return true;
      return p.type === filter;
    })
    .sort((a, b) => a.quantity - b.quantity); // Sort by least selling first

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 h-96 flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Least Selling Cosmetic Products</h2>

      {/* Tabs */}
      <div className="flex space-x-6 border-b pb-2 mb-4">
        {["All", "Product", "Sales"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab as "All" | "Product" | "Sales")}
            className={`pb-2 border-b-2 transition font-medium ${
              filter === tab
                ? "border-pink-500 text-pink-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Product List with Scrollbar */}
      <div className="space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-pink-400 scrollbar-track-gray-100 flex-1">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="flex justify-between items-center border-b pb-3 last:border-none"
          >
            {/* Product Info */}
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-gray-500">{p.category}</p>
            </div>

            {/* Quantity + Revenue */}
            <div className="text-right">
              <p className="text-sm text-gray-500">Qty: {p.quantity}</p>
              <p className="font-semibold text-pink-600">{p.revenue}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
