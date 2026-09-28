"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Bell, Shield, Sparkles, Plus, FlaskConical } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { CommandDialog } from "./CommandDialog";

const PATH_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Executive Dashboard", subtitle: "Real-time discount engine metrics and rule utilization" },
  "/discount-rules": { title: "Discount Rules Catalog", subtitle: "Manage, version, and monitor enterprise discount policies" },
  "/rule-builder": { title: "Visual Rule Builder", subtitle: "Configure targeted multi-component jewellery discount rules" },
  "/rule-simulator": { title: "Rule Simulator & Tester", subtitle: "Validate transaction context and verify step-by-step calculation trace" },
  "/manual-discount": { title: "Manual Discount POS Desk", subtitle: "Apply authorized exceptions with real-time permission enforcement" },
  "/approvals": { title: "Manager Approval Queue", subtitle: "Review and action out-of-policy discount requests" },
  "/audit-trail": { title: "Audit Trail & Compliance", subtitle: "Immutable historical log of every applied discount and version change" },
  "/rule-versions": { title: "Rule Versioning History", subtitle: "Inspect historical rule evolution and preserve transaction snapshots" },
  "/settings": { title: "Engine Configuration & Limits", subtitle: "Role permission matrix, component types, and branch settings" },
};

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [commandOpen, setCommandOpen] = useState(false);

  const activeMeta = PATH_TITLES[pathname] || {
    title: pathname.replace("/", "").replace(/-/g, " ").toUpperCase(),
    subtitle: "Enterprise Jewellery ERP Discount Engine",
  };

  return (
    <>
      <header className="h-14 border-b border-border bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Breadcrumb & Title */}
        <div className="flex items-center space-x-3">
          <span className="text-[11px] font-mono text-neutral-400">AURUM</span>
          <span className="text-neutral-300">/</span>
          <h1 className="text-xs font-semibold tracking-tight text-neutral-900 capitalize">
            {activeMeta.title}
          </h1>
        </div>

        {/* Right: Quick Command & User Status */}
        <div className="flex items-center space-x-3">
          {/* Quick Command Button */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md border border-neutral-200 bg-neutral-50/80 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-all text-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-[11px]">Command search...</span>
            <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-neutral-200 font-mono text-neutral-400 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Quick Actions */}
          <div className="hidden sm:flex items-center space-x-1.5 border-l border-neutral-200 pl-3">
            <Link
              href="/rule-builder"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-black text-white hover:bg-neutral-800 transition-all text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Rule</span>
            </Link>

            <Link
              href="/rule-simulator"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 text-neutral-800 transition-all text-xs font-medium"
            >
              <FlaskConical className="w-3.5 h-3.5 text-neutral-500" />
              <span>Test Rule</span>
            </Link>
          </div>

          {/* Role Pill */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 text-[11px] font-medium text-neutral-700">
            <Shield className="w-3 h-3 text-[#D4AF37]" />
            <span className="font-mono text-[10px]">{user?.roleCode || "GUEST"}</span>
          </div>
        </div>
      </header>

      {/* Global Command Dialog */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
