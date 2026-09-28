"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FlaskConical,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  ShieldCheck,
  Tag,
  ArrowRight,
} from "lucide-react";
import { Suspense } from "react";
import { useAuth } from "@/components/auth/AuthContext";

function RuleSimulatorContent() {
  const searchParams = useSearchParams();
  const ruleCodeParam = searchParams.get("ruleCode");
  const { user } = useAuth();

  const [metadata, setMetadata] = useState<any>(null);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<"BREAKDOWN" | "TRACE" | "APPLICABLE">("BREAKDOWN");

  // Transaction Inputs State
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerGroupCode, setCustomerGroupCode] = useState("VIP");
  const [customerGroupId, setCustomerGroupId] = useState("");
  const [sku, setSku] = useState("GC-22K-001");
  const [productName, setProductName] = useState("22K Gold Rope Chain (25g)");
  const [categoryId, setCategoryId] = useState("");
  const [metalCode, setMetalCode] = useState("GOLD");
  const [purityCode, setPurityCode] = useState("22K");
  const [grossWeight, setGrossWeight] = useState(25.0);
  const [netWeight, setNetWeight] = useState(25.0);
  const [quantity, setQuantity] = useState(1);

  // Price Components
  const [metalValue, setMetalValue] = useState(110000);
  const [makingCharge, setMakingCharge] = useState(10000);
  const [wastage, setWastage] = useState(5000);
  const [stoneValue, setStoneValue] = useState(0);
  const [hallmarkCharge, setHallmarkCharge] = useState(500);
  const [otherCharges, setOtherCharges] = useState(0);

  // Bill Value Override (optional)
  const [billValueOverride, setBillValueOverride] = useState<number | "">("");

  // Results State
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/lookup")
      .then((res) => res.json())
      .then((data) => {
        setMetadata(data);
        // Find Aisha by default
        const aisha = data.customers?.find((c: any) => c.code === "CUST-002");
        if (aisha) {
          setCustomerId(aisha.id);
          setCustomerName(aisha.name);
          setCustomerGroupId(aisha.customerGroupId || "");
          setCustomerGroupCode(aisha.customerGroup?.code || "VIP");
        }
        const goldChain = data.products?.find((p: any) => p.sku === "GC-22K-001");
        if (goldChain) {
          setCategoryId(goldChain.categoryId);
        }
      })
      .finally(() => setLoadingLookups(false));
  }, []);

  const loadPreset = (presetType: string) => {
    if (presetType === "AISHA_VIP_CHAIN") {
      const aisha = metadata?.customers?.find((c: any) => c.code === "CUST-002");
      const prod = metadata?.products?.find((p: any) => p.sku === "GC-22K-001");
      setCustomerId(aisha?.id || "");
      setCustomerName("Aisha Patel");
      setCustomerGroupId(aisha?.customerGroupId || "");
      setCustomerGroupCode("VIP");
      setSku("GC-22K-001");
      setProductName("22K Gold Rope Chain (25g)");
      setCategoryId(prod?.categoryId || "");
      setMetalCode("GOLD");
      setPurityCode("22K");
      setGrossWeight(25.0);
      setNetWeight(25.0);
      setQuantity(1);
      setMetalValue(110000);
      setMakingCharge(10000);
      setWastage(5000);
      setStoneValue(0);
      setHallmarkCharge(500);
      setOtherCharges(0);
      setBillValueOverride(125500);
    } else if (presetType === "WHOLESALE_SILVER") {
      const vijay = metadata?.customers?.find((c: any) => c.code === "CUST-003");
      const prod = metadata?.products?.find((p: any) => p.sku === "SC-925-004");
      setCustomerId(vijay?.id || "");
      setCustomerName("Vijay Jewellers (Wholesale)");
      setCustomerGroupId(vijay?.customerGroupId || "");
      setCustomerGroupCode("WHOLESALE");
      setSku("SC-925-004");
      setProductName("Sterling Silver 925 Curb Chain (10g)");
      setCategoryId(prod?.categoryId || "");
      setMetalCode("SILVER");
      setPurityCode("925_SILVER");
      setGrossWeight(10.0);
      setNetWeight(10.0);
      setQuantity(1);
      setMetalValue(20000);
      setMakingCharge(1500);
      setWastage(500);
      setStoneValue(0);
      setHallmarkCharge(200);
      setOtherCharges(0);
      setBillValueOverride(22200);
    } else if (presetType === "RAHUL_GOLD_RING") {
      const rahul = metadata?.customers?.find((c: any) => c.code === "CUST-001");
      const prod = metadata?.products?.find((p: any) => p.sku === "GR-18K-003");
      setCustomerId(rahul?.id || "");
      setCustomerName("Rahul Sharma");
      setCustomerGroupId(rahul?.customerGroupId || "");
      setCustomerGroupCode("RETAIL");
      setSku("GR-18K-003");
      setProductName("18K Gold Men Ring (6g)");
      setCategoryId(prod?.categoryId || "");
      setMetalCode("GOLD");
      setPurityCode("18K");
      setGrossWeight(6.0);
      setNetWeight(6.0);
      setQuantity(1);
      setMetalValue(22000);
      setMakingCharge(3500);
      setWastage(1200);
      setStoneValue(0);
      setHallmarkCharge(300);
      setOtherCharges(0);
      setBillValueOverride(27000);
    } else if (presetType === "GRAND_BILL_ORDER") {
      setCustomerId("");
      setCustomerName("Grand Festive Patron");
      setCustomerGroupCode("RETAIL");
      setSku("BULK-COMBO");
      setProductName("Festive Bridal Jewellery Assortment");
      setMetalCode("GOLD");
      setPurityCode("22K");
      setGrossWeight(100.0);
      setNetWeight(100.0);
      setQuantity(1);
      setMetalValue(480000);
      setMakingCharge(35000);
      setWastage(15000);
      setStoneValue(25000);
      setHallmarkCharge(1500);
      setOtherCharges(0);
      setBillValueOverride(556500);
    }
  };

  const handleProductSelect = (selectedSku: string) => {
    const prod = metadata?.products?.find((p: any) => p.sku === selectedSku);
    if (prod) {
      setSku(prod.sku);
      setProductName(prod.name);
      setCategoryId(prod.categoryId);
      setMetalCode(prod.metal?.code || "GOLD");
      setPurityCode(prod.purity?.code || "22K");
      setGrossWeight(prod.grossWeight || 10);
      setNetWeight(prod.netWeight || 10);
      setMetalValue(prod.baseMetalValue || 0);
      setMakingCharge(prod.baseMakingCharge || 0);
      setWastage(prod.baseWastageCharge || 0);
      setStoneValue(prod.baseStoneValue || 0);
      setHallmarkCharge(prod.baseOtherCharges || 0);
    }
  };

  const handleCustomerSelect = (id: string) => {
    const cust = metadata?.customers?.find((c: any) => c.id === id);
    if (cust) {
      setCustomerId(cust.id);
      setCustomerName(cust.name);
      setCustomerGroupId(cust.customerGroupId || "");
      setCustomerGroupCode(cust.customerGroup?.code || "RETAIL");
    }
  };

  const calculateGross = () => {
    return (
      (Number(metalValue) || 0) +
      (Number(makingCharge) || 0) +
      (Number(wastage) || 0) +
      (Number(stoneValue) || 0) +
      (Number(hallmarkCharge) || 0) +
      (Number(otherCharges) || 0)
    );
  };

  const handleRunSimulation = async () => {
    setCalculating(true);
    try {
      const gross = calculateGross();

      const contextPayload: any = {
        customerId: customerId || undefined,
        customerName: customerName || undefined,
        customerGroupId: customerGroupId || undefined,
        customerGroupCode: customerGroupCode || undefined,
        billValueOverride: billValueOverride !== "" ? Number(billValueOverride) : gross,
        userId: user?.id || "simulator-user",
        userRoleCode: user?.roleCode || "ADMIN",
        userMaxDiscountPercent: user?.maxDiscountPercent ?? 100,
        userMaxDiscountAmount: user?.maxDiscountAmount ?? 1000000,
        items: [
          {
            id: "sim-item-1",
            sku,
            name: productName,
            categoryId: categoryId || undefined,
            metalCode,
            purityCode,
            grossWeight: Number(grossWeight) || 0,
            netWeight: Number(netWeight) || 0,
            quantity: Number(quantity) || 1,
            components: {
              metalValue: Number(metalValue) || 0,
              makingCharge: Number(makingCharge) || 0,
              wastage: Number(wastage) || 0,
              stoneValue: Number(stoneValue) || 0,
              hallmarkCharge: Number(hallmarkCharge) || 0,
              certificationCharge: 0,
              engraving: 0,
              polishing: 0,
              otherCharges: Number(otherCharges) || 0,
            },
          },
        ],
      };

      const res = await fetch("/api/discount/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contextPayload),
      });

      if (res.ok) {
        const json = await res.json();
        setResult(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Discount Engine Simulator & Trace
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Test any transaction context against active rules, inspect component-level isolation, and review execution traces.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-neutral-500 font-medium">Quick Presets:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => loadPreset("AISHA_VIP_CHAIN")}
              className="px-2 py-1 rounded bg-white hover:bg-neutral-100 border border-neutral-200 text-[10px] font-medium text-neutral-800 transition-colors shadow-2xs"
            >
              VIP Aisha (20% Making)
            </button>
            <button
              type="button"
              onClick={() => loadPreset("WHOLESALE_SILVER")}
              className="px-2 py-1 rounded bg-white hover:bg-neutral-100 border border-neutral-200 text-[10px] font-medium text-neutral-800 transition-colors shadow-2xs"
            >
              Wholesale Silver (₹5/g)
            </button>
            <button
              type="button"
              onClick={() => loadPreset("RAHUL_GOLD_RING")}
              className="px-2 py-1 rounded bg-white hover:bg-neutral-100 border border-neutral-200 text-[10px] font-medium text-neutral-800 transition-colors shadow-2xs"
            >
              Rahul Flat ₹3,000
            </button>
            <button
              type="button"
              onClick={() => loadPreset("GRAND_BILL_ORDER")}
              className="px-2 py-1 rounded bg-white hover:bg-neutral-100 border border-neutral-200 text-[10px] font-medium text-neutral-800 transition-colors shadow-2xs"
            >
              ₹500K Bill (1%)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: Transaction Inputs (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-4 space-y-3.5">
            <div className="pb-2 border-b border-neutral-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-[#D4AF37]" />
                Transaction Parameters
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">Simulated POS</span>
            </div>

            {/* Customer Inputs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">
                  Select Customer
                </label>
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full text-xs p-1.5 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
                >
                  <option value="">Custom / Walk-in Customer</option>
                  {metadata?.customers?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">
                  Customer Group / Tier
                </label>
                <select
                  value={customerGroupCode}
                  onChange={(e) => setCustomerGroupCode(e.target.value)}
                  className="w-full text-xs p-1.5 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden"
                >
                  <option value="VIP">VIP Elite Customer</option>
                  <option value="WHOLESALE">Wholesale Partner</option>
                  <option value="RETAIL">Retail Walk-in</option>
                  <option value="B2B">Corporate B2B</option>
                  <option value="EMPLOYEE">Staff / Employee</option>
                </select>
              </div>
            </div>

            {/* Product Preset / Inventory Item */}
            <div>
              <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">
                Select Inventory Product
              </label>
              <select
                value={sku}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full text-xs p-1.5 rounded-md border border-neutral-200 bg-neutral-50 focus:outline-hidden font-medium"
              >
                {metadata?.products?.map((p: any) => (
                  <option key={p.id} value={p.sku}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Physical Attributes (Weights & Carats) */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">
                  Net Weight (g)
                </label>
                <input
                  type="number"
                  step="any"
                  value={netWeight}
                  onChange={(e) => setNetWeight(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono p-1.5 rounded-md border border-neutral-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">
                  Gross Wt (g)
                </label>
                <input
                  type="number"
                  step="any"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono p-1.5 rounded-md border border-neutral-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-xs font-mono p-1.5 rounded-md border border-neutral-200 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Metal & Category Tags */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                <span className="text-[10px] text-neutral-400 font-mono">Metal:</span>
                <span className="font-semibold text-neutral-800">{metalCode} ({purityCode})</span>
              </div>
              <div className="p-2 rounded bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                <span className="text-[10px] text-neutral-400 font-mono">Item Gross:</span>
                <span className="font-mono font-bold text-neutral-900">₹{calculateGross().toLocaleString()}</span>
              </div>
            </div>

            {/* Price Component Breakdown Inputs */}
            <div className="pt-2 border-t border-neutral-100 space-y-2">
              <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                Price Components (Pricing Engine Output)
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-neutral-500 font-mono">Metal Value (₹)</label>
                  <input
                    type="number"
                    value={metalValue}
                    onChange={(e) => setMetalValue(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono p-1.5 rounded-md border border-neutral-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-neutral-500 font-mono">Making Charge (₹)</label>
                  <input
                    type="number"
                    value={makingCharge}
                    onChange={(e) => setMakingCharge(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono p-1.5 rounded-md border border-neutral-200 bg-white font-semibold text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-neutral-500 font-mono">Wastage Charge (₹)</label>
                  <input
                    type="number"
                    value={wastage}
                    onChange={(e) => setWastage(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono p-1.5 rounded-md border border-neutral-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-neutral-500 font-mono">Stone Value (₹)</label>
                  <input
                    type="number"
                    value={stoneValue}
                    onChange={(e) => setStoneValue(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono p-1.5 rounded-md border border-neutral-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-neutral-500 font-mono">Hallmark (₹)</label>
                  <input
                    type="number"
                    value={hallmarkCharge}
                    onChange={(e) => setHallmarkCharge(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono p-1.5 rounded-md border border-neutral-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-neutral-500 font-mono">Bill Gross Override</label>
                  <input
                    type="number"
                    placeholder="Auto sum"
                    value={billValueOverride}
                    onChange={(e) => setBillValueOverride(e.target.value ? parseFloat(e.target.value) : "")}
                    className="w-full text-xs font-mono p-1.5 rounded-md border border-neutral-200 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Run Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={calculating}
                className="w-full py-2.5 rounded-md bg-black text-white hover:bg-neutral-800 text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-xs disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white text-[#D4AF37]" />
                <span>{calculating ? "Evaluating Rules..." : "CALCULATE DISCOUNT"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Output, Breakdown & Calculation Trace (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs overflow-hidden">
              {/* Top Banner KPI */}
              <div className="p-5 bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    Engine Output Summary
                  </span>
                  <div className="text-3xl font-bold font-mono tracking-tight mt-1 flex items-baseline gap-2">
                    ₹{result.totalFinalAmount?.toLocaleString()}
                    <span className="text-xs font-normal text-neutral-400">Final Payable</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 border-t sm:border-t-0 sm:border-l border-neutral-800 pt-3 sm:pt-0 sm:pl-4">
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase font-mono">Total Savings</div>
                    <div className="text-xl font-bold font-mono text-emerald-400">
                      -₹{result.totalDiscountAmount?.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase font-mono">Gross Total</div>
                    <div className="text-sm font-bold font-mono text-neutral-300">
                      ₹{result.totalGrossAmount?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Pills Bar */}
              <div className="px-5 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center gap-1.5 text-neutral-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{result.appliedRules?.length || 0} Rule(s) Applied</span>
                  </span>

                  {result.approvalRequired ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-semibold font-mono">
                      <ShieldAlert className="w-3 h-3 text-amber-700" />
                      Approval Required
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-semibold font-mono">
                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                      Within Authority
                    </span>
                  )}
                </div>

                {result.conflicts?.length > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-900 text-[10px] font-bold font-mono">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    CONFLICT DETECTED ({result.conflicts.length})
                  </span>
                )}
              </div>

              {/* Conflict Alert Warning Box */}
              {result.conflicts?.length > 0 && (
                <div className="p-4 bg-red-50/70 border-b border-red-200 space-y-1.5">
                  <div className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    Rule Priority Conflict Detected
                  </div>
                  {result.conflicts.map((conf: any, i: number) => (
                    <div key={i} className="text-xs text-red-700 pl-5">
                      {conf.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-neutral-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("BREAKDOWN")}
                  className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-all ${
                    activeTab === "BREAKDOWN"
                      ? "border-black text-black font-semibold"
                      : "border-transparent text-neutral-500 hover:text-black"
                  }`}
                >
                  Component Breakdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("TRACE")}
                  className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-all ${
                    activeTab === "TRACE"
                      ? "border-black text-black font-semibold"
                      : "border-transparent text-neutral-500 hover:text-black"
                  }`}
                >
                  Calculation Trace ({result.calculationTrace?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("APPLICABLE")}
                  className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-all ${
                    activeTab === "APPLICABLE"
                      ? "border-black text-black font-semibold"
                      : "border-transparent text-neutral-500 hover:text-black"
                  }`}
                >
                  Rules Evaluated ({result.applicableRules?.length || 0})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-5">
                {activeTab === "BREAKDOWN" && (
                  <div className="space-y-4">
                    {/* Applied Rules Summary Pill List */}
                    {result.appliedRules?.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                          Winning Applied Rules
                        </div>
                        <div className="space-y-1.5">
                          {result.appliedRules.map((ar: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-md bg-neutral-50 border border-neutral-200/80 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black text-white font-semibold">
                                  {ar.ruleCode}
                                </span>
                                <div>
                                  <div className="font-medium text-neutral-900">{ar.ruleName}</div>
                                  <div className="text-[10px] text-neutral-400 font-mono">
                                    Target: {ar.component} • Priority: {ar.priority}
                                  </div>
                                </div>
                              </div>

                              <div className="font-mono font-bold text-emerald-600">
                                -₹{ar.discountAmount?.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-md bg-neutral-50 text-neutral-500 text-xs text-center">
                        No discount rules met eligibility criteria for this transaction context.
                      </div>
                    )}

                    {/* Component-Level Table */}
                    <div>
                      <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                        Component-Level Isolation
                      </div>
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                            <th className="py-2 px-3">Price Component</th>
                            <th className="py-2 px-3 text-right">Original Value</th>
                            <th className="py-2 px-3 text-right">Discount Amount</th>
                            <th className="py-2 px-3 text-right">Final Component Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-mono">
                          {/* Metal Value */}
                          <tr>
                            <td className="py-2.5 px-3 font-sans font-medium text-neutral-800">
                              Metal Value ({metalCode})
                            </td>
                            <td className="py-2.5 px-3 text-right text-neutral-600">
                              ₹{metalValue.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                              {result.discountByComponent?.METAL_VALUE || result.discountByComponent?.GOLD_VALUE || result.discountByComponent?.SILVER_VALUE
                                ? `-₹${(result.discountByComponent?.METAL_VALUE || result.discountByComponent?.GOLD_VALUE || result.discountByComponent?.SILVER_VALUE).toLocaleString()}`
                                : "₹0"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                              ₹{(
                                metalValue -
                                (result.discountByComponent?.METAL_VALUE || result.discountByComponent?.GOLD_VALUE || result.discountByComponent?.SILVER_VALUE || 0)
                              ).toLocaleString()}
                            </td>
                          </tr>

                          {/* Making Charge */}
                          <tr className="bg-neutral-50/40">
                            <td className="py-2.5 px-3 font-sans font-medium text-neutral-800">
                              Making Charge
                            </td>
                            <td className="py-2.5 px-3 text-right text-neutral-600">
                              ₹{makingCharge.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                              {result.discountByComponent?.MAKING_CHARGE
                                ? `-₹${result.discountByComponent.MAKING_CHARGE.toLocaleString()}`
                                : "₹0"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                              ₹{(makingCharge - (result.discountByComponent?.MAKING_CHARGE || 0)).toLocaleString()}
                            </td>
                          </tr>

                          {/* Wastage */}
                          <tr>
                            <td className="py-2.5 px-3 font-sans font-medium text-neutral-800">
                              Wastage
                            </td>
                            <td className="py-2.5 px-3 text-right text-neutral-600">
                              ₹{wastage.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                              {result.discountByComponent?.WASTAGE
                                ? `-₹${result.discountByComponent.WASTAGE.toLocaleString()}`
                                : "₹0"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                              ₹{(wastage - (result.discountByComponent?.WASTAGE || 0)).toLocaleString()}
                            </td>
                          </tr>

                          {/* Stone Value */}
                          {stoneValue > 0 && (
                            <tr>
                              <td className="py-2.5 px-3 font-sans font-medium text-neutral-800">
                                Stone Value
                              </td>
                              <td className="py-2.5 px-3 text-right text-neutral-600">
                                ₹{stoneValue.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                                {result.discountByComponent?.STONE_VALUE
                                  ? `-₹${result.discountByComponent.STONE_VALUE.toLocaleString()}`
                                  : "₹0"}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                                ₹{(stoneValue - (result.discountByComponent?.STONE_VALUE || 0)).toLocaleString()}
                              </td>
                            </tr>
                          )}

                          {/* Hallmark */}
                          {hallmarkCharge > 0 && (
                            <tr>
                              <td className="py-2.5 px-3 font-sans font-medium text-neutral-800">
                                Hallmark Charge
                              </td>
                              <td className="py-2.5 px-3 text-right text-neutral-600">
                                ₹{hallmarkCharge.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                                ₹0
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                                ₹{hallmarkCharge.toLocaleString()}
                              </td>
                            </tr>
                          )}

                          {/* Entire Bill Level */}
                          {result.billDiscount > 0 && (
                            <tr className="bg-amber-50/50">
                              <td className="py-2.5 px-3 font-sans font-medium text-amber-900">
                                Bill-Level Discount
                              </td>
                              <td className="py-2.5 px-3 text-right text-neutral-600">
                                Invoice
                              </td>
                              <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                                -₹{result.billDiscount.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                                Applied on Invoice
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Calculation Trace Tab */}
                {activeTab === "TRACE" && (
                  <div className="space-y-3">
                    <div className="text-[10px] text-neutral-400 font-mono mb-2">
                      Sequential Execution Pipeline: Discovery → Eligibility → Matching → Conditions → Priority → Stacking → Authority
                    </div>

                    <div className="space-y-2">
                      {result.calculationTrace?.map((step: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-md border text-xs ${
                            step.passed
                              ? "bg-white border-neutral-200"
                              : "bg-neutral-50/80 border-neutral-200/80 text-neutral-500"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700 font-semibold">
                              {step.step}
                            </span>
                            {step.ruleCode && (
                              <span className="font-mono text-[10px] text-neutral-500 font-medium">
                                {step.ruleCode}
                              </span>
                            )}
                          </div>
                          <div className={`text-[11px] ${step.passed ? "text-neutral-900" : "text-neutral-500"}`}>
                            {step.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Applicable Rules Report Tab */}
                {activeTab === "APPLICABLE" && (
                  <div className="space-y-2">
                    {result.applicableRules?.map((r: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-md bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black text-white font-semibold">
                              {r.ruleCode}
                            </span>
                            <span className="font-medium text-neutral-900">{r.ruleName}</span>
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            Priority: {r.priority} • {r.reason}
                          </div>
                        </div>

                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold ${
                            r.matched
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-neutral-200 text-neutral-600"
                          }`}
                        >
                          {r.matched ? "MATCHED" : "UNMATCHED"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[420px] bg-white rounded-lg border border-dashed border-neutral-300 flex flex-col items-center justify-center p-8 text-center">
              <FlaskConical className="w-10 h-10 text-neutral-300 mb-3" />
              <div className="text-sm font-semibold text-neutral-800">
                Simulator Awaiting Input
              </div>
              <p className="text-xs text-neutral-400 max-w-sm mt-1">
                Select a preset above or configure customer, item, and price components on the left, then click{" "}
                <span className="font-semibold text-neutral-700">Calculate Discount</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RuleSimulatorPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-xs text-neutral-400">
          Loading Rule Simulator...
        </div>
      }
    >
      <RuleSimulatorContent />
    </Suspense>
  );
}
