"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  Layers,
  FlaskConical,
  BadgePercent,
  CheckCheck,
  History,
  X,
  ArrowRight,
  Shield,
  FileText,
} from "lucide-react";

interface CommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandDialog({ open, onOpenChange }: CommandDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [rules, setRules] = useState<any[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      fetch("/api/discount-rules")
        .then((res) => res.json())
        .then((data) => setRules(data.rules || []))
        .catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  const quickPages = [
    { label: "Dashboard", href: "/", icon: Layers },
    { label: "Discount Rules Catalog", href: "/discount-rules", icon: Layers },
    { label: "Create New Rule", href: "/rule-builder", icon: Sparkles },
    { label: "Rule Simulator (Test Discounts)", href: "/rule-simulator", icon: FlaskConical },
    { label: "Manual Discount POS Desk", href: "/manual-discount", icon: BadgePercent },
    { label: "Approval Queue", href: "/approvals", icon: CheckCheck },
    { label: "Audit Trail", href: "/audit-trail", icon: History },
  ];

  const filteredRules = rules.filter(
    (r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.code.toLowerCase().includes(query.toLowerCase())
  );

  const navigateTo = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3 border-b border-neutral-200">
          <Search className="w-4 h-4 text-neutral-400 mr-2.5 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search rules (e.g. VIP, Making, Gold)..."
            className="w-full text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Quick Navigation */}
          <div>
            <div className="px-2 pb-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              Quick Navigation
            </div>
            <div className="space-y-0.5">
              {quickPages
                .filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))
                .map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.href}
                      type="button"
                      onClick={() => navigateTo(p.href)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-neutral-100 text-left text-xs font-medium text-neutral-700 hover:text-black transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{p.label}</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-neutral-300" />
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Rules Search */}
          {filteredRules.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Discount Rules ({filteredRules.length})
              </div>
              <div className="space-y-0.5">
                {filteredRules.slice(0, 5).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => navigateTo(`/discount-rules/${r.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-neutral-100 text-left text-xs text-neutral-800 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                        <span className="font-mono text-[10px] px-1 py-0.2 bg-neutral-100 rounded text-neutral-600">
                          {r.code}
                        </span>
                        {r.name}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Priority: {r.priority} • Status: {r.status}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#D4AF37] font-mono">View →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
          <span>Use ⌘K to toggle command palette</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
