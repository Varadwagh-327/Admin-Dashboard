"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Wallet, CreditCard, Settings } from "lucide-react";


/**
 * Responsive Payment Methods Page
 * - Keeps same API usage & token integration as your original
 * - Only UI/responsive changes
 */

const API_URL = "https://beglam.superbstore.in/payment-service";
const PREFERRED_SCHEME: "Token" | "Bearer" = "Token";

/* -------------------- Helpers -------------------- */
function sanitizeToken(raw: string | null) {
  if (!raw) return null;
  return raw.replace(/^"(.*)"$/, "$1").trim();
}
function hasScheme(t: string) {
  return /^Bearer\s+/i.test(t) || /^Token\s+/i.test(t);
}
function buildHeaderFromRaw(raw: string, preferred: "Token" | "Bearer") {
  if (hasScheme(raw)) return raw;
  return `${preferred} ${raw}`;
}

/* -------------------- Types -------------------- */
type PaymentService = {
  id?: number;
  name?: string;
  url?: string | null;
  is_active?: boolean;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  start_date?: string | null;
  end_date?: string | null;
  razorpay_key_id?: string;
  razorpay_key_secret?: string;
};
type ServiceRow = { key: string; data: PaymentService };

/* -------------------- Component -------------------- */
export default function PaymentMethodsPage() {
  const { token } = useAuth(false); // Don't redirect from this component
  const [authHeader, setAuthHeader] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (token) {
      const cleanToken = sanitizeToken(token);
      setAuthHeader(cleanToken ? buildHeaderFromRaw(cleanToken, PREFERRED_SCHEME) : null);
    } else {
      setAuthHeader(null);
    }
  }, [token]);

  useEffect(() => {
    if (!authHeader) {
      setLoading(false);
      setError("No auth token found.");
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(API_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`${res.status} ${res.statusText} - ${txt}`);
        }
        const json = await res.json();
        const obj = json?.payment_services ?? {};
        const arr: ServiceRow[] = Object.entries(obj).map(([k, v]) => ({ key: k, data: v || {} }));
        if (mounted) setServices(arr);
      } catch (err) {
        console.error("fetch payment services error:", err);
        if (mounted) setError(err instanceof Error ? err.message : "Error fetching payment services");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [authHeader]);

  function openManage(key: string) {
    setExpandedKey((prev) => (prev === key ? null : key));
    const svc = services.find((s) => s.key === key);
    setEditing(svc ? { ...svc.data } : {});
  }
  function cancelEdit() {
    setEditing(null);
    setExpandedKey(null);
  }

  async function toggleService(key: string) {
    const idx = services.findIndex((s) => s.key === key);
    if (idx === -1) return;
    const current = !!services[idx].data.is_active;
    const newVal = !current;

    setServices((prev) => prev.map((s) => (s.key === key ? { ...s, data: { ...s.data, is_active: newVal } } : s)));
    setToggling((t) => ({ ...t, [key]: true }));

    try {
      const res = await fetch(API_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader!,
        },
        body: JSON.stringify({
          service_key: key,
          is_active: newVal,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${res.statusText} - ${txt}`);
      }
      const json = await res.json().catch(() => null);
      if (json && json.payment_services && json.payment_services[key]) {
        setServices((prev) => prev.map((s) => (s.key === key ? { key, data: json.payment_services[key] } : s)));
      }
    } catch (err) {
      console.error("toggle error:", err);
      setServices((prev) => prev.map((s) => (s.key === key ? { ...s, data: { ...s.data, is_active: current } } : s)));
      alert("Failed to change status: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setToggling((t) => ({ ...t, [key]: false }));
    }
  }

  async function saveService(key: string) {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = { service_key: key, ...editing };
      const res = await fetch(API_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader!,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${res.statusText} - ${txt}`);
      }
      const json = await res.json().catch(() => null);
      if (json && json.payment_services && json.payment_services[key]) {
        setServices((prev) => prev.map((s) => (s.key === key ? { key, data: json.payment_services[key] } : s)));
      } else {
        setServices((prev) => prev.map((s) => (s.key === key ? { ...s, data: { ...s.data, ...editing } } : s)));
      }
      setExpandedKey(null);
      setEditing(null);
    } catch (err) {
      console.error("save error:", err);
      alert("Failed to save: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  const servicesCount = services.length;

  return (
    <>
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Payment Methods</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading payment methods...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
          {/* header row (hidden on small screens) */}
          <div className="sm:grid grid-cols-12 gap-4 items-center px-6 py-3 border-b bg-gray-50 text-sm text-gray-600 font-medium">
            <div className="col-span-6">Payment Method</div>
            <div className="col-span-3 text-center">Status</div>
            <div className="col-span-3 text-right">Manage</div>
          </div>

          {/* compact header for small screens */}
          <div className="sm:hidden px-4 py-3 border-b text-sm text-gray-600">Payment methods</div>

          {/* rows container: allow horizontal scroll on very small screens */}
          <div className="overflow-x-auto">
            <div>
              {services.map((s) => (
                <div key={s.key} className="border-b last:border-b-0">
                  {/* main row - responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 items-center px-4 sm:px-6 py-3 sm:py-4 gap-2 sm:gap-0">
                    {/* name + small-manage button (on mobile) */}
                    <div className="col-span-1 sm:col-span-6 flex items-center justify-between sm:justify-start gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center rounded bg-gray-100">
                          {s.key === "cash_on_delivery" ? (
                            <Wallet className="w-5 h-5 text-green-600" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <div className="text-sm">{s.data?.name ?? prettifyKey(s.key)}</div>
                      </div>

                      {/* Manage button visible on tiny screens next to name for quick tap */}
                      <div className="sm:hidden">
                        <button
                          onClick={() => openManage(s.key)}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-300 text-white text-xs"
                          aria-expanded={expandedKey === s.key}
                        >
                          <Settings className="w-4 h-4" />
                          Manage
                        </button>
                      </div>
                    </div>

                    {/* toggle - placed under name on mobile, center on sm+ */}
                    <div className="col-span-1 sm:col-span-3 flex justify-start sm:justify-center mt-0 sm:mt-0">
                      <button
                        aria-label={`${s.key} toggle`}
                        disabled={!!toggling[s.key]}
                        onClick={() => toggleService(s.key)}
                        className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors focus:outline-none ${
                          s.data?.is_active ? "bg-emerald-400" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            s.data?.is_active ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* manage button on sm+ */}
                    <div className="col-span-1 sm:col-span-3 flex justify-end mt-0 sm:mt-0">
                      <div className="hidden sm:block">
                        <button
                          onClick={() => openManage(s.key)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-400 text-white text-sm"
                        >
                          <Settings className="w-4 h-4" />
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* expanded manage panel */}
                  {expandedKey === s.key && (
                    <div className="bg-gray-50 px-4 sm:px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* left */}
                        <div className="space-y-3">
                          <label className="text-xs text-gray-500">URL</label>
                          <input
                            value={editing?.url ?? ""}
                            onChange={(e) => setEditing((p) => ({ ...(p ?? {}), url: e.target.value }))}
                            className="w-full border rounded px-3 py-2 text-sm bg-white"
                            placeholder="https://your-webhook-url"
                          />

                          {("razorpay_key_secret" in (editing ?? {}) || s.key === "razorpay") && (
                            <>
                              <label className="text-xs text-gray-500">Razorpay Key Secret</label>
                              <input
                                value={editing?.razorpay_key_secret ?? ""}
                                onChange={(e) => setEditing((p) => ({ ...(p ?? {}), razorpay_key_secret: e.target.value }))}
                                className="w-full border rounded px-3 py-2 text-sm bg-white"
                              />
                            </>
                          )}
                        </div>

                        {/* right */}
                        <div className="space-y-3">
                          <label className="text-xs text-gray-500">Razorpay Key Id</label>
                          <input
                            value={editing?.razorpay_key_id ?? ""}
                            onChange={(e) => setEditing((p) => ({ ...(p ?? {}), razorpay_key_id: e.target.value }))}
                            className="w-full border rounded px-3 py-2 text-sm bg-white"
                          />

                          <label className="text-xs text-gray-500">Start Date</label>
                          <input
                            value={editing?.start_date ? dateToInput(editing.start_date) : ""}
                            onChange={(e) => setEditing((p) => ({ ...(p ?? {}), start_date: e.target.value || null }))}
                            className="w-full border rounded px-3 py-2 text-sm bg-white"
                            type="date"
                          />

                          <label className="text-xs text-gray-500">End Date</label>
                          <input
                            value={editing?.end_date ? dateToInput(editing.end_date) : ""}
                            onChange={(e) => setEditing((p) => ({ ...(p ?? {}), end_date: e.target.value || null }))}
                            className="w-full border rounded px-3 py-2 text-sm bg-white"
                            type="date"
                          />
                        </div>
                      </div>

                      {/* action buttons - stacked on small, horizontal on md+ */}
                      <div className="mt-4 flex flex-col md:flex-row gap-3 items-center md:items-start">
                        <button
                          onClick={() => saveService(s.key)}
                          disabled={saving}
                          className="w-full md:w-auto px-4 py-2 rounded bg-indigo-600 text-white text-sm"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="w-full md:w-auto px-4 py-2 rounded bg-red-500 text-white text-sm"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* metadata */}
                      <div className="mt-4 text-xs text-gray-500 space-y-1">
                        <div>Created by: {s.data?.created_by ?? "—"}</div>
                        <div>Created at: {formatDateNice(s.data?.created_at)}</div>
                        <div>Updated by: {s.data?.updated_by ?? "—"}</div>
                        <div>Updated at: {formatDateNice(s.data?.updated_at)}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {!servicesCount && (
                <div className="p-6 text-center text-gray-500">No payment services available.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

/* ---------------- Utilities ---------------- */
function prettifyKey(k: string) {
  return k.replaceAll("_", " ").replaceAll(".", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
function formatDateNice(d?: string | null) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleString();
  } catch {
    return d!;
  }
}
function dateToInput(d?: string | null) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    return dt.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}
