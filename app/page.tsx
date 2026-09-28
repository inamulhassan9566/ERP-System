"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Layers,
  FlaskConical,
  BadgePercent,
  CheckCheck,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Tag,
  Receipt,
  RotateCw,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metrics = data?.metrics || {
    activeRulesCount: 0,
    draftRulesCount: 0,
    inactiveRulesCount: 0,
    expiredRulesCount: 0,
    pendingApprovalsCount: 0,
    discountsAppliedToday: 0,
    totalDiscountAmountToday: 0,
    manualDiscountsToday: 0,
    autoDiscountsToday: 0,
    conflictsCount: 0,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Announcement */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-neutral-200/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
              Live Engine Status: Optimal
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 mt-0.5">
            Discount Engine Operations Center
          </h1>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchDashboard}
            className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors"
            title="Refresh Data"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <Link
            href="/rule-builder"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black text-white hover:bg-neutral-800 text-xs font-medium transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Create Rule</span>
          </Link>

          <Link
            href="/rule-simulator"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium transition-all shadow-2xs"
          >
            <FlaskConical className="w-3.5 h-3.5 text-neutral-500" />
            <span>Test Rule</span>
          </Link>

          <Link
            href="/manual-discount"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium transition-all shadow-2xs"
          >
            <BadgePercent className="w-3.5 h-3.5 text-neutral-500" />
            <span>Manual Discount</span>
          </Link>

          <Link
            href="/approvals"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium transition-all shadow-2xs"
          >
            <CheckCheck className="w-3.5 h-3.5 text-neutral-500" />
            <span>Approval Queue</span>
            {metrics.pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-black text-white text-[10px] font-mono">
                {metrics.pendingApprovalsCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Active Rules */}
        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Active Rules</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            {metrics.activeRulesCount}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Ready for auto-application
          </div>
        </div>

        {/* Draft & Inactive */}
        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Draft / Inactive</span>
            <Clock className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            {metrics.draftRulesCount + metrics.inactiveRulesCount}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {metrics.draftRulesCount} draft, {metrics.inactiveRulesCount} inactive
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Pending Approvals</span>
            <ShieldAlert className={`w-4 h-4 ${metrics.pendingApprovalsCount > 0 ? "text-amber-500" : "text-neutral-400"}`} />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            {metrics.pendingApprovalsCount}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {metrics.pendingApprovalsCount > 0 ? "Requires manager sign-off" : "All queues cleared"}
          </div>
        </div>

        {/* Total Discount Amount Today */}
        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Discounts Today</span>
            <Receipt className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            ₹{metrics.totalDiscountAmountToday.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Across {metrics.discountsAppliedToday} transaction(s)
          </div>
        </div>

        {/* Conflicts / Warnings */}
        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-2xs col-span-2 md:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Engine Conflicts</span>
            <AlertTriangle className={`w-4 h-4 ${metrics.conflictsCount > 0 ? "text-red-500" : "text-neutral-400"}`} />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            {metrics.conflictsCount}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {metrics.conflictsCount === 0 ? "Zero unresolvable conflicts" : "Requires priority tuning"}
          </div>
        </div>
      </div>

      {/* Second Row: Top Performing Rules & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Active Discount Rules & Performance */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-neutral-200 shadow-2xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Rule Policy Utilization
              </h2>
              <p className="text-[11px] text-neutral-400">Live usage frequency across showroom counters</p>
            </div>
            <Link
              href="/discount-rules"
              className="text-[11px] font-medium text-neutral-900 hover:underline flex items-center gap-1"
            >
              <span>View All Rules</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-neutral-100 mt-2">
            {data?.topPerformingRules && data.topPerformingRules.length > 0 ? (
              data.topPerformingRules.map((rule: any) => (
                <div key={rule.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-semibold">
                      {rule.code}
                    </span>
                    <div>
                      <div className="text-xs font-medium text-neutral-900">{rule.name}</div>
                      <div className="text-[10px] text-neutral-400">
                        Priority Level: <span className="font-mono font-medium text-neutral-700">{rule.priority}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-neutral-900">
                        {rule.usageCount} {rule.usageCount === 1 ? "time" : "times"}
                      </div>
                      <div className="text-[9px] uppercase font-mono text-neutral-400">Applied</div>
                    </div>

                    <Link
                      href={`/rule-simulator?ruleCode=${rule.code}`}
                      className="px-2 py-1 rounded border border-neutral-200 text-[10px] font-medium text-neutral-600 hover:text-black hover:border-black transition-colors"
                    >
                      Simulate
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-neutral-400">No active rules loaded</div>
            )}
          </div>
        </div>

        {/* Engine Operational Status & Breakdown */}
        <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-neutral-100">
              <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Distribution Breakdown
              </h2>
              <p className="text-[11px] text-neutral-400">Manual vs Automatic discount execution</p>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-600">Automatic Engine Rules</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    {metrics.autoDiscountsToday}
                  </span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-black h-full rounded-full transition-all"
                    style={{
                      width: `${
                        metrics.discountsAppliedToday > 0
                          ? (metrics.autoDiscountsToday / metrics.discountsAppliedToday) * 100
                          : 80
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-600">Manual Discretionary Exceptions</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    {metrics.manualDiscountsToday}
                  </span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#D4AF37] h-full rounded-full transition-all"
                    style={{
                      width: `${
                        metrics.discountsAppliedToday > 0
                          ? (metrics.manualDiscountsToday / metrics.discountsAppliedToday) * 100
                          : 20
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 bg-neutral-50/60 p-3 rounded-md text-[11px] text-neutral-500 space-y-1">
            <div className="font-medium text-neutral-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Component Isolation Active
            </div>
            <p className="text-[10px] text-neutral-400">
              Discounts on Making Charges are mathematically isolated and strictly never alter underlying Metal Value.
            </p>
          </div>
        </div>
      </div>

      {/* Third Row: Recent Applied Transactions & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Recent Transactions
              </h2>
              <p className="text-[11px] text-neutral-400">Latest discount applications at checkout</p>
            </div>
            <Link
              href="/audit-trail"
              className="text-[11px] font-medium text-neutral-900 hover:underline"
            >
              All Invoices →
            </Link>
          </div>

          <div className="divide-y divide-neutral-100 mt-2">
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              data.recentTransactions.map((tx: any) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono text-[11px] font-semibold text-neutral-900">
                      {tx.transactionNumber}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {tx.customer?.name || "Walk-in Customer"} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-xs font-semibold text-emerald-600">
                      -₹{tx.totalDiscountAmount?.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Gross: ₹{tx.totalGrossAmount?.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-neutral-400">No transactions recorded yet</div>
            )}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Audit Timeline
              </h2>
              <p className="text-[11px] text-neutral-400">Real-time system events and policy modifications</p>
            </div>
            <Link
              href="/audit-trail"
              className="text-[11px] font-medium text-neutral-900 hover:underline"
            >
              Full Log →
            </Link>
          </div>

          <div className="divide-y divide-neutral-100 mt-2">
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.slice(0, 5).map((act: any) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700">
                      {act.action}
                    </span>
                    <div>
                      <div className="text-neutral-800 font-medium">
                        {act.userName}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate max-w-[240px]">
                        {act.details}
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-neutral-400">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-neutral-400">No activity logged yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
