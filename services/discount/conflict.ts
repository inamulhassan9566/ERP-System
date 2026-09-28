import { ComponentType } from "@prisma/client";
import { ConflictInfo, TraceStep } from "@/lib/types";
import { RuleWithDetails } from "./matcher";

export interface CandidateRuleApplication {
  rule: RuleWithDetails;
  componentType: ComponentType;
  calculationMethod: any;
  discountValue: number;
  weightBasis: any;
  calculatedAmount: number;
  priority: number;
  stackable: boolean;
  stackingMethod: any;
  limits?: any;
  itemId?: string;
  itemSku?: string;
}

export function detectRuleConflicts(
  candidates: CandidateRuleApplication[],
  trace: TraceStep[]
): {
  conflicts: ConflictInfo[];
  filteredCandidates: CandidateRuleApplication[];
} {
  const conflicts: ConflictInfo[] = [];

  // Group candidates by target item and component
  const groups = new Map<string, CandidateRuleApplication[]>();

  for (const c of candidates) {
    const key = `${c.itemId || "GLOBAL"}_${c.componentType}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(c);
  }

  const filteredCandidates: CandidateRuleApplication[] = [];

  for (const [key, group] of Array.from(groups.entries())) {
    if (group.length <= 1) {
      filteredCandidates.push(...group);
      continue;
    }

    // Sort by priority descending
    group.sort((a, b) => b.priority - a.priority);

    // Check if the top candidates have equal priority
    const highestPriority = group[0].priority;
    const samePriorityCandidates = group.filter((r) => r.priority === highestPriority);

    // If more than one candidate has the highest priority AND any of them is not stackable, or they have conflicting values:
    const hasNonStackable = samePriorityCandidates.some((r) => !r.stackable);

    if (samePriorityCandidates.length > 1 && hasNonStackable) {
      const ruleCodes = samePriorityCandidates.map((r) => r.rule.code);
      const conflictMsg = `Conflict detected on component '${group[0].componentType}'${group[0].itemSku ? ` for item ${group[0].itemSku}` : ""}: Rules [${ruleCodes.join(", ")}] have the same priority (${highestPriority}) and cannot safely be stacked. Manual resolution or priority differentiation required.`;

      conflicts.push({
        ruleIds: samePriorityCandidates.map((r) => r.rule.id),
        ruleCodes,
        component: group[0].componentType,
        itemId: group[0].itemId,
        priority: highestPriority,
        message: conflictMsg,
        resolved: false,
        resolutionNote: "Neither rule automatically applied to prevent unexpected discount application.",
      });

      trace.push({
        step: "PRIORITY_EVAL",
        ruleCode: ruleCodes.join(", "),
        passed: false,
        detail: conflictMsg,
      });

      // To prevent silently choosing one, do not include unresolved conflicted rules
      continue;
    }

    filteredCandidates.push(...group);
  }

  return { conflicts, filteredCandidates };
}
