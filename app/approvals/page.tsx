"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Eye,
  AlertCircle,
  FileText,
  User,
  Calendar,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/approvals?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/approvals/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: comment || (action === "approve" ? "Approved by manager" : "Rejected by manager") }),
      });

      if (res.ok) {
        setMsg(`Request ${action === "approve" ? "APPROVED" : "REJECTED"} successfully!`);
        setSelectedRequest(null);
        setComment("");
        fetchRequests();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="pb-3 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Manager Approval Queue
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Review, authorize, or reject exceptional discount requests that exceed frontline staff authority thresholds.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              statusFilter === "PENDING"
                ? "bg-white text-black font-semibold shadow-2xs"
                : "text-neutral-500 hover:text-black"
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              statusFilter === "APPROVED"
                ? "bg-white text-black font-semibold shadow-2xs"
                : "text-neutral-500 hover:text-black"
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("REJECTED")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              statusFilter === "REJECTED"
                ? "bg-white text-black font-semibold shadow-2xs"
                : "text-neutral-500 hover:text-black"
            }`}
          >
            Rejected
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              statusFilter === "ALL"
                ? "bg-white text-black font-semibold shadow-2xs"
                : "text-neutral-500 hover:text-black"
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {msg}
          </span>
          <button type="button" onClick={() => setMsg("")} className="text-emerald-700 hover:text-black">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                <th className="py-2.5 px-3">Request Code</th>
                <th className="py-2.5 px-3">Requested By</th>
                <th className="py-2.5 px-3">Discount Details</th>
                <th className="py-2.5 px-3">User Allowed Limit</th>
                <th className="py-2.5 px-3">Reason / Justification</th>
                <th className="py-2.5 px-3">Submitted At</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-neutral-400">
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-neutral-400">
                    No approval requests found for this filter.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-neutral-900 whitespace-nowrap">
                      {req.requestCode}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-medium text-neutral-900">{req.requestedBy?.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {req.requestedBy?.role?.name}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-amber-700">
                        {req.requestedDiscountPercent.toFixed(1)}% (₹{req.requestedDiscountAmount.toLocaleString()})
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-neutral-600 whitespace-nowrap">
                      {req.userAllowedPercent}% (Max ₹{req.userAllowedAmount.toLocaleString()})
                    </td>

                    <td className="py-3 px-3 max-w-[220px]">
                      <span className="truncate block text-neutral-700" title={req.reason}>
                        {req.reason}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-neutral-500 whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString()}{" "}
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                          req.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : req.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(req)}
                          className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-medium"
                        >
                          Review Modal
                        </button>

                        {req.status === "PENDING" && user?.canApprove && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAction(req.id, "approve")}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium shadow-2xs"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(req.id, "reject")}
                              className="px-2 py-1 rounded bg-neutral-200 hover:bg-red-100 text-neutral-700 hover:text-red-700 text-[11px] font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal Dialog */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Review Approval Request — {selectedRequest.requestCode}
                </h3>
                <p className="text-[10px] text-neutral-400">
                  Requested by {selectedRequest.requestedBy?.name} ({selectedRequest.requestedBy?.role?.name})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Comparison Matrix */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-mono">Requested Discount</div>
                  <div className="text-base font-bold font-mono text-amber-700">
                    {selectedRequest.requestedDiscountPercent.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    ₹{selectedRequest.requestedDiscountAmount?.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-mono">Staff Authority Limit</div>
                  <div className="text-base font-bold font-mono text-neutral-700">
                    {selectedRequest.userAllowedPercent}%
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    Max ₹{selectedRequest.userAllowedAmount?.toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase font-mono block mb-1">
                  Reason for Exception
                </span>
                <div className="p-2.5 rounded-md bg-neutral-100/70 border border-neutral-200 text-neutral-800">
                  {selectedRequest.reason}
                </div>
              </div>

              {/* Reviewer Comment Field */}
              {selectedRequest.status === "PENDING" && (
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                    Manager Review Note / Sign-off Comment
                  </label>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="e.g. Approved special festive courtesy for long-time VIP patron"
                    className="w-full text-xs p-2 rounded-md border border-neutral-200 focus:outline-hidden"
                  />
                </div>
              )}

              {selectedRequest.reviewerComment && (
                <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200">
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase font-mono block">
                    Manager Decision Note
                  </span>
                  <p className="text-neutral-800 mt-0.5">{selectedRequest.reviewerComment}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-3 py-1.5 rounded-md border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-white"
              >
                Close
              </button>

              {selectedRequest.status === "PENDING" && user?.canApprove && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAction(selectedRequest.id, "reject")}
                    className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
                  >
                    Reject Request
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAction(selectedRequest.id, "approve")}
                    className="px-4 py-1.5 rounded-md bg-black text-white hover:bg-neutral-800 text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Approve & Apply</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
