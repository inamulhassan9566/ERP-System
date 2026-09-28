"use client";

import React, { useEffect, useState } from "react";
import {
  History,
  Search,
  Filter,
  Eye,
  X,
  FileText,
  Calendar,
  User,
  Shield,
  Tag,
  ArrowRight,
} from "lucide-react";

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"TRANSACTIONS" | "SYSTEM_EVENTS">("TRANSACTIONS");
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (entityFilter !== "ALL") params.set("entityType", entityFilter);
      if (actionFilter !== "ALL") params.set("action", actionFilter);

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setApplications(data.applications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [entityFilter, actionFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="pb-3 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Audit Trail & Regulatory Compliance
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Immutable transaction records, historical rule versions, manual exceptions, and managerial approvals.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs">
          <button
            type="button"
            onClick={() => setTab("TRANSACTIONS")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              tab === "TRANSACTIONS"
                ? "bg-white text-black font-semibold shadow-2xs"
                : "text-neutral-500 hover:text-black"
            }`}
          >
            Discount Invoices ({applications.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("SYSTEM_EVENTS")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              tab === "SYSTEM_EVENTS"
                ? "bg-white text-black font-semibold shadow-2xs"
                : "text-neutral-500 hover:text-black"
            }`}
          >
            System Action Log ({logs.length})
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-neutral-200 shadow-2xs">
        <form onSubmit={handleSearch} className="flex-1 flex items-center relative w-full">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by transaction number, staff, or details..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-neutral-200 focus:outline-hidden"
          />
        </form>

        {tab === "SYSTEM_EVENTS" && (
          <div className="flex items-center gap-2">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="text-xs py-1.5 px-2 rounded-md border border-neutral-200 bg-neutral-50"
            >
              <option value="ALL">All Entity Types</option>
              <option value="RULE">RULE</option>
              <option value="APPROVAL">APPROVAL</option>
              <option value="MANUAL_DISCOUNT">MANUAL_DISCOUNT</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs py-1.5 px-2 rounded-md border border-neutral-200 bg-neutral-50"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="ACTIVATE">ACTIVATE</option>
              <option value="DEACTIVATE">DEACTIVATE</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
              <option value="APPLY">APPLY</option>
            </select>
          </div>
        )}
      </div>

      {/* Content Table */}
      {tab === "TRANSACTIONS" ? (
        <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Cashier / Staff</th>
                  <th className="py-2.5 px-3 text-right">Gross Total</th>
                  <th className="py-2.5 px-3 text-right">Discount Applied</th>
                  <th className="py-2.5 px-3 text-right">Net Payable</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-neutral-900 whitespace-nowrap">
                      {app.transactionNumber}
                    </td>

                    <td className="py-3 px-3 font-sans text-neutral-700 whitespace-nowrap">
                      {app.customer?.name || "Walk-in Patron"}
                    </td>

                    <td className="py-3 px-3 font-sans text-neutral-700 whitespace-nowrap">
                      {app.user?.name}
                    </td>

                    <td className="py-3 px-3 text-right text-neutral-600">
                      ₹{app.totalGrossAmount?.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-emerald-600">
                      -₹{app.totalDiscountAmount?.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-neutral-900">
                      ₹{app.totalFinalAmount?.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 font-sans whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                          app.isManual
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {app.isManual ? "Manual" : "Engine Rule"}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-neutral-500 whitespace-nowrap">
                      {new Date(app.createdAt).toLocaleDateString()}{" "}
                      {new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedItem({ type: "APPLICATION", data: app })}
                        className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-sans font-medium"
                      >
                        Inspect Trace
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                  <th className="py-2.5 px-3">Event ID</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Details / Snapshot</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono text-[10px] text-neutral-400">
                      {log.id.slice(-8)}
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-neutral-800 whitespace-nowrap">
                      {log.entityType}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 font-semibold text-neutral-700">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-neutral-700 whitespace-nowrap font-medium">
                      {log.userName}
                    </td>

                    <td className="py-3 px-3 max-w-[320px]">
                      <span className="truncate block font-mono text-[10px] text-neutral-500" title={log.details}>
                        {log.details}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-neutral-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString()}{" "}
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspector Drawer Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-xl w-full overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Transaction Audit Inspector — {selectedItem.data.transactionNumber}
                </h3>
                <p className="text-[10px] text-neutral-400">
                  Cashier: {selectedItem.data.user?.name} • Customer: {selectedItem.data.customer?.name || "Walk-in"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-neutral-50 border border-neutral-200 font-mono">
                <div>
                  <span className="text-[9px] text-neutral-400 uppercase block">Gross Amount</span>
                  <span className="font-bold text-neutral-900">₹{selectedItem.data.totalGrossAmount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 uppercase block">Total Discount</span>
                  <span className="font-bold text-emerald-600">-₹{selectedItem.data.totalDiscountAmount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 uppercase block">Final Amount</span>
                  <span className="font-bold text-neutral-900">₹{selectedItem.data.totalFinalAmount?.toLocaleString()}</span>
                </div>
              </div>

              {selectedItem.data.appliedComponents?.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase font-mono block mb-2">
                    Component Isolation Log
                  </span>
                  <div className="rounded-md border border-neutral-200 overflow-hidden font-mono">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500">
                        <tr>
                          <th className="p-2">Component</th>
                          <th className="p-2 text-right">Original</th>
                          <th className="p-2 text-right">Discount</th>
                          <th className="p-2 text-right">Final</th>
                          <th className="p-2 text-right">Rule Version</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {selectedItem.data.appliedComponents.map((c: any) => (
                          <tr key={c.id}>
                            <td className="p-2 font-sans font-medium">{c.componentType}</td>
                            <td className="p-2 text-right">₹{c.originalValue?.toLocaleString()}</td>
                            <td className="p-2 text-right text-emerald-600 font-semibold">-₹{c.discountAmount?.toLocaleString()}</td>
                            <td className="p-2 text-right font-bold">₹{c.finalValue?.toLocaleString()}</td>
                            <td className="p-2 text-right">v{c.ruleVersionNumber || 1}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Raw Calculation Trace Payload */}
              <div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase font-mono block mb-1">
                  Calculation Trace Payload
                </span>
                <pre className="p-3 bg-neutral-900 text-neutral-200 rounded-md font-mono text-[10px] overflow-x-auto">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedItem.data.calculationTrace), null, 2);
                    } catch {
                      return selectedItem.data.calculationTrace;
                    }
                  })()}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 border-t border-neutral-200 text-right">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1.5 rounded-md bg-black text-white text-xs font-medium"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
