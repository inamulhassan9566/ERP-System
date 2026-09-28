"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Save,
  ArrowLeft,
  Layers,
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Shield,
  Percent,
  Tag,
  Building,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { useAuth } from "@/components/auth/AuthContext";

function RuleBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const { user } = useAuth();

  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [priority, setPriority] = useState<number>(50);
  const [stackable, setStackable] = useState(true);
  const [stackingMethod, setStackingMethod] = useState("STACK");
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2027-12-31");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState("ALL");
  const [changeSummary, setChangeSummary] = useState("");
  const [currentVersion, setCurrentVersion] = useState(1);

  // Target State (WHO & WHAT)
  const [targetCustomerType, setTargetCustomerType] = useState("ALL");
  const [targetCustomerId, setTargetCustomerId] = useState("");
  const [targetCustomerGroupId, setTargetCustomerGroupId] = useState("");
  const [targetProductScope, setTargetProductScope] = useState("ALL");
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [targetArticleId, setTargetArticleId] = useState("");
  const [targetMetalId, setTargetMetalId] = useState("");
  const [targetPurityId, setTargetPurityId] = useState("");
  const [targetBranchId, setTargetBranchId] = useState("");
  const [targetSalesChannelId, setTargetSalesChannelId] = useState("");

  // Components State (DISCOUNT ON, METHOD, VALUE)
  const [components, setComponents] = useState<any[]>([
    {
      component: "MAKING_CHARGE",
      calculationMethod: "PERCENTAGE",
      discountValue: 20,
      weightBasis: "NET_WEIGHT",
      maxDiscountPercent: "",
      maxDiscountAmount: "",
      maxPerItem: "",
    },
  ]);

  // Conditions State
  const [minBillValue, setMinBillValue] = useState<string>("");
  const [maxBillValue, setMaxBillValue] = useState<string>("");
  const [minWeight, setMinWeight] = useState<string>("");
  const [maxWeight, setMaxWeight] = useState<string>("");
  const [minQuantity, setMinQuantity] = useState<string>("");

  useEffect(() => {
    // Fetch lookups
    fetch("/api/lookup")
      .then((res) => res.json())
      .then((data) => setMetadata(data))
      .catch(console.error);

    // If editing existing rule, pre-populate
    if (editId) {
      fetch(`/api/discount-rules/${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.rule) {
            const r = data.rule;
            setCode(r.code);
            setName(r.name);
            setDescription(r.description || "");
            setStatus(r.status);
            setPriority(r.priority);
            setStackable(r.stackable);
            setStackingMethod(r.stackingMethod);
            setApprovalRequired(r.approvalRequired);
            setStartDate(r.startDate ? r.startDate.split("T")[0] : "");
            setEndDate(r.endDate ? r.endDate.split("T")[0] : "");
            setStartTime(r.startTime || "");
            setEndTime(r.endTime || "");
            setDaysOfWeek(r.daysOfWeek || "ALL");
            setCurrentVersion(r.currentVersion || 1);

            if (r.target) {
              setTargetCustomerType(r.target.targetCustomerType || "ALL");
              setTargetCustomerId(r.target.targetCustomerId || "");
              setTargetCustomerGroupId(r.target.targetCustomerGroupId || "");
              setTargetProductScope(r.target.targetProductScope || "ALL");
              setTargetCategoryId(r.target.targetCategoryId || "");
              setTargetArticleId(r.target.targetArticleId || "");
              setTargetMetalId(r.target.targetMetalId || "");
              setTargetPurityId(r.target.targetPurityId || "");
              setTargetBranchId(r.target.targetBranchId || "");
              setTargetSalesChannelId(r.target.targetSalesChannelId || "");
            }

            if (r.components && r.components.length > 0) {
              setComponents(r.components);
            }

            if (r.condition) {
              setMinBillValue(r.condition.minBillValue?.toString() || "");
              setMaxBillValue(r.condition.maxBillValue?.toString() || "");
              setMinWeight(r.condition.minWeight?.toString() || "");
              setMaxWeight(r.condition.maxWeight?.toString() || "");
              setMinQuantity(r.condition.minQuantity?.toString() || "");
            }
          }
        })
        .finally(() => setLoading(false));
    } else {
      // Auto-generate code for new rule
      setCode(`RULE-${Date.now().toString().slice(-4)}`);
      setLoading(false);
    }
  }, [editId]);

  const handleAddComponent = () => {
    setComponents([
      ...components,
      {
        component: "METAL_VALUE",
        calculationMethod: "PERCENTAGE",
        discountValue: 5,
        weightBasis: "NET_WEIGHT",
        maxDiscountPercent: "",
        maxDiscountAmount: "",
      },
    ]);
  };

  const handleRemoveComponent = (index: number) => {
    if (components.length <= 1) return;
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index: number, field: string, value: any) => {
    const updated = [...components];
    updated[index][field] = value;
    setComponents(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const payload: any = {
        code,
        name,
        description,
        status,
        priority: Number(priority),
        stackable,
        stackingMethod,
        approvalRequired,
        startDate,
        endDate: endDate || null,
        startTime: startTime || null,
        endTime: endTime || null,
        daysOfWeek,
        changeSummary: editId ? (changeSummary || `Version upgrade to v${currentVersion + 1}`) : undefined,
        target: {
          targetCustomerType,
          targetCustomerId: targetCustomerId || null,
          targetCustomerGroupId: targetCustomerGroupId || null,
          targetProductScope,
          targetCategoryId: targetCategoryId || null,
          targetArticleId: targetArticleId || null,
          targetMetalId: targetMetalId || null,
          targetPurityId: targetPurityId || null,
          targetBranchId: targetBranchId || null,
          targetSalesChannelId: targetSalesChannelId || null,
        },
        components: components.map((c) => ({
          component: c.component,
          calculationMethod: c.calculationMethod,
          discountValue: Number(c.discountValue) || 0,
          weightBasis: c.weightBasis || "NET_WEIGHT",
          maxDiscountPercent: c.maxDiscountPercent ? Number(c.maxDiscountPercent) : null,
          maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
          maxPerItem: c.maxPerItem ? Number(c.maxPerItem) : null,
        })),
        condition: {
          minBillValue: minBillValue ? Number(minBillValue) : null,
          maxBillValue: maxBillValue ? Number(maxBillValue) : null,
          minWeight: minWeight ? Number(minWeight) : null,
          maxWeight: maxWeight ? Number(maxWeight) : null,
          minQuantity: minQuantity ? Number(minQuantity) : null,
        },
      };

      const url = editId ? `/api/discount-rules/${editId}` : "/api/discount-rules";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to save discount rule");
      }

      setSuccessMsg(editId ? `Rule updated to Version ${currentVersion + 1} successfully!` : "Rule created successfully!");
      setTimeout(() => {
        router.push("/discount-rules");
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
        <div className="flex items-center space-x-3">
          <Link
            href="/discount-rules"
            className="p-1.5 rounded-md border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              {editId ? `Edit Rule: ${code} (v${currentVersion} → v${currentVersion + 1})` : "Visual Rule Builder"}
            </h1>
            <p className="text-xs text-neutral-400">
              {editId
                ? "Changes will preserve historical transactions and create a new immutable rule version."
                : "Construct commercial discount policies with component isolation and precision constraints."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/discount-rules"
            className="px-3 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700"
          >
            Cancel
          </Link>

          <button
            type="submit"
            form="rule-builder-form"
            disabled={submitting}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-md bg-black text-white hover:bg-neutral-800 text-xs font-medium transition-all shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{submitting ? "Saving Policy..." : editId ? "Save New Version" : "Publish Rule"}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form id="rule-builder-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Step Panels */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: Rule Identity & Execution Profile */}
          <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-[11px] font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">1</span>
                Rule Identity & Control Profile
              </span>
              <span className="text-[10px] font-mono text-neutral-400">Core Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Rule ID / Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editId}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. VIP-GOLD-001"
                  className="w-full text-xs font-mono font-medium p-2 rounded-md border border-neutral-200 focus:outline-hidden focus:ring-1 focus:ring-black disabled:bg-neutral-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Rule Name / Policy Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. VIP Gold Chain Making 20% Privilege"
                  className="w-full text-xs p-2 rounded-md border border-neutral-200 focus:outline-hidden focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                Commercial Description & Business Intent
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explains who this discount is for, why it was granted, and terms of use..."
                className="w-full text-xs p-2 rounded-md border border-neutral-200 focus:outline-hidden focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Priority (1-100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value, 10) || 10)}
                  className="w-full text-xs font-mono p-2 rounded-md border border-neutral-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">Stackable?</label>
                <select
                  value={stackable ? "YES" : "NO"}
                  onChange={(e) => setStackable(e.target.value === "YES")}
                  className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
                >
                  <option value="YES">Stackable (Yes)</option>
                  <option value="NO">Non-Stackable (No)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">Stacking Mode</label>
                <select
                  value={stackingMethod}
                  onChange={(e) => setStackingMethod(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
                >
                  <option value="STACK">STACK (Additive)</option>
                  <option value="HIGHEST">HIGHEST (Winner)</option>
                  <option value="SEQUENTIAL">SEQUENTIAL (On Remainder)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-neutral-100">
              <input
                type="checkbox"
                id="approvalRequiredCheck"
                checked={approvalRequired}
                onChange={(e) => setApprovalRequired(e.target.checked)}
                className="rounded border-neutral-300 text-black focus:ring-black"
              />
              <label htmlFor="approvalRequiredCheck" className="text-xs text-neutral-700 font-medium cursor-pointer">
                Always require Manager Approval prior to applying this rule
              </label>
            </div>

            {editId && (
              <div className="pt-2">
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Version Change Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="e.g. Revised making discount from 20% to 25% for festive promotion"
                  className="w-full text-xs p-2 rounded-md border border-amber-200 bg-amber-50/40 focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* STEP 2: WHO — Customer Eligibility */}
          <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-[11px] font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">2</span>
                WHO — Customer Eligibility
              </span>
              <span className="text-[10px] font-mono text-neutral-400">Target Segment</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Eligibility Scope
                </label>
                <select
                  value={targetCustomerType}
                  onChange={(e) => setTargetCustomerType(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
                >
                  <option value="ALL">All Customers</option>
                  <option value="CUSTOMER_GROUP">Specific Customer Group (VIP, Wholesale, B2B)</option>
                  <option value="VIP">VIP Elite Customers Only</option>
                  <option value="WHOLESALE">Wholesale Accounts Only</option>
                  <option value="B2B">Corporate B2B Only</option>
                  <option value="EMPLOYEE">Internal Staff & Family</option>
                  <option value="SPECIFIC_CUSTOMER">Specific Customer Individual</option>
                  <option value="NEW_CUSTOMER">First-time / New Customers Only</option>
                </select>
              </div>

              {targetCustomerType === "CUSTOMER_GROUP" && (
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                    Select Customer Group
                  </label>
                  <select
                    value={targetCustomerGroupId}
                    onChange={(e) => setTargetCustomerGroupId(e.target.value)}
                    className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
                  >
                    <option value="">Select Group...</option>
                    {metadata?.customerGroups?.map((g: any) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetCustomerType === "SPECIFIC_CUSTOMER" && (
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                    Select Customer
                  </label>
                  <select
                    value={targetCustomerId}
                    onChange={(e) => setTargetCustomerId(e.target.value)}
                    className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
                  >
                    <option value="">Select Customer...</option>
                    {metadata?.customers?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: WHAT — Product & Metal Targeting */}
          <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-[11px] font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">3</span>
                WHAT — Product & Metal Targeting
              </span>
              <span className="text-[10px] font-mono text-neutral-400">Inventory Scope</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Product Target Scope
                </label>
                <select
                  value={targetProductScope}
                  onChange={(e) => setTargetProductScope(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
                >
                  <option value="ALL">All Products</option>
                  <option value="CATEGORY">By Product Category</option>
                  <option value="SPECIFIC_ARTICLE">Specific Article</option>
                </select>
              </div>

              {targetProductScope === "CATEGORY" && (
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                    Product Category
                  </label>
                  <select
                    value={targetCategoryId}
                    onChange={(e) => setTargetCategoryId(e.target.value)}
                    className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
                  >
                    <option value="">Select Category...</option>
                    {metadata?.categories?.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetProductScope === "SPECIFIC_ARTICLE" && (
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                    Specific Article
                  </label>
                  <select
                    value={targetArticleId}
                    onChange={(e) => setTargetArticleId(e.target.value)}
                    className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
                  >
                    <option value="">Select Article...</option>
                    {metadata?.articles?.map((art: any) => (
                      <option key={art.id} value={art.id}>
                        {art.name} ({art.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Target Metal (Optional)
                </label>
                <select
                  value={targetMetalId}
                  onChange={(e) => setTargetMetalId(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
                >
                  <option value="">All Metals</option>
                  {metadata?.metals?.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* STEP 4: DISCOUNT ON & CALCULATION METHOD */}
          <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-[11px] font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">4</span>
                DISCOUNT ON & CALCULATION METHOD
              </span>
              <button
                type="button"
                onClick={handleAddComponent}
                className="flex items-center gap-1 text-[11px] font-medium text-neutral-900 hover:underline"
              >
                <Plus className="w-3 h-3" />
                <span>Add Component</span>
              </button>
            </div>

            <div className="space-y-4">
              {components.map((comp, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-neutral-50/70 rounded-md border border-neutral-200/90 space-y-3 relative group"
                >
                  {components.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveComponent(idx)}
                      className="absolute top-3 right-3 text-neutral-400 hover:text-red-600 transition-colors"
                      title="Remove component"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Discount On Component <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={comp.component}
                        onChange={(e) => handleComponentChange(idx, "component", e.target.value)}
                        className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-white focus:outline-hidden"
                      >
                        <optgroup label="Manufacturing Charges">
                          <option value="MAKING_CHARGE">Making Charge</option>
                          <option value="LABOUR_CHARGE">Labour Charge</option>
                          <option value="WASTAGE">Wastage Charge</option>
                        </optgroup>
                        <optgroup label="Metal Value">
                          <option value="METAL_VALUE">Metal Value (General)</option>
                          <option value="GOLD_VALUE">Gold Value</option>
                          <option value="SILVER_VALUE">Silver Value</option>
                        </optgroup>
                        <optgroup label="Stones & Gems">
                          <option value="STONE_VALUE">Stone Value</option>
                          <option value="DIAMOND_VALUE">Diamond Value</option>
                        </optgroup>
                        <optgroup label="Other Ancillary">
                          <option value="HALLMARK_CHARGE">Hallmark Charge</option>
                          <option value="CERTIFICATION_CHARGE">Certification Charge</option>
                          <option value="ENGRAVING">Engraving Charge</option>
                        </optgroup>
                        <optgroup label="Entire Aggregates">
                          <option value="ENTIRE_ITEM">Entire Item Total</option>
                          <option value="ENTIRE_BILL">Entire Bill / Invoice Total</option>
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Calculation Method <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={comp.calculationMethod}
                        onChange={(e) => handleComponentChange(idx, "calculationMethod", e.target.value)}
                        className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-white focus:outline-hidden"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                        <option value="AMOUNT_PER_GRAM">Amount Per Gram (₹/g)</option>
                        <option value="AMOUNT_PER_PIECE">Amount Per Piece (₹/pc)</option>
                        <option value="AMOUNT_PER_CARAT">Amount Per Carat (₹/ct)</option>
                        <option value="PRICE_OVERRIDE">Fixed Final Price Override</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Discount Value <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={comp.discountValue}
                        onChange={(e) => handleComponentChange(idx, "discountValue", e.target.value)}
                        placeholder="e.g. 20 (for 20%)"
                        className="w-full text-xs font-mono font-bold p-2 rounded-md border border-neutral-200 bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {comp.calculationMethod === "AMOUNT_PER_GRAM" && (
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Weight Basis for Per-Gram Calculation
                      </label>
                      <select
                        value={comp.weightBasis || "NET_WEIGHT"}
                        onChange={(e) => handleComponentChange(idx, "weightBasis", e.target.value)}
                        className="text-xs p-1.5 rounded-md border border-neutral-200 bg-white focus:outline-hidden"
                      >
                        <option value="NET_WEIGHT">Net Weight (Pure Jewellery Metal)</option>
                        <option value="GROSS_WEIGHT">Gross Weight (With Stones/Enamel)</option>
                      </select>
                    </div>
                  )}

                  {/* Optional Component Caps */}
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-neutral-200/60">
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">
                        Max Allowed % Cap (Optional)
                      </label>
                      <input
                        type="number"
                        value={comp.maxDiscountPercent || ""}
                        onChange={(e) => handleComponentChange(idx, "maxDiscountPercent", e.target.value)}
                        placeholder="e.g. 25% max cap"
                        className="w-full text-xs p-1.5 rounded-md border border-neutral-200 bg-white focus:outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">
                        Max ₹ Cap Amount (Optional)
                      </label>
                      <input
                        type="number"
                        value={comp.maxDiscountAmount || ""}
                        onChange={(e) => handleComponentChange(idx, "maxDiscountAmount", e.target.value)}
                        placeholder="e.g. ₹5,000 cap"
                        className="w-full text-xs p-1.5 rounded-md border border-neutral-200 bg-white focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 5: CONDITIONS & VALIDITY */}
          <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-[11px] font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">5</span>
                CONDITIONS & VALIDITY WINDOW
              </span>
              <span className="text-[10px] font-mono text-neutral-400">Execution Guardrails</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Min Bill Value (₹)
                </label>
                <input
                  type="number"
                  value={minBillValue}
                  onChange={(e) => setMinBillValue(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full text-xs font-mono p-2 rounded-md border border-neutral-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Min Weight (Grams)
                </label>
                <input
                  type="number"
                  step="any"
                  value={minWeight}
                  onChange={(e) => setMinWeight(e.target.value)}
                  placeholder="e.g. 20g"
                  className="w-full text-xs font-mono p-2 rounded-md border border-neutral-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Days of Week
                </label>
                <select
                  value={daysOfWeek}
                  onChange={(e) => setDaysOfWeek(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
                >
                  <option value="ALL">All Days of Week</option>
                  <option value="WEEKDAYS">Weekdays Only (Mon-Fri)</option>
                  <option value="WEEKENDS">Weekends Only (Sat-Sun)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-neutral-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-neutral-200 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Live Rule Preview Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5 sticky top-20 space-y-4">
            <div className="pb-3 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                  Live Rule Summary
                </h3>
                <p className="text-[10px] text-neutral-400">Real-time simulation preview</p>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black text-white font-bold">
                {code || "RULE-ID"}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="text-[10px] text-neutral-400 uppercase font-mono">Title</div>
                <div className="font-semibold text-neutral-900">{name || "Untitled Discount Rule"}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-neutral-50 border border-neutral-100">
                  <div className="text-[9px] text-neutral-400 uppercase font-mono">Priority</div>
                  <div className="font-bold text-neutral-900 font-mono">{priority}</div>
                </div>

                <div className="p-2 rounded bg-neutral-50 border border-neutral-100">
                  <div className="text-[9px] text-neutral-400 uppercase font-mono">Stacking</div>
                  <div className="font-bold text-neutral-900 font-mono">
                    {stackable ? stackingMethod : "Disabled"}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200/60 space-y-1.5">
                <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Component Action
                </div>
                {components.map((c, i) => (
                  <div key={i} className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-neutral-700">{c.component}:</span>
                    <span className="font-bold text-black">
                      {c.calculationMethod === "PERCENTAGE" && `${c.discountValue}%`}
                      {c.calculationMethod === "FIXED_AMOUNT" && `₹${c.discountValue}`}
                      {c.calculationMethod === "AMOUNT_PER_GRAM" && `₹${c.discountValue}/g (${c.weightBasis || "Net"})`}
                      {c.calculationMethod === "AMOUNT_PER_PIECE" && `₹${c.discountValue}/pc`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-neutral-600 space-y-1">
                <div>
                  <span className="text-neutral-400">Target Who:</span> {targetCustomerType}
                </div>
                <div>
                  <span className="text-neutral-400">Target What:</span> {targetProductScope}
                </div>
                {minBillValue && (
                  <div>
                    <span className="text-neutral-400">Min Bill:</span> ₹{Number(minBillValue).toLocaleString()}
                  </div>
                )}
                {minWeight && (
                  <div>
                    <span className="text-neutral-400">Min Weight:</span> {minWeight}g
                  </div>
                )}
              </div>

              {approvalRequired && (
                <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>Mandatory Manager Approval required</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100">
              <button
                type="submit"
                form="rule-builder-form"
                disabled={submitting}
                className="w-full py-2 rounded-md bg-black text-white hover:bg-neutral-800 text-xs font-medium transition-all shadow-xs disabled:opacity-50"
              >
                {submitting ? "Saving..." : editId ? "Save New Version" : "Publish Discount Rule"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function RuleBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-xs text-neutral-400">
          Loading Rule Builder...
        </div>
      }
    >
      <RuleBuilderContent />
    </Suspense>
  );
}
