"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GitBranch,
  Layers,
  Calendar,
  User,
  ArrowRight,
  Eye,
  FileCode,
  CheckCircle2,
  X,
} from "lucide-react";

export default function RuleVersionsPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);

  useEffect(() => {
    fetch("/api/discount-rules")
      .then((res) => res.json())
      .then((data) => {
        const rList = data.rules || [];
        setRules(rList);
        if (rList.length > 0) {
          loadRuleVersions(rList[0]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const loadRuleVersions = async (rule: any) => {
    setSelectedRule(rule);
    try {
      const res = await fetch(`/api/discount-rules/${rule.id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="pb-3 border-b border-neutral-200">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900">
          Rule Versioning & Audit History
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Enterprise immutable version logs. Rule modifications generate new version snapshots, ensuring past transactions are never altered.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rule Selector (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
            Select Discount Rule ({rules.length})
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {rules.map((rule) => {
              const isSelected = selectedRule?.id === rule.id;
              return (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => loadRuleVersions(rule)}
                  className={`w-full p-3 rounded-lg border text-left text-xs transition-all ${
                    isSelected
                      ? "bg-neutral-900 text-white border-black shadow-xs"
                      : "bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        isSelected ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {rule.code}
                    </span>
                    <span
                      className={`text-[10px] font-mono ${
                        isSelected ? "text-neutral-400" : "text-neutral-500"
                      }`}
                    >
                      Current: v{rule.currentVersion}
                    </span>
                  </div>

                  <div className="font-semibold truncate">{rule.name}</div>
                  <div
                    className={`text-[10px] truncate mt-0.5 ${
                      isSelected ? "text-neutral-400" : "text-neutral-500"
                    }`}
                  >
                    Priority {rule.priority} • {rule.status}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Version History Timeline & Inspection (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedRule ? (
            <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-100 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-black text-white font-bold">
                      {selectedRule.code}
                    </span>
                    <span className="font-mono text-xs text-neutral-400">
                      Total Versions Recorded: {versions.length}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-neutral-900 mt-1">{selectedRule.name}</h2>
                </div>

                <Link
                  href={`/rule-builder?editId=${selectedRule.id}`}
                  className="px-3 py-1.5 rounded-md bg-black text-white hover:bg-neutral-800 text-xs font-medium self-start sm:self-auto"
                >
                  Upgrade to v{selectedRule.currentVersion + 1}
                </Link>
              </div>

              {/* Timeline */}
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                {versions.map((ver, idx) => {
                  const isCurrent = ver.versionNumber === selectedRule.currentVersion;
                  return (
                    <div key={ver.id} className="relative pl-8">
                      <div
                        className={`absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                          isCurrent
                            ? "border-black ring-2 ring-black/10"
                            : "border-neutral-400"
                        }`}
                      ></div>

                      <div className="p-4 rounded-lg bg-neutral-50/70 border border-neutral-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs text-neutral-900">
                              Version {ver.versionNumber}
                            </span>
                            {isCurrent && (
                              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-semibold">
                                CURRENT ACTIVE VERSION
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {new Date(ver.createdAt).toLocaleDateString()}{" "}
                            {new Date(ver.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-800 font-medium">{ver.changeSummary}</p>

                        <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-2 border-t border-neutral-200/60 font-mono">
                          <span>Committed by: {ver.changedBy?.name || "System"}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedSnapshot(ver)}
                            className="text-neutral-900 font-medium hover:underline flex items-center gap-1"
                          >
                            <FileCode className="w-3 h-3" />
                            <span>Inspect Snapshot JSON</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-neutral-400">
              Select a rule from the left to view version logs.
            </div>
          )}
        </div>
      </div>

      {/* Snapshot Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-xl w-full overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Version {selectedSnapshot.versionNumber} Snapshot Payload
                </h3>
                <p className="text-[10px] text-neutral-400">
                  Committed by {selectedSnapshot.changedBy?.name || "System Admin"} on {new Date(selectedSnapshot.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSnapshot(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <pre className="p-3 bg-neutral-900 text-neutral-200 rounded-md font-mono text-[10px] overflow-x-auto">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedSnapshot.snapshot), null, 2);
                  } catch {
                    return selectedSnapshot.snapshot;
                  }
                })()}
              </pre>
            </div>

            <div className="p-3 bg-neutral-50 border-t border-neutral-200 text-right">
              <button
                type="button"
                onClick={() => setSelectedSnapshot(null)}
                className="px-3 py-1.5 rounded-md bg-black text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
