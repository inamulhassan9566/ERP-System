import { StackingMethod, CalculationMethod } from "@prisma/client";
import { CandidateRuleApplication } from "./conflict";
import { computeRawDiscountAmount, applyLimits } from "./calculator";
import { TraceStep } from "@/lib/types";

export interface StackingResult {
  appliedRules: {
    ruleId: string;
    ruleCode: string;
    ruleName: string;
    ruleVersion: number;
    method: CalculationMethod;
    rateOrValue: number;
    discountAmount: number;
  }[];
  totalDiscount: number;
  finalValue: number;
}

export function resolveStacking(
  candidates: CandidateRuleApplication[],
  originalValue: number,
  item: any,
  trace: TraceStep[]
): StackingResult {
  if (candidates.length === 0 || originalValue <= 0) {
    return { appliedRules: [], totalDiscount: 0, finalValue: originalValue };
  }

  // If only 1 rule, simple application
  if (candidates.length === 1) {
    const c = candidates[0];
    const rawDiscount = computeRawDiscountAmount(c.calculationMethod, c.discountValue, originalValue, item, c.weightBasis);
    const { finalDiscount, capReason } = applyLimits(rawDiscount, originalValue, c.limits);

    if (capReason) {
      trace.push({
        step: "LIMITS_CHECK",
        ruleCode: c.rule.code,
        ruleName: c.rule.name,
        passed: true,
        detail: capReason,
      });
    }

    trace.push({
      step: "CALCULATION",
      ruleCode: c.rule.code,
      ruleName: c.rule.name,
      passed: true,
      detail: `Applied ${c.rule.name}: Original ₹${originalValue.toLocaleString()} -> Discount ₹${finalDiscount.toLocaleString()} (${c.calculationMethod} ${c.discountValue}).`,
    });

    return {
      appliedRules: [
        {
          ruleId: c.rule.id,
          ruleCode: c.rule.code,
          ruleName: c.rule.name,
          ruleVersion: c.rule.currentVersion || 1,
          method: c.calculationMethod,
          rateOrValue: c.discountValue,
          discountAmount: finalDiscount,
        },
      ],
      totalDiscount: finalDiscount,
      finalValue: Math.max(0, originalValue - finalDiscount),
    };
  }

  // Sort by priority descending
  candidates.sort((a, b) => b.priority - a.priority);

  // Check top candidate's stacking method
  const primaryMethod = candidates[0].stackingMethod;

  // Case 1: HIGHEST APPLICABLE
  if (primaryMethod === StackingMethod.HIGHEST || candidates.some((c) => !c.stackable)) {
    let bestCandidate = candidates[0];
    let maxDiscount = 0;

    for (const c of candidates) {
      const raw = computeRawDiscountAmount(c.calculationMethod, c.discountValue, originalValue, item, c.weightBasis);
      const { finalDiscount } = applyLimits(raw, originalValue, c.limits);
      if (finalDiscount > maxDiscount) {
        maxDiscount = finalDiscount;
        bestCandidate = c;
      }
    }

    trace.push({
      step: "STACKING_EVAL",
      ruleCode: bestCandidate.rule.code,
      ruleName: bestCandidate.rule.name,
      passed: true,
      detail: `Stacking mode HIGHEST selected rule ${bestCandidate.rule.code} (yielding ₹${maxDiscount.toLocaleString()}) among ${candidates.length} candidate rules.`,
    });

    return {
      appliedRules: [
        {
          ruleId: bestCandidate.rule.id,
          ruleCode: bestCandidate.rule.code,
          ruleName: bestCandidate.rule.name,
          ruleVersion: bestCandidate.rule.currentVersion || 1,
          method: bestCandidate.calculationMethod,
          rateOrValue: bestCandidate.discountValue,
          discountAmount: maxDiscount,
        },
      ],
      totalDiscount: maxDiscount,
      finalValue: Math.max(0, originalValue - maxDiscount),
    };
  }

  // Case 2: SEQUENTIAL
  if (primaryMethod === StackingMethod.SEQUENTIAL) {
    let remainingValue = originalValue;
    let totalDiscount = 0;
    const applied: any[] = [];

    for (const c of candidates) {
      if (remainingValue <= 0) break;

      const raw = computeRawDiscountAmount(c.calculationMethod, c.discountValue, remainingValue, item, c.weightBasis);
      const { finalDiscount } = applyLimits(raw, remainingValue, c.limits);

      applied.push({
        ruleId: c.rule.id,
        ruleCode: c.rule.code,
        ruleName: c.rule.name,
        ruleVersion: c.rule.currentVersion || 1,
        method: c.calculationMethod,
        rateOrValue: c.discountValue,
        discountAmount: finalDiscount,
      });

      remainingValue = Math.max(0, remainingValue - finalDiscount);
      totalDiscount += finalDiscount;

      trace.push({
        step: "STACKING_EVAL",
        ruleCode: c.rule.code,
        ruleName: c.rule.name,
        passed: true,
        detail: `Sequential discount applied on remainder: ₹${finalDiscount.toLocaleString()}. Remaining balance: ₹${remainingValue.toLocaleString()}.`,
      });
    }

    return {
      appliedRules: applied,
      totalDiscount: Math.min(totalDiscount, originalValue),
      finalValue: Math.max(0, originalValue - totalDiscount),
    };
  }

  // Case 3: STACK (Additive with original value)
  let accumulatedDiscount = 0;
  const applied: any[] = [];

  for (const c of candidates) {
    const raw = computeRawDiscountAmount(c.calculationMethod, c.discountValue, originalValue, item, c.weightBasis);
    const { finalDiscount } = applyLimits(raw, originalValue, c.limits);

    // Ensure sum doesn't exceed original value
    const allowedAdd = Math.min(finalDiscount, originalValue - accumulatedDiscount);
    if (allowedAdd <= 0) continue;

    applied.push({
      ruleId: c.rule.id,
      ruleCode: c.rule.code,
      ruleName: c.rule.name,
      ruleVersion: c.rule.currentVersion || 1,
      method: c.calculationMethod,
      rateOrValue: c.discountValue,
      discountAmount: allowedAdd,
    });

    accumulatedDiscount += allowedAdd;

    trace.push({
      step: "STACKING_EVAL",
      ruleCode: c.rule.code,
      ruleName: c.rule.name,
      passed: true,
      detail: `Additive stacked discount: +₹${allowedAdd.toLocaleString()} (Total stacked: ₹${accumulatedDiscount.toLocaleString()}).`,
    });
  }

  return {
    appliedRules: applied,
    totalDiscount: accumulatedDiscount,
    finalValue: Math.max(0, originalValue - accumulatedDiscount),
  };
}
