// components/layout/SideBar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import LoginLogo from "@/public/images/LoginLogo.webp";

export default function SideBar({
  open = false,
  onClose = () => {},
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  // ---------- (UNCHANGED) menu items/data ----------
  const sections = [
    {
      title: "Main Menu",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: "📈" },
        { name: "DeapSelesDashboard", icon: "📊", href: "/DeapSelesDashboard" },
      ],
    },
    {
      title: "Product Management",
      items: [{ name: "Transactions", icon: "💰", href: "/PaymentService" }],
    },
    {
      title: "Orders & Customers",
      items: [{ name: "Orders", icon: "🧾", href: "/Orders" }],
    },
  ];

  return (
    <>
      {/* Mobile backdrop: visible only on small screens, sits just below the sidebar */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 lg:hidden z-[99998]
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Sidebar:
          - inset-y-0 left-0 ensures full height (top-to-bottom)
          - very high z-index so it overlays the topbar on phones
          - same translate animation as before
          - widths unchanged (w-72 md:w-20 lg:w-64)
      */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={`
          fixed inset-y-0 left-0 bg-[#0A2540] text-white shadow-xl transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          w-72 md:w-20 lg:w-64 z-[99999] flex flex-col
        `}
      >
        {/* Logo / Header */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-indigo-500 to-teal-500 grid place-items-center shadow-md overflow-hidden">
            <Image src={LoginLogo} alt="Admin Logo" className="rounded-lg" />
          </div>

          {/*
            Show header text on phone (base), hide it on md (compact collapsed sidebar),
            and show again on lg (desktop) — this matches label behavior for nav items.
            Original code hid header on phones; we now show it on phones so it doesn't get hidden under topbar
          */}
          <div className="block md:hidden lg:block">
            <div className="font-bold text-lg">Admin</div>
            <div className="text-xs text-gray-400">Dashboard</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-6 text-sm space-y-6">
          {sections.map((section, si) => (
            <div key={si}>
              <div className="hidden lg:block text-sm text-gray-400 uppercase px-2 mb-2 tracking-wider">
                {section.title}
              </div>

              <ul className="space-y-1">
                {section.items.map((item, i) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={i}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          // close the drawer on mobile when navigating
                          onClose();
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300
                          ${isActive ? "bg-indigo-600 text-white shadow-sm" : "hover:bg-indigo-500/10 hover:text-indigo-300 text-gray-300"}`}
                        title={item.name}
                      >
                        <span className="text-lg">{item.icon ?? "•"}</span>

                        {/* label visibility unchanged: shows on base, hidden on md (compact), shows on lg */}
                        <span className="inline md:hidden lg:inline">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-white/10 my-3"></div>
            </div>
          ))}

          {/* Account area */}
          <div>
            <div className="hidden lg:block text-xs text-gray-400 uppercase px-2 mb-2 tracking-wider">
              Account
            </div>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/profile"
                  onClick={() => onClose()}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-400 text-gray-300"
                  title="Profile"
                >
                  👤 <span className="inline md:hidden lg:inline">Profile</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  onClick={() => onClose()}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-gray-300"
                  title="Logout"
                >
                  🚪 <span className="inline md:hidden lg:inline">Logout</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </aside>
    </>
  );
}
