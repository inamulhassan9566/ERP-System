"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Shield,
  Layers,
  Database,
  CheckCircle2,
  Lock,
  Building,
  Coins,
  Server,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lookup")
      .then((res) => res.json())
      .then((data) => setMetadata(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="pb-3 border-b border-neutral-200">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900">
          Discount Engine System Settings & Authority Matrix
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Role-based limits, component isolation permissions, branch configurations, and calculation architecture.
        </p>
      </div>

      {/* Role Authority Matrix */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <span className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
            Role Authority & Approval Matrix
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">Enforced Server-Side</span>
        </div>

        <div className="rounded-md border border-neutral-200 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                <th className="py-2.5 px-3">Role Code</th>
                <th className="py-2.5 px-3">Max Discount %</th>
                <th className="py-2.5 px-3">Max ₹ Limit</th>
                <th className="py-2.5 px-3">Bill-Level Discount</th>
                <th className="py-2.5 px-3">Price Override</th>
                <th className="py-2.5 px-3">Approval Authority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono text-neutral-800">
              <tr>
                <td className="py-3 px-3 font-bold text-neutral-900 font-sans">
                  ADMIN (Owner / Executive)
                </td>
                <td className="py-3 px-3 text-emerald-600 font-bold">100% (Full)</td>
                <td className="py-3 px-3">Unlimited</td>
                <td className="py-3 px-3 text-emerald-600 font-bold">Yes</td>
                <td className="py-3 px-3 text-emerald-600 font-bold">Yes</td>
                <td className="py-3 px-3 text-emerald-600 font-bold">Autonomous</td>
              </tr>
              <tr className="bg-neutral-50/40">
                <td className="py-3 px-3 font-bold text-neutral-900 font-sans">
                  MANAGER (Store Manager)
                </td>
                <td className="py-3 px-3 text-amber-700 font-bold">25.0% Max</td>
                <td className="py-3 px-3">₹50,000</td>
                <td className="py-3 px-3 text-emerald-600 font-bold">Yes</td>
                <td className="py-3 px-3 text-neutral-400">No</td>
                <td className="py-3 px-3 text-emerald-600 font-bold">Can Approve Staff</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-neutral-900 font-sans">
                  SALES_STAFF (Showroom Counter)
                </td>
                <td className="py-3 px-3 text-neutral-700 font-bold">10.0% Max</td>
                <td className="py-3 px-3">₹10,000</td>
                <td className="py-3 px-3 text-neutral-400">Requires Approval</td>
                <td className="py-3 px-3 text-neutral-400">No</td>
                <td className="py-3 px-3 text-neutral-400">Requests Only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Component Isolation Specifications */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <span className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-neutral-700" />
            Component Isolation Rules & Pricing Separation
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">Domain Guarantee</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200/80 space-y-1.5">
            <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Making Charge Isolation
            </div>
            <p className="text-[11px] text-neutral-500">
              When a rule targets <span className="font-mono text-neutral-800">MAKING_CHARGE</span>, the percentage
              or per-gram discount applies strictly to making charges and never modifies the bullion metal price.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200/80 space-y-1.5">
            <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Metal Value Discounting
            </div>
            <p className="text-[11px] text-neutral-500">
              Wholesale per-gram concessions (e.g. ₹5/g on Silver) alter only the metal value component based on
              actual net metal weight.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200/80 space-y-1.5">
            <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Immutable Historical Retention
            </div>
            <p className="text-[11px] text-neutral-500">
              Historical invoices store the exact rule version ID and snapshot used at creation time. Updating a
              rule creates a new version without altering past accounting records.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200/80 space-y-1.5">
            <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Conflict Detection Engine
            </div>
            <p className="text-[11px] text-neutral-500">
              Rules with equal priority targeting the same component that cannot safely stack emit explicit
              conflict warnings instead of making silent assumptions.
            </p>
          </div>
        </div>
      </div>

      {/* Deployment & Database Status */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <span className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-neutral-700" />
            Infrastructure & Database Status
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            CONNECTED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] text-neutral-400 uppercase block font-sans">Database Provider</span>
            <span className="font-bold text-neutral-900">PostgreSQL 16 (Prisma ORM)</span>
          </div>

          <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] text-neutral-400 uppercase block font-sans">Deployment Target</span>
            <span className="font-bold text-neutral-900">Vercel Ready (Neon / Cloud Postgres)</span>
          </div>

          <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] text-neutral-400 uppercase block font-sans">Current User Context</span>
            <span className="font-bold text-neutral-900 truncate block">{user?.name} ({user?.roleCode})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
