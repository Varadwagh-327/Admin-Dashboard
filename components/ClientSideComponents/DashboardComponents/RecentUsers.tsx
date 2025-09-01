"use client";

import { useMemo, useState } from "react";

interface RecentUsersTableProps {
  users: { id: number; name: string; email: string }[];
}

export default function RecentUsersTable({ users }: RecentUsersTableProps) {
  const [filter, setFilter] = useState<"dayly" | "monthly" | "yearly">("monthly");

  // Example filtered dataset
  const filteredData = useMemo(() => {
    if (filter === "dayly") {
      return [
        { id: 1, name: "Sam Doe", email: "sam.doe@consociatesolutions.com" },
        { id: 2, name: "Varad Wagh", email: "varadwagh326@gmail.com" },
        { id: 3, name: "Vinayak Wagh", email: "varad.wagh@consociatesolutions.com" },
        { id: 10, name: "James Taylor", email: "james.taylor@example.com" },
        { id: 11, name: "Olivia Martinez", email: "olivia.martinez@example.com" },
        { id: 12, name: "Liam Anderson", email: "liam.anderson@example.com" },
        { id: 13, name: "Ava Thomas", email: "ava.thomas@example.com" },
        { id: 14, name: "Ethan Hernandez", email: "ethan.hernandez@example.com" },
        { id: 15, name: "Mia Moore", email: "mia.moore@example.com" },
        { id: 16, name: "Noah Martin", email: "noah.martin@example.com" },
        { id: 17, name: "Isabella Lee", email: "isabella.lee@example.com" },
        { id: 18, name: "Lucas Perez", email: "lucas.perez@example.com" },
      ];
    }
    if (filter === "monthly") {
      return [
        { id: 4, name: "John Smith", email: "john.smith@example.com" },
        { id: 5, name: "Jane Johnson", email: "jane.johnson@example.com" },
        { id: 6, name: "Michael Brown", email: "michael.brown@example.com" },
        { id: 7, name: "Emily Davis", email: "emily.davis@example.com" },
        { id: 8, name: "Daniel Wilson", email: "daniel.wilson@example.com" },
      ];
    }
    if (filter === "yearly") {
      return [
        { id: 4, name: "Alice Smith", email: "alice@example.com" },
        { id: 5, name: "Bob Johnson", email: "bob@example.com" },
      ];
    }
    // default: monthly → just show original users
    return users;
  }, [filter, users]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 mt-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Recent Users</h3>

        {/* Filter buttons */}
        <div className="space-x-2">
          <button
            className={`px-3 py-1 rounded ${
              filter === "dayly" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
            onClick={() => setFilter("dayly")}
          >
            Daily
          </button>
          <button
            className={`px-3 py-1 rounded ${
              filter === "monthly" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
            onClick={() => setFilter("monthly")}
          >
            Monthly
          </button>
          <button
            className={`px-3 py-1 rounded ${
              filter === "yearly" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
            onClick={() => setFilter("yearly")}
          >
            Yearly
          </button>
        </div>
      </div>

      <table className="min-w-[600px] w-full table-auto">
        <thead>
          <tr className="text-left text-sm text-slate-500">
            <th className="p-2">ID</th>
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((u) => (
            <tr key={u.id}>
              <td className="p-2">{u.id}</td>
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
