"use client";

import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { logout } from "@/app/redux/authSlice";
import { AppDispatch } from "@/app/redux/store";

export default function Topbar({ user, onMenuClick }: { user: any; tokenPreview?: string; onMenuClick?: () => void; }) {
  
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  // Handle both string and object user types
  const userRole = typeof user === "string" ? "Admin" : (user?.role || "Admin");
  const userInitial =
    typeof user === "string" ? user?.[0] : (user?.firstName?.[0] || user?.email?.[0] || "A");

  return (
    <header className={["sticky top-0 z-50 ",
        // background + border + shape
        "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80",
        "border-b border-slate-200 rounded-lg shadow-sm",
        // spacing
        "px-4 md:px-6 py-2 md:py-3 mb-6",
        // layout: NO wrap, keep left and right on one row
        "flex items-center justify-between gap-3 md:gap-4",
      ].join(" ")}>
     

       {/* Left side */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Mobile menu button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-slate-100 md:hidden"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Text block that can shrink and truncate */}
        <div className="min-w-0">
          <h1 className="text-base md:text-xl font-semibold text-slate-900 truncate">
            Welcome 👋
          </h1>
          <p className="text-xs md:text-sm text-slate-500 truncate">Role: {userRole}</p>
        </div>
      </div>

       {/* Right side */}
      {/* NOTE: removed `w-full md:w-auto` and kept `flex-shrink-0` so it won't drop below the left section on phones */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* User avatar */}
        <Link href="/profile">
          <div className="h-9 w-9 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-700 font-semibold">
            {(userInitial || "A").toUpperCase()}
          </div>
        </Link>

        {/* Logout */}
        <button
          onClick={() => {
            dispatch(logout());
            router.replace("/");
          }}
          className="rounded-md border px-3 py-2 text-sm bg-white hover:bg-slate-50"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
