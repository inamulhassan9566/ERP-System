"use client";

import React, { useEffect, useState } from "react";
import {
  BadgePercent,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Tag,
  ArrowRight,
  User,
  ShoppingBag,
  Coins,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

export default function ManualDiscountPage() {
  const { user } = useAuth();
  const [metadata, setMetadata] = useState<any>(null);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [applying, setApplying] = useState(false);

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [sku, setSku] = useState("GC-22K-001");
  const [productName, setProductName] = useState("22K Gold Rope Chain (25g)");
  const [component, setComponent] = useState("MAKING_CHARGE");
  const [calculationMethod, setCalculationMethod] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number | "">(15);
  const [reason, setReason] = useState("NEGOTIATED_PRICE");
  const [reasonCustom, setReasonCustom] = useState("");

  // Item Component values
  const [metalValue, setMetalValue] = useState(110000);
  const [makingCharge, setMakingCharge] = useState(10000);
  const [wastage, setWastage] = useState(5000);
  const [stoneValue, setStoneValue] = useState(0);
  const [hallmarkCharge, setHallmarkCharge] = useState(500);

  // Preview & Outcome State
  const [outcome, setOutcome] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/lookup")
      .then((res) => res.json())
      .then((data) => {
        setMetadata(data);
        if (data.customers?.length > 0) {
          setCustomerId(data.customers[0].id);
        }
      })
      .finally(() => setLoadingLookups(false));
  }, []);

  const handleProductSelect = (selectedSku: string) => {
    const prod = metadata?.products?.find((p: any) => p.sku === selectedSku);
    if (prod) {
      setSku(prod.sku);
      setProductName(prod.name);
      setMetalValue(prod.baseMetalValue || 0);
      setMakingCharge(prod.baseMakingCharge || 0);
      setWastage(prod.baseWastageCharge || 0);
      setStoneValue(prod.baseStoneValue || 0);
      setHallmarkCharge(prod.baseOtherCharges || 0);
    }
  };

  const getTargetComponentOriginalValue = () => {
    switch (component) {
      case "MAKING_CHARGE":
      case "LABOUR_CHARGE":
        return makingCharge;
      case "METAL_VALUE":
      case "GOLD_VALUE":
        return metalValue;
      case "WASTAGE":
        return wastage;
      case "STONE_VALUE":
        return stoneValue;
      case "HALLMARK_CHARGE":
        return hallmarkCharge;
      case "ENTIRE_ITEM":
      case "ENTIRE_BILL":
        return metalValue + makingCharge + wastage + stoneValue + hallmarkCharge;
      default:
        return makingCharge;
    }
  };

  const originalCompVal = getTargetComponentOriginalValue();
  const calculatedDiscountPreview =
    calculationMethod === "PERCENTAGE"
      ? (originalCompVal * (Number(discountValue) || 0)) / 100
      : Math.min(originalCompVal, Number(discountValue) || 0);

  const calculatedDiscountPercent = originalCompVal > 0 ? (calculatedDiscountPreview / originalCompVal) * 100 : 0;
  const userAllowedPercent = user?.maxDiscountPercent ?? 10;
  const exceedsUserLimit = calculatedDiscountPercent > userAllowedPercent;

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    setErrorMsg("");
    setOutcome(null);

    try {
      const finalReason = reason === "OTHER" ? (reasonCustom || "Other discretionary exception") : reason;

      const payload = {
        customerId,
        sku,
        productName,
        component,
        calculationMethod,
        discountValue: Number(discountValue),
        reason: finalReason,
        components: {
          metalValue,
          makingCharge,
          wastage,
          stoneValue,
          hallmarkCharge,
        },
      };

      const res = await fetch("/api/discount/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to execute manual discount");
      }

      setOutcome(resData);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="pb-3 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Manual Discount POS Counter Desk
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Apply custom discretionary discounts with real-time server-side authority limits and approval trigger.
          </p>
        </div>

        {/* Current User Authority Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white shadow-2xs text-xs">
          <span className="text-neutral-500 font-medium">Your Role:</span>
          <span className="font-mono font-semibold text-neutral-900">{user?.roleName || "Sales Staff"}</span>
          <span className="text-neutral-300">•</span>
          <span className="font-mono text-neutral-600">Limit: {user?.maxDiscountPercent}%</span>
        </div>
      </div>

      {/* Outcome Banner */}
      {outcome && (
        <div
          className={`p-4 rounded-lg border text-xs space-y-1 ${
            outcome.applied
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <div className="font-bold flex items-center gap-1.5 text-sm">
            {outcome.applied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Discount Applied Successfully!</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Approval Request Submitted</span>
              </>
            )}
          </div>
          <p>{outcome.message}</p>
          {outcome.approvalRequest && (
            <div className="font-mono text-[11px] pt-1">
              Request Reference Code: <span className="font-bold">{outcome.approvalRequest.requestCode}</span>
            </div>
          )}
          {outcome.discountApplication && (
            <div className="font-mono text-[11px] pt-1">
              Transaction Number: <span className="font-bold">{outcome.discountApplication.transactionNumber}</span>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleApplyDiscount} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Parameters */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-2xs space-y-4">
            <div className="text-xs font-semibold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100 flex items-center justify-between">
              <span>Customer & Article Selection</span>
              <ShoppingBag className="w-3.5 h-3.5 text-neutral-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Customer
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
                >
                  {metadata?.customers?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code} - {c.customerGroup?.code || "Retail"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Select Jewellery Article
                </label>
                <select
                  value={sku}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden font-medium"
                >
                  {metadata?.products?.map((p: any) => (
                    <option key={p.id} value={p.sku}>
                      {p.sku} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Component */}
            <div className="pt-2 border-t border-neutral-100 space-y-3">
              <div className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Discount Specification
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                    Component To Discount
                  </label>
                  <select
                    value={component}
                    onChange={(e) => setComponent(e.target.value)}
                    className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-white focus:outline-hidden"
                  >
                    <option value="MAKING_CHARGE">Making Charge (₹{makingCharge.toLocaleString()})</option>
                    <option value="LABOUR_CHARGE">Labour Charge</option>
                    <option value="METAL_VALUE">Metal Value (₹{metalValue.toLocaleString()})</option>
                    <option value="WASTAGE">Wastage Charge (₹{wastage.toLocaleString()})</option>
                    <option value="STONE_VALUE">Stone Value (₹{stoneValue.toLocaleString()})</option>
                    <option value="ENTIRE_BILL">Entire Bill Level</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                    Calculation Method
                  </label>
                  <select
                    value={calculationMethod}
                    onChange={(e) => setCalculationMethod(e.target.value)}
                    className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-white focus:outline-hidden"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
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
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value ? parseFloat(e.target.value) : "")}
                    placeholder="e.g. 20 (for 20%)"
                    className="w-full text-xs font-mono font-bold p-2 rounded-md border border-neutral-200 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Mandatory Reason */}
            <div className="pt-2 border-t border-neutral-100">
              <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                Mandatory Reason Code <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs p-2 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden mb-2"
              >
                <option value="VIP_CUSTOMER">VIP Privilege Customer</option>
                <option value="OLD_CUSTOMER">Loyal / Long-time Repeat Patron</option>
                <option value="BULK_PURCHASE">Bulk Quantity Purchase</option>
                <option value="FESTIVAL_OFFER">Festive Season Promotional Deal</option>
                <option value="CLEARANCE">Clearance / Old Stock</option>
                <option value="NEGOTIATED_PRICE">Counter Negotiated Price</option>
                <option value="DAMAGED_PACKAGING">Minor Display Packaging Blemish</option>
                <option value="OTHER">Other Discretionary Reason...</option>
              </select>

              {reason === "OTHER" && (
                <input
                  type="text"
                  required
                  value={reasonCustom}
                  onChange={(e) => setReasonCustom(e.target.value)}
                  placeholder="Specify explicit justification..."
                  className="w-full text-xs p-2 rounded-md border border-neutral-200"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Live Authorization & Preview */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-neutral-100">
              <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Authority Check & Preview
              </h3>
              <p className="text-[10px] text-neutral-400">Server-side limits enforcement</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200/80 space-y-1.5 font-mono">
                <div className="flex justify-between text-neutral-600">
                  <span>Selected Component:</span>
                  <span className="font-semibold text-neutral-900">{component}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Original Value:</span>
                  <span className="font-semibold text-neutral-900">₹{originalCompVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold border-t border-neutral-200/60 pt-1.5">
                  <span>Discount ({calculationMethod}):</span>
                  <span>-₹{calculatedDiscountPreview.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-neutral-900 pt-1">
                  <span>Final Component:</span>
                  <span>₹{Math.max(0, originalCompVal - calculatedDiscountPreview).toLocaleString()}</span>
                </div>
              </div>

              {/* Authority Status Indicator */}
              <div
                className={`p-3 rounded-md border text-[11px] space-y-1 ${
                  exceedsUserLimit
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {exceedsUserLimit ? (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Exceeds Authority Limit</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Within Authorized Limit</span>
                    </>
                  )}
                </div>
                <p className="text-[10px]">
                  {exceedsUserLimit
                    ? `Requested ${calculatedDiscountPercent.toFixed(1)}% exceeds your role's authority of ${userAllowedPercent}%. Clicking apply will route this request to the Manager Approval Queue.`
                    : `Discount of ${calculatedDiscountPercent.toFixed(1)}% is permitted under your role's authority (${userAllowedPercent}% max). Will apply immediately.`}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={applying}
                className="w-full py-2.5 rounded-md bg-black text-white hover:bg-neutral-800 text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-xs disabled:opacity-50"
              >
                <BadgePercent className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>
                  {applying
                    ? "Processing..."
                    : exceedsUserLimit
                    ? "Submit For Approval"
                    : "Apply Discount Instantly"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
