"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  CalendarRange,
  RefreshCw,
  Download,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

/* ---------------- Types ---------------- */
type DateString = `${number}-${number}-${number}`;

type OrderItem = {
  id?: number | string;
  productId?: number | string;
  variantId?: number | string;
  name?: string;
  SKU?: string;
  quantity?: number;
  qty?: number;
  price?: number | string;
  selling_price?: number | string;
  variant?: {
    SKU?: string;
    images?: Array<{ url?: string; image?: string }>;
    product?: { name?: string; images?: Array<{ image?: string }> };
  };
  product?: { name?: string; images?: Array<{ image?: string }> };
  [k: string]: unknown;
};

type Order = {
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

  [k: string]: unknown;
};

type PaginatedResponse<T> = {
  result?: T[];
  data?: T[];
  orders?: T[];
  results?: T[];
  payload?: T[];
  total?: number;
  count?: number;
  total_count?: number;
  [k: string]: unknown;
};

/* ---------- Small helpers ---------- */
function toISODateOnly(d: Date): DateString {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}` as DateString;
}
function defaultEnd(): DateString {
  return toISODateOnly(new Date());
}
function defaultStart(daysBack = 30): DateString {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return toISODateOnly(d);
}
function buildAuthHeader(token?: string | null) {
  if (!token) return undefined;
  if (/^(Bearer|Token)\s+/i.test(token)) return token;
  return `Token ${token}`;
}

/* safe CSV helper (keeps your implementation) */
type AnyObj = Record<string, unknown>;
function downloadCSV(rows: AnyObj[], filename = "orders.csv") {
  if (!rows?.length) return;
  const allKeys = Array.from(
    rows.reduce<Set<string>>((acc, r) => {
      Object.keys(r || {}).forEach((k) => acc.add(k));
      return acc;
    }, new Set())
  );
  const header = allKeys.join(",");
  const body = rows
    .map((r) =>
      allKeys
        .map((k) => {
          const v = r?.[k];
          const cell =
            v == null
              ? ""
              : typeof v === "object"
              ? JSON.stringify(v).replace(/"/g, '""')
              : String(v).replace(/"/g, '""');
          return `"${cell}"`;
        })
        .join(",")
    )
    .join("\n");
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Field helpers ---------- */
function getOrderId(o: Order | AnyObj): string {
  return String((o as any).id ?? (o as any)._id ?? (o as any).orderId ?? "—");
}
function parseNumberLike(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const num = parseFloat(v.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}
function getOrderAmount(o: Order | AnyObj): number {
  const amt =
    (o as any).finalAmount ??
    (o as any).totalAmount ??
    (o as any).subtotal ??
    (o as any).total ??
    (o as any).amount;
  return parseNumberLike(amt);
}
function getItemsCount(o: Order | AnyObj): number {
  const arr = (o as any).items ?? (o as any).orderItems ?? (o as any).products ?? [];
  return Array.isArray(arr) ? arr.length : 0;
}
function safeOrderDate(o: Order | AnyObj): DateString {
  const raw =
    (o as any).createdAt ??
    (o as any).created_at ??
    (o as any).orderDate ??
    (o as any).date ??
    "";
  const d = raw ? new Date(String(raw)) : new Date();
  if (Number.isNaN(d.getTime())) return toISODateOnly(new Date());
  return toISODateOnly(d);
}

/* ---------- Status mapping ---------- */
const STATUS_LIST = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];
function statusSolidClass(statusRaw?: string) {
  const s = (statusRaw ?? "").toString().toUpperCase();
  if (s.includes("CANCEL")) return "bg-[#8c2d2d] text-white";
  if (s.includes("SHIP")) return "bg-[#2b7a99] text-white";
  if (s.includes("DELIVER")) return "bg-[#f59e0b] text-white";
  if (s.includes("PEND")) return "bg-[#f97316] text-white";
  if (s.includes("PROCESS")) return "bg-[#06b6d4] text-white";
  if (s.includes("RETURN")) return "bg-[#6b7280] text-white";
  return "bg-gray-600 text-white";
}

/* ---------- Robust response parsing helpers ---------- */
async function safeParseResponseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch (err) {
      // fallthrough
    }
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractArrayFromAny(json: unknown): unknown[] {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (typeof json === "object" && json !== null) {
    const j = json as any;
    if (Array.isArray(j.result)) return j.result;
    if (Array.isArray(j.data)) return j.data;
    if (Array.isArray(j.orders)) return j.orders;
    if (Array.isArray(j.results)) return j.results;
    if (Array.isArray(j.payload)) return j.payload;
    if (j.data && typeof j.data === "object") {
      if (Array.isArray(j.data.results)) return j.data.results;
      if (Array.isArray(j.data.orders)) return j.data.orders;
    }
  }
  return [];
}

/* ---------- New helper: unify status getter ---------- */
function getOrderStatus(o: Order | AnyObj): string {
  return ((o as any).status ?? (o as any).order_status ?? "—").toString().toUpperCase();
}

/* ---------- Component ---------- */
export default function OrdersPage(): React.ReactElement {
  const API = "https://beglam.superbstore.in/order/user-order";

  const [tokenFromStorage, setTokenFromStorage] = useState<string | null>(null);
  useEffect(() => {
    try {
      setTokenFromStorage(localStorage.getItem("token"));
    } catch {
      setTokenFromStorage(null);
    }
  }, []);

  const [startDate, setStartDate] = useState<DateString>(defaultStart(30));
  const [endDate, setEndDate] = useState<DateString>(defaultEnd());

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);

  const [updatingStatusIds, setUpdatingStatusIds] = useState<(number | string)[]>([]);

  /* ---------- new: status filter ---------- */
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // "ALL" or one of STATUS_LIST

  /* ---------- fetcher with robust parsing + GET fallback ---------- */
  async function fetchOrders(pageArg = page, pageSizeArg = pageSize) {
    setLoading(true);
    setError(null);

    const token = tokenFromStorage;
    if (!token) {
      setLoading(false);
      setError("Missing token. Put your token in localStorage('token') or provide via useAuth.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setLoading(false);
      setError("Start date cannot be after End date.");
      return;
    }

    const authHeader = buildAuthHeader(token);
    const body = {
      start_date: startDate,
      end_date: endDate,
      page: pageArg,
      page_size: pageSizeArg,
    };

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      if (!res.ok) {
        const fallbackUrl = `${API}?start_date=${startDate}&end_date=${endDate}&page=${pageArg}&page_size=${pageSizeArg}`;
        const getRes = await fetch(fallbackUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          cache: "no-store",
        });

        if (!getRes.ok) {
          const postText = await res.text().catch(() => "(no body)");
          const getText = await getRes.text().catch(() => "(no body)");
          throw new Error(
            `POST ${res.status} response: ${postText.slice(0, 400)} — GET ${getRes.status} response: ${getText.slice(
              0,
              400
            )}`
          );
        }

        const parsed = await safeParseResponseBody(getRes);
        handleApiJson(parsed, pageArg, pageSizeArg);
        setLoading(false);
        return;
      }

      const parsed = await safeParseResponseBody(res);
      handleApiJson(parsed, pageArg, pageSizeArg);
    } catch (err: unknown) {
      console.error("fetchOrders error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  /* ---------- handle API shapes ---------- */
  function handleApiJson(json: unknown, pageArg: number, pageSizeArg: number) {
    if (!json) {
      setError("Empty response from API.");
      return;
    }

    const arr = extractArrayFromAny(json);

    if (!Array.isArray(arr) || arr.length === 0) {
      const asObj = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
      const maybeTotal = asObj?.total ?? asObj?.count ?? asObj?.total_count;
      if (maybeTotal && typeof maybeTotal === "number") setTotal(maybeTotal);
      setOrders([]);
      setError(arr.length === 0 ? "No orders returned for the selected range." : null);
      setPage(pageArg);
      setPageSize(pageSizeArg);
      return;
    }

    setOrders(arr as Order[]);

    const asObj = json && typeof json === "object" ? (json as any) : {};
    if (typeof asObj.total === "number") setTotal(asObj.total);
    else if (typeof asObj.count === "number") setTotal(asObj.count);
    else if (typeof asObj.total_count === "number") setTotal(asObj.total_count);
    else setTotal(undefined);

    setPage(pageArg);
    setPageSize(pageSizeArg);
    setError(null);
  }

  /* ---------- Auto fetches ---------- */
  useEffect(() => {
    if (!tokenFromStorage) return;
    fetchOrders(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromStorage]);

  useEffect(() => {
    if (!tokenFromStorage) return;
    fetchOrders(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, startDate, endDate]);

  /* ---------- Totals for UI (now reflect visible / filtered list) ---------- */
  const filteredOrders = useMemo(() => {
    if (!statusFilter || statusFilter === "ALL") return orders;
    return orders.filter((o) => {
      return getOrderStatus(o) === statusFilter;
    });
  }, [orders, statusFilter]);

  const totalsForPage = useMemo(() => {
    const count = filteredOrders.length;
    const amount = filteredOrders.reduce((acc, o) => acc + getOrderAmount(o), 0);
    return { count, amount };
  }, [filteredOrders]);

  /* ---------- export helpers (unchanged): these operate on raw orders (page) ---------- */
  function exportPageCSV() {
    downloadCSV(orders as AnyObj[], `orders_page_${page}_${startDate}_to_${endDate}.csv`);
  }

  /* ---------- grouping (use filteredOrders now) ---------- */
  const grouped = useMemo(() => {
    const map: Record<string, Order[]> = {};
    for (const o of filteredOrders) {
      const key = safeOrderDate(o);
      (map[key] ||= []).push(o);
    }
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => {
        const ta = new Date((a.createdAt ?? a.created_at ?? a.orderDate ?? a.date) as string).getTime() || 0;
        const tb = new Date((b.createdAt ?? b.created_at ?? b.orderDate ?? b.date) as string).getTime() || 0;
        return tb - ta;
      });
    });
    return map;
  }, [filteredOrders]);

  const groupedKeysDesc = useMemo(
    () => Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
    [grouped]
  );

  /* ---------- update order status (optimistic) (unchanged) ---------- */
  async function updateOrderStatus(orderId: number | string, newStatus: string) {
    const prevOrder = orders.find((o) => String(getOrderId(o)) === String(orderId));
    const prevStatus = prevOrder ? (prevOrder.status ?? prevOrder.order_status ?? null) : null;

    setOrders((prev) =>
      prev.map((o) =>
        String(getOrderId(o)) === String(orderId) ? { ...o, status: newStatus, order_status: newStatus } : o
      )
    );
    setUpdatingStatusIds((ids) => [...ids, orderId]);

    const authHeader = buildAuthHeader(tokenFromStorage);

    try {
      const tryUrls = [`${API}/${orderId}`, `${API}/update-status`, `${API}/status/${orderId}`];
      let ok = false;
      for (const url of tryUrls) {
        try {
          const r = await fetch(url, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({ status: newStatus }),
          });
          if (r.ok) {
            ok = true;
            break;
          }
        } catch {
          // ignore and try next url
        }
      }

      if (!ok) {
        try {
          const r2 = await fetch(`${API}/${orderId}/status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({ status: newStatus }),
          });
          ok = r2.ok;
        } catch {
          ok = false;
        }
      }

      if (!ok) {
        throw new Error("Server did not accept the update. Reverting UI.");
      }
    } catch (err: unknown) {
      setOrders((prev) =>
        prev.map((o) =>
          String(getOrderId(o)) === String(orderId)
            ? { ...o, status: prevStatus ?? "—", order_status: prevStatus ?? "—" }
            : o
        )
      );
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUpdatingStatusIds((ids) => ids.filter((id) => String(id) !== String(orderId)));
    }
  }

  /* ---------- status counts used for dropdown badges ---------- */
  const statusCounts = useMemo(() => {
    const map: Record<string, number> = { ALL: orders.length };
    for (const s of STATUS_LIST) map[s] = 0;
    for (const o of orders) {
      const st = getOrderStatus(o);
      if (!map[st]) map[st] = 0;
      map[st] += 1;
    }
    return map;
  }, [orders]);

  /* ---------- Render ---------- */
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fetchOrders(1, pageSize)}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 transition"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <button
            onClick={() => exportPageCSV()}
            disabled={orders.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
            title="Export current page as CSV"
          >
            <Download className="h-4 w-4" />
            Export Page
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-gray-700">
          <CalendarRange className="h-4 w-4" />
          <span className="text-sm font-medium">Date Range</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-4 items-end">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value as DateString);
                setPage(1);
              }}
              className="rounded-lg border px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">End date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value as DateString);
                setPage(1);
              }}
              className="rounded-lg border px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-blue-500"
            />
          </label>

          {/* ---------- NEW: Status filter placed near the date inputs ---------- */}
          <div className="flex items-end">
            <StatusFilterDropdown
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              counts={statusCounts}
            />
          </div>

          {/* show small totals for visible/filtered list */}
          <div className="text-sm text-gray-600 self-end">
            <div>
              Showing <strong>{totalsForPage.count}</strong> orders — ₹{totalsForPage.amount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Status / errors */}
      {loading && <div className="rounded-2xl border p-6 text-sm shadow-sm">Loading orders…</div>}

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <div>
            <div className="font-medium">Couldn’t fetch orders</div>
            <div className="whitespace-pre-wrap">{error}</div>
            <ul className="mt-2 list-disc pl-5">
              <li>Ensure token exists in <code>localStorage("token")</code>.</li>
              <li>Server may expect <code>Token &lt;jwt&gt;</code> or <code>Bearer &lt;jwt&gt;</code>.</li>
              <li>Open browser DevTools → Network → inspect the response body & content-type for the failing request.</li>
            </ul>
          </div>
        </div>
      )}

      {/* No results (considering the filter) */}
      {!loading && !error && filteredOrders.length === 0 && (
        <div className="rounded-2xl border p-6 text-sm shadow-sm">No orders found for the selected range / status.</div>
      )}

      {/* Results */}
      {filteredOrders.length > 0 && (
        <div className="flex flex-col gap-5">
          {groupedKeysDesc.map((dateKey) => {
            const dayOrders = grouped[dateKey] || [];
            return (
              <div key={dateKey} className="rounded-2xl border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between gap-4 border-b p-4 bg-gray-50">
                  <div className="font-medium text-gray-800">
                    {dateKey} <span className="text-xs text-gray-500">({dayOrders.length})</span>
                  </div>
                </div>

                <div className="p-4 overflow-x-auto">
                  <table className="min-w-[720px] w-full text-sm">
                    <thead className="text-left text-xs text-gray-600 uppercase">
                      <tr>
                        <th className="py-2 pr-4">Order ID</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">Amount</th>
                        <th className="py-2 pr-4">Items</th>
                        <th className="py-2 pr-4">Billing</th>
                        <th className="py-2 pr-4">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayOrders.map((o, idx) => (
                        <tr key={`${getOrderId(o)}-${idx}`} className="border-b last:border-b-0 hover:bg-white">
                          <td className="py-3 pr-4 font-mono text-sm text-gray-800">{getOrderId(o)}</td>

                          <td className="py-3 pr-4">
                            <div className="z-20 ">
                              <StatusDropdownCell
                                order={o}
                                updating={updatingStatusIds.some((id) => String(id) === String(getOrderId(o)))}
                                onSelect={(s) => updateOrderStatus(getOrderId(o), s)}
                              />
                            </div>
                          </td>

                          <td className="py-3 pr-4 font-semibold">₹{getOrderAmount(o).toFixed(2)}</td>
                          <td className="py-3 pr-4">{getItemsCount(o)}</td>
                          <td className="py-3 pr-4 max-w-xs truncate">{(o.billingAddress as string) ?? "—"}</td>
                          <td className="py-3 pr-4">{new Date((o.createdAt ?? o.created_at ?? "") as string).toLocaleString() || "—"}</td>
                          <td className="py-3"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border px-3 py-2" disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="text-sm">
                Page{" "}
                <input
                  type="number"
                  value={page}
                  min={1}
                  onChange={(e) => setPage(Math.max(1, Number(e.target.value || 1)))}
                  className="w-16 mx-2 rounded px-2 py-1 border text-sm"
                />{" "}
                / {typeof total === "number" ? Math.max(1, Math.ceil(total / pageSize)) : "?"}
              </div>

              <button onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-3 py-2">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {typeof total === "number" ? <div>Showing page <strong>{page}</strong> — {total} total items</div> : <div>Showing page <strong>{page}</strong></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- StatusDropdownCell (typed) — unchanged behaviour (still updates orders) ---------- */
function StatusDropdownCell({
  order,
  onSelect,
  updating,
}: {
  order: Order | AnyObj;
  onSelect: (status: string) => void;
  updating?: boolean;
}): React.ReactElement {
  const current = ((order as any).status ?? (order as any).order_status ?? "—").toString();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        disabled={updating}
        className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow-sm ${statusSolidClass(current)} focus:outline-none`}
        title={`Status: ${current}`}
      >
        <span className="leading-5">{current}</span>
        <ChevronDown className="h-4 w-4 opacity-90" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 rounded-md border bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {STATUS_LIST.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setOpen(false);
                  if (s !== current) onSelect(s);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${statusSolidClass(s).includes("text-white") ? "bg-white/0" : ""}`} />
                  <span className="truncate">{s}</span>
                </div>
                <div className="text-xs text-gray-500">{s === current ? "Current" : ""}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {updating && <div className="absolute -right-2 -top-2 text-xs text-gray-600">Updating…</div>}
    </div>
  );
}

/* ---------- NEW: StatusFilterDropdown (for filtering the whole list) ---------- */
function StatusFilterDropdown({
  statusFilter,
  setStatusFilter,
  counts,
}: {
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  counts: Record<string, number>;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const label = statusFilter === "ALL" ? "All" : statusFilter;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm bg-white hover:bg-gray-50"
        title="Select Status"
      >
        <span className="text-xs text-gray-600">Status:</span>
        <span className="font-medium">{label}</span>
        <ChevronDown className="h-4 w-4 opacity-90" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-48 rounded-md border bg-white shadow-lg ring-1 ring-black ring-opacity-5 right-0">
          <div className="py-2">
            <button
              onClick={() => {
                setOpen(false);
                setStatusFilter("ALL");
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
                <span className="truncate">All</span>
              </div>
              <div className="text-xs text-gray-500">{counts.ALL ?? 0}</div>
            </button>

            {STATUS_LIST.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setOpen(false);
                  setStatusFilter(s);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${statusSolidClass(s).includes("text-white") ? "bg-white/0" : ""}`} />
                  <span className="truncate">{s}</span>
                </div>
                <div className="text-xs text-gray-500">{counts[s] ?? 0}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
