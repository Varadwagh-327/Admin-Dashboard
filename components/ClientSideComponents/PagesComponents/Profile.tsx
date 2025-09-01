"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState, AppDispatch } from "@/app/redux/store";
import { logout } from "@/app/redux/authSlice";
import { useAuth } from "@/hooks/useAuth";

type ApiProfile = {
  id?: number;
  email?: string;
  role?: string;
  bio?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string | null;
  [k: string]: any;
};

function initialsForName(first?: string | null, last?: string | null) {
  const a = first ? first[0] : "";
  const b = last ? last[0] : "";
  const fallback = "A";
  const res = `${a || ""}${b || ""}`.toUpperCase();
  return res || fallback;
}

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const reduxAuth = useSelector((s: RootState) => s.auth);
  const { token: hookToken } = useAuth(false);

  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<ApiProfile>>({});

  const resolvedToken = useMemo(() => {
    if (hookToken) return hookToken;
    if (reduxAuth?.token) return reduxAuth.token;
    try {
      return typeof window !== "undefined" ? localStorage.getItem("token") : null;
    } catch {
      return null;
    }
  }, [hookToken, reduxAuth]);

  async function fetchProfile(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      if (!resolvedToken) throw new Error("No auth token available");
      const res = await fetch("https://beglam.superbstore.in/user/details", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${resolvedToken}`,
        },
        signal,
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = (await res.json()) as ApiProfile;
      setProfile(json);
      setForm(json || {});
    } catch (err: any) {
      if (err?.name !== "AbortError") setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const c = new AbortController();
    if (resolvedToken) fetchProfile(c.signal);
    return () => c.abort();
  }, [resolvedToken]);

  function handleLogout() {
    dispatch(logout());
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {}
    router.replace("/");
  }

  async function handleSaveChanges() {
    if (!resolvedToken) return alert("No token available");
    try {
      setLoading(true);
      const res = await fetch("https://beglam.superbstore.in/user/details", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${resolvedToken}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Save failed ${res.status}`);
      const json = await res.json();
      setProfile(json);
      setEditing(false);
      alert("Profile updated!");
    } catch (err: any) {
      alert("Save failed: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          <button
            onClick={() => fetchProfile()}
            className="px-4 py-2 text-sm font-medium bg-white border rounded-lg shadow-sm hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
          {loading && (
            <div className="p-6 animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          )}

          {!loading && error && (
            <div className="p-6 bg-red-50 text-red-700">{error}</div>
          )}

          {!loading && profile && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
              {/* Avatar & Basic Info */}
              <div className="flex flex-col items-center md:items-start space-y-4">
                {profile.imageUrl ? (
                  <img
                    src={profile.imageUrl}
                    alt={profile.firstName || profile.email}
                    className="h-32 w-32 rounded-full object-cover ring-4 ring-indigo-100"
                  />
                ) : (
                  <div className="h-32 w-32 flex items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white text-3xl font-bold ring-4 ring-indigo-100">
                    {initialsForName(profile.firstName, profile.lastName)}
                  </div>
                )}

                <div className="text-center md:text-left">
                  <p className="text-xl font-semibold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                    {profile.role}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="md:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-700">Profile</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing((s) => !s);
                        setForm(profile);
                      }}
                      className="px-4 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50"
                    >
                      {editing ? "Cancel" : "Edit"}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                    >
                      Log out
                    </button>
                  </div>
                </div>

                {!editing ? (
                  <div className="space-y-4">
                    <p className="text-gray-600 text-sm">
                      {profile.bio || "No bio provided."}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">User ID</p>
                        <p className="font-medium text-gray-800">{profile.id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="font-medium text-gray-800">
                          {profile.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">First Name</p>
                        <p className="font-medium text-gray-800">
                          {profile.firstName}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Name</p>
                        <p className="font-medium text-gray-800">
                          {profile.lastName}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500">First name</label>
                        <input
                          value={form.firstName || ""}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, firstName: e.target.value }))
                          }
                          className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Last name</label>
                        <input
                          value={form.lastName || ""}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, lastName: e.target.value }))
                          }
                          className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring focus:ring-indigo-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Bio</label>
                      <textarea
                        value={form.bio || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, bio: e.target.value }))
                        }
                        className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring focus:ring-indigo-200 min-h-[100px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveChanges}
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setForm(profile || {});
                        }}
                        className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
