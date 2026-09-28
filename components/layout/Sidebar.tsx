"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  FlaskConical,
  BadgePercent,
  CheckCheck,
  History,
  GitBranch,
  Settings,
  ChevronRight,
  ShieldCheck,
  Building2,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discount-rules", label: "Discount Rules", icon: Layers },
  { href: "/rule-builder", label: "Rule Builder", icon: Sparkles },
  { href: "/rule-simulator", label: "Rule Simulator", icon: FlaskConical },
  { href: "/manual-discount", label: "Manual Discount", icon: BadgePercent },
  { href: "/approvals", label: "Approval Queue", icon: CheckCheck, badge: true },
  { href: "/audit-trail", label: "Audit Trail", icon: History },
  { href: "/rule-versions", label: "Rule Versions", icon: GitBranch },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, switchUser } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch("/api/approvals?status=PENDING");
        if (res.ok) {
          const data = await res.json();
          setPendingApprovals(data.pendingCount || data.requests?.length || 0);
        }
      } catch {}
    };

    fetchPending();
    const interval = setInterval(fetchPending, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 border-r border-border bg-white flex flex-col h-screen select-none shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold tracking-tighter text-sm shadow-sm ring-1 ring-black/10">
            <span className="text-[#D4AF37] font-serif text-base">✦</span>
          </div>
          <div>
            <div className="font-semibold text-xs tracking-wider uppercase text-neutral-900 flex items-center gap-1.5">
              AURUM ERP
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 font-mono">v2.4</span>
            </div>
            <div className="text-[11px] text-neutral-400 font-medium">Discount Engine</div>
          </div>
        </div>
      </div>

      {/* Branch & Mode Badge */}
      <div className="px-4 py-2 bg-neutral-50/70 border-b border-border flex items-center justify-between text-[11px] text-neutral-600">
        <span className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-neutral-400" />
          Chennai Main
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          ONLINE
        </span>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        <div className="px-2 pb-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
          Discount Management
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group ${
                isActive
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-600 hover:text-black hover:bg-neutral-100/70"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-white" : "text-neutral-400 group-hover:text-black"
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && pendingApprovals > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded-full ${
                    isActive
                      ? "bg-[#D4AF37] text-black font-semibold"
                      : "bg-neutral-900 text-white"
                  }`}
                >
                  {pendingApprovals}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Role Switcher (For Demo & Acceptance Verification) */}
      <div className="p-3 border-t border-border bg-neutral-50/50">
        <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Active Role Switcher</span>
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
        </div>

        <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-md border border-neutral-200 text-[10px] font-medium">
          <button
            type="button"
            onClick={() => switchUser("ADMIN")}
            className={`py-1 rounded text-center transition-all ${
              user?.roleCode === "ADMIN"
                ? "bg-black text-white font-semibold"
                : "text-neutral-500 hover:text-black hover:bg-neutral-100"
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => switchUser("MANAGER")}
            className={`py-1 rounded text-center transition-all ${
              user?.roleCode === "MANAGER"
                ? "bg-black text-white font-semibold"
                : "text-neutral-500 hover:text-black hover:bg-neutral-100"
            }`}
          >
            Manager
          </button>
          <button
            type="button"
            onClick={() => switchUser("SALES_STAFF")}
            className={`py-1 rounded text-center transition-all ${
              user?.roleCode === "SALES_STAFF"
                ? "bg-black text-white font-semibold"
                : "text-neutral-500 hover:text-black hover:bg-neutral-100"
            }`}
          >
            Staff
          </button>
        </div>

        {/* Current User Snapshot */}
        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-neutral-200/60">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-semibold">
              {user?.name?.slice(0, 1) || "U"}
            </div>
            <div className="truncate max-w-[120px]">
              <div className="text-[11px] font-medium text-neutral-800 truncate">{user?.name || "Guest User"}</div>
              <div className="text-[9px] text-neutral-400 uppercase font-mono">
                {user?.roleCode === "SALES_STAFF" ? "Max 10%" : user?.roleCode === "MANAGER" ? "Max 25%" : "Unlimited"}
              </div>
            </div>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-200/80 text-neutral-700">
            {user?.roleCode}
          </span>
        </div>
      </div>
    </aside>
  );
}
