"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";

/* -----------------------
   Types
   ----------------------- */
type CustomerShort = { id: number; name: string; email?: string; profile_picture?: string | null; total_orders?: number; total_spent?: number; };
type ProductShort = { id: number; name: string; image?: string | null; sellingPrice?: string | number; stock?: number; total_quantity_sold?: number; revenue_generated?: number; };
type OrderShort = { id: number; total_amount: number; status: string; created_at: string; customer_name?: string; item_count?: number; };

type PaymentTx = {
  id: number;
  method?: string;
  status?: string;
  transactionId?: string | null;
  amount?: number;
  paidAt?: string | null;
  createdAt?: string;
  user_id?: number;
  customer_name?: string;
  customer_email?: string;
};

type RawDashboard = {
  message?: string;
  products_sold?: number;
  new_customer_count?: number;
  average_order_value?: number;
  user_summary?: Record<string, number>;
  product_summary?: Record<string, number>;
  order_summary?: Record<string, number>;
  revenue_summary?: Record<string, number>;
  order_sale_graph?: { date: string | number; total: number }[]; // date may be various formats
  order_payment_summary?: Record<string, number>; // <-- important: we read this
  top_customers?: { by_spending?: CustomerShort[]; by_orders?: CustomerShort[] };
  recent_orders?: OrderShort[];
  top_selling_products?: ProductShort[];
  recent_payment_transactions?: PaymentTx[]; // <- added
};

/* -----------------------
   Props + config
   ----------------------- */
interface Props {
  startDate?: string;
  endDate?: string;
  userId?: number;
  apiUrl?: string;
}
const PREFERRED_SCHEME: "Token" | "Bearer" = "Token";

/* -----------------------
   Helpers
   ----------------------- */
function sanitizeToken(raw: string | null) {
  if (!raw) return null;
  return raw.replace(/^"(.*)"$/, "$1").trim();
}
function hasScheme(t: string) {
  return /^Bearer\s+/i.test(t) || /^Token\s+/i.test(t);
}
function buildHeaderFromRaw(raw: string, preferred: "Token" | "Bearer") {
  if (!raw) return null;
  if (hasScheme(raw)) return raw;
  return `${preferred} ${raw}`;
}

/* -----------------------
   Main component
   ----------------------- */
export default function AdminDashboard({
  startDate = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  endDate = new Date().toISOString().slice(0, 10),
  userId = 2,
  apiUrl = "https://beglam.superbstore.in/user/dashboard",
}: Props) {

  
  const { token } = useAuth(false);
  const [authHeader, setAuthHeader] = useState<string | null>(null);

  const [data, setData] = useState<RawDashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // date states
  const [start, setStart] = useState<string>(startDate);
  const [end, setEnd] = useState<string>(endDate);
  const [qStart, setQStart] = useState<string>(startDate);
  const [qEnd, setQEnd] = useState<string>(endDate);
  const [dateError, setDateError] = useState<string | null>(null);
  

  // build auth header when token changes (supports tokens that already include scheme)
  useEffect(() => {
    const local = sanitizeToken(typeof token === "string" ? token : (localStorage.getItem("token") ?? null));
    const header = local ? buildHeaderFromRaw(local, PREFERRED_SCHEME) : null;
    setAuthHeader(header);
  }, [token]);

  // fetch dashboard when header or applied date range changes
  useEffect(() => {
    if (!authHeader) {
      // try to fetch anyways without auth (some deployments allow it) — but show a helpful message
      setError("Auth token not found — put token in useAuth or localStorage('token').");
      setLoading(false);
      return;
    }

    let mounted = true;
    const ac = new AbortController();

    async function fetchDashboard() {
      setLoading(true);
      setError(null);
      try {
        const body = { start_date: qStart, end_date: qEnd, user_id: userId };

        const res = await fetch(apiUrl, {
          method: "POST",
          signal: ac.signal,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify(body),
          cache: "no-store",
        });

        if (!res.ok) {
          // try to give helpful debugging info
          const txt = await res.text().catch(() => "");
          throw new Error(`API ${res.status} ${res.statusText} — ${txt || "(no body)"}`);
        }

        const json = await res.json().catch(() => null);
        if (!mounted) return;

        // flexible parsing:
        // backend might return top-level keys OR { data: { ... } } OR { success: true, result: { ... } }
        const payload = (json && typeof json === "object" && ("data" in json)) ? (json as Record<string, unknown>).data :
                        (json && typeof json === "object" && ("result" in json)) ? (json as Record<string, unknown>).result :
                        json;

        if (!payload || typeof payload !== "object") {
          throw new Error("Unexpected API payload shape.");
        }

        // set the payload directly (it matches the shape you posted)
        setData(payload as RawDashboard);
        setError(null);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Dashboard fetch error:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch dashboard");
          setData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchDashboard();
    return () => {
      mounted = false;
      ac.abort();
    };
  }, [authHeader, qStart, qEnd, userId, apiUrl]);

  /* -----------------------
     UI helpers
  ----------------------- */
  function handleApply() {
    if (!start || !end) {
      setDateError("Select both start and end dates.");
      return;
    }
    if (new Date(start) > new Date(end)) {
      setDateError("Start date cannot be after end date.");
      return;
    }
    setDateError(null);
    setQStart(start);
    setQEnd(end);
  }

  function toISO(d: Date) {
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function applyPreset(days: number) {
    const now = new Date();
    const endISO = toISO(now);
    const from = new Date(now);
    from.setDate(from.getDate() - (days - 1));
    const startISO = toISO(from);
    setStart(startISO);
    setEnd(endISO);
    setQStart(startISO);
    setQEnd(endISO);
  }

  function applyThisMonth() {
    const now = new Date();
    const endISO = toISO(now);
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const startISO = toISO(from);
    setStart(startISO);
    setEnd(endISO);
    setQStart(startISO);
    setQEnd(endISO);
  }

  /* -----------------------
     Chart data: robust parsing + fallbacks (does NOT mutate original data)
     - builds numeric timestamps for plotting (ts)
     - builds friendly short labels for ticks (dateLabel)
     - sorts points by ts
  ----------------------- */
  const chartData = useMemo(() => {
    const raw = data?.order_sale_graph;
    if (!raw || !Array.isArray(raw) || raw.length === 0) return [];

    const out: { ts: number; dateLabel: string; total: number; original: string | number }[] = [];
    let lastValidTs: number | null = null;

    for (let i = 0; i < raw.length; i++) {
       const entry = raw[i] as { date: string | number; total: number };
      const rawDate = entry?.date;
      let ts: number | null = null;

      // try many formats safely
      try {
        if (rawDate == null || rawDate === "") {
          ts = null;
        } else if (typeof rawDate === "number") {
          ts = rawDate;
          // if likely seconds, convert to ms
          if (ts > 0 && ts < 1e11) ts = ts * 1000;
        } else if (typeof rawDate === "string") {
          const s = rawDate.trim();

          // YYYY-MM-DD -> treat as UTC date start
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            ts = Date.parse(s + "T00:00:00.000Z");
          }
          // pure digits -> timestamp
          else if (/^\d{10,13}$/.test(s)) {
            const num = Number(s);
            ts = num < 1e11 ? num * 1000 : num;
          }
          // ISO-ish with time or other textual date -> try Date.parse
          else {
            const parsed = Date.parse(s);
            ts = Number.isFinite(parsed) ? parsed : null;
          }
        }
      } catch {
        ts = null;
      }

      // fallback: if parse failed, increment from last valid day OR build a stable synthetic timeline
      if (!Number.isFinite(ts) || ts === null) {
        if (lastValidTs != null) {
          ts = lastValidTs + 24 * 3600 * 1000; // next day
        } else {
          // nothing valid yet — create a stable base so labels still make sense:
          // set base as `now - (n - i -1) days` so ordering matches original array
          const base = Date.now();
          ts = base - (raw.length - i - 1) * 24 * 3600 * 1000;
        }
      }

      lastValidTs = ts;

      // friendly short label (using user's locale), e.g. "Aug 29"
      const dateLabel = new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });

      out.push({
        ts,
        dateLabel,
        total: Number(entry?.total ?? 0) || 0,
        original: rawDate,
      });
    }

    // sort ascending by timestamp so line looks correct
    out.sort((a, b) => a.ts - b.ts);

    // Map to a shape Recharts will use: keep ts (number) and total (number) and dateLabel (string)
    return out.map((r) => ({ ts: r.ts, dateLabel: r.dateLabel, total: r.total }));
  }, [data]);

  /* -----------------------
     Payment summary derivation (read-only)
     expected API keys:
       - total_payment_estimate
       - online_payment_amount
       - cash_on_delivery_payment_amount
       - payment_not_done_amount
     NOTE: we do NOT mutate original numbers; we only compute read-only derived values for display.
  ----------------------- */
  const paymentSummary = useMemo(() => {
    const s = data?.order_payment_summary;
    if (!s) return null;

    const total = Number(s.total_payment_estimate ?? s.total ?? 0) || 0;
    const online = Number(s.online_payment_amount ?? 0) || 0;
    const cod = Number(s.cash_on_delivery_payment_amount ?? 0) || 0;
    const notDone = Number(s.payment_not_done_amount ?? 0) || 0;

    // compute any leftover other (non-negative)
    const others = Math.max(0, total - (online + cod + notDone));

    // IMPORTANT: include all slices even if value is 0 (user requested this)
    const slices = [
      { key: "online_payment_amount", name: "Online Payment", value: online, color: "#22c55e" },         // green
      { key: "cash_on_delivery_payment_amount", name: "COD Payment", value: cod, color: "#f59e0b" },     // orange
      { key: "payment_not_done_amount", name: "Payment Not Done", value: notDone, color: "#6b7280" },    // gray
      { key: "other", name: "Other", value: others, color: "#4f46e5" },                                  // indigo
    ];

    return { raw: s, total, slices };
  }, [data]);

  /* -----------------------
     presentation helpers
  ----------------------- */
  function formatMoney(n?: number) {
    if (n == null || Number.isNaN(n)) return "--";
    try {
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
    } catch {
      return Number(n).toFixed(2);
    }
  }

  function formatNumber(n?: number) {
    if (n == null || Number.isNaN(n)) return "--";
    try {
      return new Intl.NumberFormat("en-IN").format(n);
    } catch {
      return String(n);
    }
  }

  function paymentStatusColor(status?: string) {
    switch ((status || "").toUpperCase()) {
      case "PENDING": return "text-yellow-600";
      case "SUCCESS": return "text-green-600";
      case "FAILED": return "text-red-600";
      default: return "text-gray-600";
    }
  }

  function statusColor(status: string | undefined) {
    switch ((status || "").toUpperCase()) {
      case "DELIVERED": return "text-green-600";
      case "CANCELLED": return "text-red-600";
      case "CONFIRMED": return "text-blue-600";
      default: return "text-gray-600";
    }
  }

  /* -----------------------
     constants: shared visual height so both cards match
  ----------------------- */
  const CARD_HEIGHT = 260; // px — both chart container & payment card use this to keep heights matched

  /* -----------------------
     Render
  ----------------------- */
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Date range toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500">Start date</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full border rounded px-2 py-2" />
          </div>
          <div>
            <label className="text-xs text-gray-500">End date</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full border rounded px-2 py-2" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleApply} className="h-10 px-4 rounded bg-indigo-600 text-white">Apply</button>
            <button onClick={() => { setStart(startDate); setEnd(endDate); setQStart(startDate); setQEnd(endDate); setDateError(null); }} className="h-10 px-3 rounded border">Reset</button>
          </div>
          <div className="lg:col-span-2 flex flex-wrap gap-2">
            <button onClick={() => applyPreset(7)} className="h-10 px-3 rounded border">Last 7 days</button>
            <button onClick={() => applyPreset(30)} className="h-10 px-3 rounded border">Last 30 days</button>
            <button onClick={applyThisMonth} className="h-10 px-3 rounded border">This month</button>
          </div>
        </div>
        {dateError && <div className="text-sm text-red-600 mt-2">{dateError}</div>}
        <div className="text-xs text-gray-500 mt-1">Applied range: {qStart} → {qEnd}</div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Products sold" value={data?.products_sold} />
        <StatCard title="New customers" value={data?.new_customer_count} />
        <StatCard title="Avg. order value" value={data?.average_order_value} formatter={(v) => (v == null ? "--" : `${v}`)} />
        <StatCard title="Total revenue" value={data?.revenue_summary?.total_revenue} formatter={formatMoney} />
      </div>

      {/* Chart + Payment card (responsive; equal heights) */}
      <div className="grid grid-cols-10 gap-4">
        {/* Left: Order / Sales chart */}
        <div className="col-span-10 lg:col-span-7 bg-white p-4 rounded shadow" style={{ minHeight: CARD_HEIGHT }}>
          <h3 className="text-lg font-medium mb-2">Order / Sales (by date)</h3>
          {chartData.length ? (
            <div style={{ width: "100%", height: CARD_HEIGHT - 48 /* leave space for header */ }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid stroke="#e6e6e6" strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="ts"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(v: number) =>
                      new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                    }
                    tick={{ fontSize: 12 }}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatNumber(v)}
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    labelFormatter={(label: number) => {
                      try {
                        return new Date(label).toLocaleString();
                      } catch {
                        return String(label);
                      }
                    }}
                    formatter={(value: any) => [formatMoney(Number(value)), "Total"]}
                    wrapperStyle={{ outline: "none" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    animationDuration={700}
                    isAnimationActive
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No graph data available for the chosen date range.</div>
          )}
        </div>

        {/* Right column: PaymentSummaryCard */}
        <div className="col-span-10 lg:col-span-3">
          <div className="bg-white p-4 rounded shadow h-full" style={{ minHeight: CARD_HEIGHT, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <PaymentSummaryCard summary={paymentSummary} formatMoney={formatMoney} />
          </div>
        </div>
      </div>

      {/* Top selling products + recent orders + recent payment transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="space-y-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent orders card (unchanged) */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-3">Recent orders</h3>
            <div className="space-y-2">
              {data?.recent_orders && data.recent_orders.length > 0 ? data.recent_orders.slice(0, 6).map((o) => (
                <div key={o.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">#{o.id} — {o.customer_name ?? "—"}</div>
                    <div className="text-xs text-gray-500">
                      {(() => {
                        try {
                          return new Date(o.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        } catch {
                          return o.created_at;
                        }
                      })()} • {o.item_count ?? 0} items
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatMoney(o.total_amount)}</div>
                    <div className={`text-xs mt-1 ${statusColor(o.status)}`}>{o.status}</div>
                  </div>
                </div>
              )) : <div className="text-sm text-gray-500">No recent orders.</div>}
            </div>
          </div>

          {/* NEW: Recent payment transactions card */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-3">Recent payment transactions</h3>
            <div className="space-y-2">
              {data?.recent_payment_transactions && data.recent_payment_transactions.length > 0 ? data.recent_payment_transactions.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">#{t.id} — {t.customer_name ?? t.customer_email ?? "—"}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {t.method ?? "—"} • {(() => {
                        try {
                          return t.createdAt ? new Date(t.createdAt).toLocaleString() : "—";
                        } catch { return t.createdAt ?? "—"; }
                      })()}
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className="font-semibold">{formatMoney(t.amount ?? 0)}</div>
                    <div className={`text-xs mt-1 ${paymentStatusColor(t.status)}`}>{t.status ?? "—"}</div>
                  </div>
                </div>
              )) : <div className="text-sm text-gray-500">No recent payment transactions.</div>}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-3">Top selling products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data?.top_selling_products && data.top_selling_products.length > 0 ? data.top_selling_products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2 border rounded">
                  <Image
                    src={p.image ?? ""}
                    alt={p.name}
                    height={16}
                    width={16}
                    onError={(e) => ((e.target as HTMLImageElement).src = "https://via.placeholder.com/80")}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm truncate">{p.name}</div>
                    <div className="text-xs text-gray-500">Sold: {p.total_quantity_sold ?? 0} • Stock: {p.stock ?? 0}</div>
                    <div className="text-sm font-semibold mt-1">{p.revenue_generated ? formatMoney(p.revenue_generated) : "--"}</div>
                  </div>
                </div>
              )) : <div className="text-sm text-gray-500">No top selling products found.</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryBox title="Product summary" data={data?.product_summary} formatter={(k, v) => `${k.replaceAll("_", " ")}: ${v}`} />
        <SummaryBox title="Order summary" data={data?.order_summary} formatter={(k, v) => `${k.replaceAll("_", " ")}: ${v}`} />
        <SummaryBox title="User summary" data={data?.user_summary} formatter={(k, v) => `${k.replaceAll("_", " ")}: ${v}`} />
      </div>
    </div>
  );
}

/* -----------------------
   PaymentSummaryCard
   - always shows the four expected categories (even if zero)
   - if total === 0, renders a neutral ring but still lists zero amounts
   - does NOT mutate any API numbers
  ----------------------- */
function PaymentSummaryCard({
  summary,
  formatMoney,
}: {
  summary: { raw: Record<string, number>; total: number; slices: { key: string; name: string; value: number; color: string }[] } | null;
  formatMoney: (n?: number) => string;
}) {
  // container visual: keep it full-height in the parent wrapper
  if (!summary) {
    return (
      <div className="h-full flex flex-col justify-between">
        <div>
          <div className="text-sm text-gray-500">Order Payment Distribution Amount</div>
          <div className="mt-2 text-2xl font-semibold">—</div>
        </div>
        <div className="text-sm text-gray-500">No payment summary available.</div>
      </div>
    );
  }

  const { total, slices } = summary;

  // Build pie data. If total is zero, show neutral slice to render donut ring.
  const pieData = total > 0
    ? slices.map((s) => ({ name: s.name, value: s.value, color: s.color }))
    : [{ name: "No data", value: 1, color: "#e5e7eb" }];

  // Legend data should always show all expected categories with actual amounts (including zeros).
  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="text-lg font-medium mb-3">Order Payment Distribution Amount</div>
        <div className="mt-2 text-2xl font-semibold">{formatMoney(total)}</div>
        <div className="text-xs text-gray-500 mt-1">Total estimated payments</div>
      </div>

      <div className="flex items-center justify-end">
        <div style={{ width: 140, height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={38}
                outerRadius={52}
                paddingAngle={3}
                startAngle={90}
                endAngle={-270}
                isAnimationActive
              >
                {pieData.map((entry, idx) => (
                  <Cell key={`c-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => (total > 0 ? formatMoney(Number(value)) : "")} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {/* show each expected slice — always show, even if value is 0 */}
        {slices.map((s) => (
          <div key={s.key} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span style={{ background: s.color }} className="inline-block w-3 h-3 rounded" />
              <div className="truncate">{s.name}</div>
            </div>
            <div className="font-medium">{formatMoney(s.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -----------------------
   small presentational components
  ----------------------- */
function StatCard({ title, value, formatter }: { title: string; value?: number; formatter?: (v?: number) => string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col justify-between">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{formatter ? formatter(value) : value != null ? value : "--"}</div>
    </div>
  );
}

function SummaryBox({ title, data, formatter }: { title: string; data?: Record<string, number> | undefined; formatter?: (k: string, v: number) => string }) {
  if (!data) return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="text-sm text-gray-500">No {title.toLowerCase()} found</div>
    </div>
  );
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h4 className="font-medium mb-2">{title}</h4>
      <div className="space-y-1 text-sm text-gray-700">
        {Object.entries(data).map(([k, v]) => <div key={k}>{formatter ? formatter(k, v) : `${k}: ${v}`}</div>)}
      </div>
    </div>
  );
}

/* -----------------------
   helper
  ----------------------- */
function paymentStatusColor(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "PENDING": return "text-yellow-600";
    case "SUCCESS": return "text-green-600";
    case "FAILED": return "text-red-600";
    default: return "text-gray-600";
  }
}
