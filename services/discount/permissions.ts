import { TransactionContext, TraceStep } from "@/lib/types";

export interface PermissionEvaluationResult {
  approvalRequired: boolean;
  approvalReason?: string;
  approvalDetails?: {
    requestedAmount: number;
    requestedPercent: number;
    allowedPercent: number;
    allowedAmount: number;
    violatingComponents?: string[];
  };
}

export function evaluateDiscountPermissions(
  context: TransactionContext,
  totalDiscountAmount: number,
  totalGrossAmount: number,
  ruleExplicitApproval: boolean,
  violatingRules: string[],
  trace: TraceStep[]
): PermissionEvaluationResult {
  // If a rule explicitly flagged approval required
  if (ruleExplicitApproval) {
    const reason = `Rule configuration explicitly requires manager approval (${violatingRules.join(", ")}).`;
    trace.push({
      step: "PERMISSION_CHECK",
      passed: false,
      detail: reason,
    });
    return {
      approvalRequired: true,
      approvalReason: reason,
      approvalDetails: {
        requestedAmount: totalDiscountAmount,
        requestedPercent: totalGrossAmount > 0 ? (totalDiscountAmount / totalGrossAmount) * 100 : 0,
        allowedPercent: context.userMaxDiscountPercent ?? 10,
        allowedAmount: context.userMaxDiscountAmount ?? 10000,
        violatingComponents: violatingRules,
      },
    };
  }

  // Admin users bypass all limits
  if (context.userRoleCode === "ADMIN") {
    trace.push({
      step: "PERMISSION_CHECK",
      passed: true,
      detail: `User has ADMIN role. Full discount authority granted.`,
    });
    return { approvalRequired: false };
  }

  const effectiveGross = totalGrossAmount > 0 ? totalGrossAmount : 1;
  const overallDiscountPercent = (totalDiscountAmount / effectiveGross) * 100;
  const maxAllowedPercent = context.userMaxDiscountPercent ?? 10;
  const maxAllowedAmount = context.userMaxDiscountAmount ?? 10000;

  // 1. Check percentage limit
  if (overallDiscountPercent > maxAllowedPercent) {
    const reason = `Total discount of ${overallDiscountPercent.toFixed(1)}% exceeds user authority limit of ${maxAllowedPercent}%. Manager approval required.`;
    trace.push({
      step: "PERMISSION_CHECK",
      passed: false,
      detail: reason,
    });
    return {
      approvalRequired: true,
      approvalReason: reason,
      approvalDetails: {
        requestedAmount: totalDiscountAmount,
        requestedPercent: overallDiscountPercent,
        allowedPercent: maxAllowedPercent,
        allowedAmount: maxAllowedAmount,
      },
    };
  }

  // 2. Check absolute amount limit
  if (totalDiscountAmount > maxAllowedAmount) {
    const reason = `Total discount amount of ₹${totalDiscountAmount.toLocaleString()} exceeds user authority limit of ₹${maxAllowedAmount.toLocaleString()}. Manager approval required.`;
    trace.push({
      step: "PERMISSION_CHECK",
      passed: false,
      detail: reason,
    });
    return {
      approvalRequired: true,
      approvalReason: reason,
      approvalDetails: {
        requestedAmount: totalDiscountAmount,
        requestedPercent: overallDiscountPercent,
        allowedPercent: maxAllowedPercent,
        allowedAmount: maxAllowedAmount,
      },
    };
  }

  trace.push({
    step: "PERMISSION_CHECK",
    passed: true,
    detail: `Discount of ₹${totalDiscountAmount.toLocaleString()} (${overallDiscountPercent.toFixed(1)}%) is within user authority limit (${maxAllowedPercent}%, ₹${maxAllowedAmount.toLocaleString()}).`,
  });

  return { approvalRequired: false };
}
