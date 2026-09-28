"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FlaskConical,
  Edit,
  Copy,
  Power,
  PowerOff,
  GitBranch,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  Shield,
  Tag,
  CheckCircle2,
  AlertCircle,
  History,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

export default function RuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuth();

  const [rule, setRule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRule = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discount-rules/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRule(data.rule);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRule();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!rule) return;
    const action = rule.status === "ACTIVE" ? "deactivate" : "activate";
    try {
      const res = await fetch(`/api/discount-rules/${id}/${action}`, { method: "POST" });
      if (res.ok) fetchRule();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-neutral-400">
        Loading rule specifications...
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="py-12 text-center text-xs text-neutral-500">
        Rule not found.
      </div>
    );
  }

  const target = rule.target;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-200 gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/discount-rules"
            className="p-1.5 rounded-md border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-black text-white font-bold">
                {rule.code}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                v{rule.currentVersion}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                  rule.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                }`}
              >
                {rule.status}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 mt-1">{rule.name}</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Link
            href={`/rule-simulator?ruleCode=${rule.code}`}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-black text-white hover:bg-neutral-800 text-xs font-medium transition-all shadow-xs"
          >
            <FlaskConical className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>TEST THIS RULE</span>
          </Link>

          {user?.roleCode !== "SALES_STAFF" && (
            <>
              <Link
                href={`/rule-builder?editId=${rule.id}`}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit (New Version)</span>
              </Link>

              <button
                type="button"
                onClick={handleToggleStatus}
                className="p-2 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600"
                title={rule.status === "ACTIVE" ? "Deactivate" : "Activate"}
              >
                {rule.status === "ACTIVE" ? <PowerOff className="w-4 h-4 text-red-600" /> : <Power className="w-4 h-4 text-emerald-600" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Specifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Policy Specification Breakdown */}
          <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5 space-y-4">
            <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
              Commercial Policy Definition
            </h2>

            {rule.description && (
              <p className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-md border border-neutral-100">
                {rule.description}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-md bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] text-neutral-400 font-mono uppercase block">Priority</span>
                <span className="font-mono text-base font-bold text-neutral-900">{rule.priority}</span>
              </div>

              <div className="p-3 rounded-md bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] text-neutral-400 font-mono uppercase block">Stacking</span>
                <span className="font-mono text-xs font-semibold text-neutral-800">
                  {rule.stackable ? `Stack (${rule.stackingMethod})` : "Non-Stackable"}
                </span>
              </div>

              <div className="p-3 rounded-md bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] text-neutral-400 font-mono uppercase block">Approval</span>
                <span className="text-xs font-semibold text-neutral-800">
                  {rule.approvalRequired ? "Mandatory Sign-off" : "Automatic"}
                </span>
              </div>

              <div className="p-3 rounded-md bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] text-neutral-400 font-mono uppercase block">Created By</span>
                <span className="text-xs font-medium text-neutral-800 truncate block">
                  {rule.createdBy?.name || "System Admin"}
                </span>
              </div>
            </div>

            {/* WHO & WHAT Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-md border border-neutral-200 space-y-1 text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-mono block">WHO (Eligibility)</span>
                <div className="font-semibold text-neutral-900">
                  {target?.targetCustomerType?.replace(/_/g, " ")}
                </div>
                {target?.targetCustomerGroup && (
                  <div className="text-[11px] text-neutral-500">Group: {target.targetCustomerGroup.name}</div>
                )}
                {target?.targetCustomer && (
                  <div className="text-[11px] text-neutral-500">Customer: {target.targetCustomer.name}</div>
                )}
              </div>

              <div className="p-3 rounded-md border border-neutral-200 space-y-1 text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-mono block">WHAT (Targeting)</span>
                <div className="font-semibold text-neutral-900">
                  {target?.targetProductScope?.replace(/_/g, " ")}
                </div>
                {target?.targetCategory && (
                  <div className="text-[11px] text-neutral-500">Category: {target.targetCategory.name}</div>
                )}
                {target?.targetMetal && (
                  <div className="text-[11px] text-neutral-500">Metal: {target.targetMetal.name}</div>
                )}
              </div>
            </div>

            {/* Components Table */}
            <div className="pt-2">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase font-mono block mb-2">
                Discount On & Value Formula
              </span>
              <div className="rounded-md border border-neutral-200 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                      <th className="py-2 px-3">Component</th>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3">Value</th>
                      <th className="py-2 px-3">Weight Basis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono">
                    {rule.components?.map((c: any) => (
                      <tr key={c.id}>
                        <td className="py-2.5 px-3 font-sans font-medium text-neutral-800">
                          {c.component.replace(/_/g, " ")}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-600">{c.calculationMethod}</td>
                        <td className="py-2.5 px-3 font-bold text-neutral-900">
                          {c.calculationMethod === "PERCENTAGE" && `${c.discountValue}%`}
                          {c.calculationMethod === "FIXED_AMOUNT" && `₹${c.discountValue.toLocaleString()}`}
                          {c.calculationMethod === "AMOUNT_PER_GRAM" && `₹${c.discountValue}/g`}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-500">
                          {c.calculationMethod === "AMOUNT_PER_GRAM" ? c.weightBasis : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Conditions Box */}
            {rule.condition && (
              <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200 text-xs space-y-1">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase font-mono block">
                  Condition Thresholds
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-neutral-700">
                  {rule.condition.minBillValue && (
                    <div>Min Bill: ₹{rule.condition.minBillValue.toLocaleString()}</div>
                  )}
                  {rule.condition.minWeight && <div>Min Weight: {rule.condition.minWeight}g</div>}
                  {rule.condition.minQuantity && <div>Min Qty: {rule.condition.minQuantity}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Section: Recent Transaction Usages */}
          <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5 space-y-3">
            <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
              Recent Transaction Applications
            </h2>

            <div className="divide-y divide-neutral-100">
              {rule.usages && rule.usages.length > 0 ? (
                rule.usages.map((u: any, idx: number) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-semibold text-neutral-900">
                        {u.discountApplication?.transactionNumber}
                      </span>
                      <div className="text-[10px] text-neutral-400">
                        Cashier: {u.discountApplication?.user?.name} • {new Date(u.discountApplication?.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-600">
                        -₹{u.discountAmount?.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Applied at v{u.ruleVersionNumber || 1}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-neutral-400">
                  No showroom transactions have applied this rule yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Version History Timeline */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-[#D4AF37]" />
                Version History
              </h2>
              <span className="font-mono text-[10px] text-neutral-400">
                {rule.versions?.length || 1} Version(s)
              </span>
            </div>

            <div className="space-y-3">
              {rule.versions?.map((v: any) => (
                <div
                  key={v.id}
                  className={`p-3 rounded-md border text-xs space-y-1.5 ${
                    v.versionNumber === rule.currentVersion
                      ? "bg-neutral-50 border-neutral-300"
                      : "bg-white border-neutral-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-neutral-900 flex items-center gap-1">
                      Version {v.versionNumber}
                      {v.versionNumber === rule.currentVersion && (
                        <span className="text-[9px] px-1 rounded bg-black text-white font-mono">ACTIVE</span>
                      )}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-neutral-700 text-[11px]">{v.changeSummary}</p>

                  <div className="text-[10px] text-neutral-400 font-mono pt-1 border-t border-neutral-200/60">
                    By: {v.changedBy?.name || "System"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
