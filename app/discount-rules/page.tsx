"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Layers,
  Sparkles,
  FlaskConical,
  Edit,
  Copy,
  Power,
  PowerOff,
  GitBranch,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

export default function DiscountRulesPage() {
  const { user } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [componentFilter, setComponentFilter] = useState("ALL");

  const fetchRules = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (componentFilter !== "ALL") params.set("component", componentFilter);

      const res = await fetch(`/api/discount-rules?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [statusFilter, componentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRules();
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const action = currentStatus === "ACTIVE" ? "deactivate" : "activate";
    try {
      const res = await fetch(`/api/discount-rules/${id}/${action}`, { method: "POST" });
      if (res.ok) {
        fetchRules();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/discount-rules/${id}/duplicate`, { method: "POST" });
      if (res.ok) {
        fetchRules();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Discount Rules Catalog</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configured commercial discount policies, targeting criteria, priority rankings, and activation states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/rule-simulator"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium transition-all shadow-2xs"
          >
            <FlaskConical className="w-3.5 h-3.5 text-neutral-500" />
            <span>Simulator</span>
          </Link>

          {user?.roleCode !== "SALES_STAFF" && (
            <Link
              href="/rule-builder"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black text-white hover:bg-neutral-800 text-xs font-medium transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Create Rule</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-neutral-200 shadow-2xs">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rules by ID, title, or description..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-neutral-200 focus:outline-hidden focus:ring-1 focus:ring-black"
          />
        </form>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center space-x-1.5 text-xs text-neutral-600">
            <span className="text-[11px] text-neutral-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="INACTIVE">Inactive</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-neutral-600">
            <span className="text-[11px] text-neutral-400">Component:</span>
            <select
              value={componentFilter}
              onChange={(e) => setComponentFilter(e.target.value)}
              className="text-xs py-1.5 px-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
            >
              <option value="ALL">All Components</option>
              <option value="MAKING_CHARGE">Making Charge</option>
              <option value="METAL_VALUE">Metal Value</option>
              <option value="SILVER_VALUE">Silver Value</option>
              <option value="WASTAGE">Wastage</option>
              <option value="STONE_VALUE">Stone Value</option>
              <option value="ENTIRE_ITEM">Entire Item</option>
              <option value="ENTIRE_BILL">Entire Bill</option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchRules}
            className="px-2.5 py-1.5 rounded-md border border-neutral-200 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                <th className="py-2.5 px-3">Rule ID</th>
                <th className="py-2.5 px-3">Rule Name</th>
                <th className="py-2.5 px-3">WHO (Eligibility)</th>
                <th className="py-2.5 px-3">WHAT (Targeting)</th>
                <th className="py-2.5 px-3">Discount On</th>
                <th className="py-2.5 px-3">Value</th>
                <th className="py-2.5 px-3 text-center">Priority</th>
                <th className="py-2.5 px-3">Stacking</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-neutral-400">
                    Loading discount rules...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-neutral-400">
                    No discount rules match the specified criteria.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => {
                  const target = rule.target;
                  const firstComp = rule.components?.[0];

                  const whoLabel =
                    target?.targetCustomerType === "ALL"
                      ? "All Customers"
                      : target?.targetCustomerGroup?.name ||
                        target?.targetCustomer?.name ||
                        target?.targetCustomerType?.replace(/_/g, " ") ||
                        "All";

                  const whatLabel =
                    target?.targetCategory?.name ||
                    target?.targetMetal?.name ||
                    target?.targetArticle?.name ||
                    (target?.targetProductScope === "ALL" ? "All Products" : target?.targetProductScope) ||
                    "All Products";

                  return (
                    <tr
                      key={rule.id}
                      className="hover:bg-neutral-50/70 transition-colors group"
                    >
                      {/* Code */}
                      <td className="py-3 px-3 font-mono font-semibold text-neutral-900 whitespace-nowrap">
                        <Link
                          href={`/discount-rules/${rule.id}`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 group-hover:bg-[#D4AF37]"></span>
                          {rule.code}
                        </Link>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-3 font-medium text-neutral-800 max-w-[200px]">
                        <Link href={`/discount-rules/${rule.id}`} className="hover:underline truncate block">
                          {rule.name}
                        </Link>
                        {rule.condition?.minBillValue && (
                          <span className="text-[10px] text-neutral-400 block">
                            Min Bill: ₹{rule.condition.minBillValue.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Who */}
                      <td className="py-3 px-3 text-neutral-600 whitespace-nowrap">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-100 text-[11px] font-mono">
                          {whoLabel}
                        </span>
                      </td>

                      {/* What */}
                      <td className="py-3 px-3 text-neutral-600 whitespace-nowrap">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-100 text-[11px] font-mono">
                          {whatLabel}
                        </span>
                      </td>

                      {/* Component */}
                      <td className="py-3 px-3 text-neutral-700 font-mono text-[11px] whitespace-nowrap">
                        {firstComp?.component ? firstComp.component.replace(/_/g, " ") : "N/A"}
                        {rule.components?.length > 1 && (
                          <span className="text-[10px] text-neutral-400 ml-1">
                            +{rule.components.length - 1} more
                          </span>
                        )}
                      </td>

                      {/* Value & Method */}
                      <td className="py-3 px-3 font-mono font-semibold text-neutral-900 whitespace-nowrap">
                        {firstComp?.calculationMethod === "PERCENTAGE" && `${firstComp.discountValue}%`}
                        {firstComp?.calculationMethod === "FIXED_AMOUNT" && `₹${firstComp.discountValue.toLocaleString()}`}
                        {firstComp?.calculationMethod === "AMOUNT_PER_GRAM" && `₹${firstComp.discountValue}/g`}
                        {firstComp?.calculationMethod === "AMOUNT_PER_PIECE" && `₹${firstComp.discountValue}/pc`}
                        {firstComp?.calculationMethod === "AMOUNT_PER_CARAT" && `₹${firstComp.discountValue}/ct`}
                        {firstComp?.calculationMethod === "PRICE_OVERRIDE" && `Override: ₹${firstComp.discountValue.toLocaleString()}`}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-neutral-800">
                        {rule.priority}
                      </td>

                      {/* Stacking */}
                      <td className="py-3 px-3 whitespace-nowrap text-[11px]">
                        {rule.stackable ? (
                          <span className="text-emerald-700 font-mono font-medium">
                            Stack ({rule.stackingMethod})
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-mono">Non-stack</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                            rule.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : rule.status === "DRAFT"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : rule.status === "EXPIRED"
                              ? "bg-neutral-100 text-neutral-500 border border-neutral-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              rule.status === "ACTIVE"
                                ? "bg-emerald-500"
                                : rule.status === "DRAFT"
                                ? "bg-amber-500"
                                : "bg-neutral-400"
                            }`}
                          ></span>
                          {rule.status}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Test in Simulator */}
                          <Link
                            href={`/rule-simulator?ruleCode=${rule.code}`}
                            className="p-1 rounded text-neutral-500 hover:text-black hover:bg-neutral-100"
                            title="Test this rule in Simulator"
                          >
                            <FlaskConical className="w-3.5 h-3.5" />
                          </Link>

                          {/* View details */}
                          <Link
                            href={`/discount-rules/${rule.id}`}
                            className="p-1 rounded text-neutral-500 hover:text-black hover:bg-neutral-100"
                            title="View Rule Summary"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Edit Rule */}
                          {user?.roleCode !== "SALES_STAFF" && (
                            <Link
                              href={`/rule-builder?editId=${rule.id}`}
                              className="p-1 rounded text-neutral-500 hover:text-black hover:bg-neutral-100"
                              title="Edit / New Version"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          {/* Duplicate */}
                          {user?.roleCode !== "SALES_STAFF" && (
                            <button
                              type="button"
                              onClick={() => handleDuplicate(rule.id)}
                              className="p-1 rounded text-neutral-500 hover:text-black hover:bg-neutral-100"
                              title="Duplicate rule"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Toggle Status (Active / Inactive) */}
                          {user?.roleCode !== "SALES_STAFF" && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(rule.id, rule.status)}
                              className={`p-1 rounded transition-colors ${
                                rule.status === "ACTIVE"
                                  ? "text-emerald-600 hover:text-red-600 hover:bg-red-50"
                                  : "text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={rule.status === "ACTIVE" ? "Deactivate Rule" : "Activate Rule"}
                            >
                              {rule.status === "ACTIVE" ? (
                                <Power className="w-3.5 h-3.5" />
                              ) : (
                                <PowerOff className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
