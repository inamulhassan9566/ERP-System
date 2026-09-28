import { DiscountRule, DiscountRuleTarget, DiscountRuleCondition, CustomerTargetType, ProductTargetScope, RuleStatus } from "@prisma/client";
import { TransactionContext, TransactionItemInput, TraceStep } from "@/lib/types";

export type RuleWithDetails = DiscountRule & {
  target: DiscountRuleTarget | null;
  condition: DiscountRuleCondition | null;
  components: any[];
  versions?: any[];
};

export interface MatchResult {
  matched: boolean;
  reason: string;
  matchedItems: TransactionItemInput[];
}

export function evaluateRuleValidity(
  rule: RuleWithDetails,
  currentDate: Date,
  trace: TraceStep[]
): boolean {
  // 1. Status Check
  if (rule.status !== RuleStatus.ACTIVE) {
    trace.push({
      step: "ELIGIBILITY",
      ruleCode: rule.code,
      ruleName: rule.name,
      passed: false,
      detail: `Rule status is ${rule.status} (Inactive/Draft/Expired rules never apply).`,
    });
    return false;
  }

  // 2. Date Range Check
  const start = new Date(rule.startDate);
  if (currentDate < start) {
    trace.push({
      step: "ELIGIBILITY",
      ruleCode: rule.code,
      ruleName: rule.name,
      passed: false,
      detail: `Rule has not yet started (Effective from ${start.toISOString().split("T")[0]}).`,
    });
    return false;
  }

  if (rule.endDate) {
    const end = new Date(rule.endDate);
    // End of day
    end.setHours(23, 59, 59, 999);
    if (currentDate > end) {
      trace.push({
        step: "ELIGIBILITY",
        ruleCode: rule.code,
        ruleName: rule.name,
        passed: false,
        detail: `Rule expired on ${end.toISOString().split("T")[0]}.`,
      });
      return false;
    }
  }

  // 3. Time Check (if configured)
  if (rule.startTime && rule.endTime) {
    const hours = String(currentDate.getHours()).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${hours}:${minutes}`;
    if (currentTimeStr < rule.startTime || currentTimeStr > rule.endTime) {
      trace.push({
        step: "ELIGIBILITY",
        ruleCode: rule.code,
        ruleName: rule.name,
        passed: false,
        detail: `Rule applies only between ${rule.startTime} and ${rule.endTime}. Current time: ${currentTimeStr}.`,
      });
      return false;
    }
  }

  // 4. Days of Week Check (if configured)
  if (rule.daysOfWeek && rule.daysOfWeek !== "ALL") {
    const day = currentDate.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = day === 0 || day === 6;

    if (rule.daysOfWeek === "WEEKDAYS" && isWeekend) {
      trace.push({
        step: "ELIGIBILITY",
        ruleCode: rule.code,
        ruleName: rule.name,
        passed: false,
        detail: `Rule applies only on Weekdays. Today is day ${day}.`,
      });
      return false;
    }

    if (rule.daysOfWeek === "WEEKENDS" && !isWeekend) {
      trace.push({
        step: "ELIGIBILITY",
        ruleCode: rule.code,
        ruleName: rule.name,
        passed: false,
        detail: `Rule applies only on Weekends. Today is day ${day}.`,
      });
      return false;
    }

    if (rule.daysOfWeek.includes(",") || /^[0-6]$/.test(rule.daysOfWeek)) {
      const allowedDays = rule.daysOfWeek.split(",").map((s) => parseInt(s.trim(), 10));
      if (!allowedDays.includes(day)) {
        trace.push({
          step: "ELIGIBILITY",
          ruleCode: rule.code,
          ruleName: rule.name,
          passed: false,
          detail: `Rule applies on days [${rule.daysOfWeek}], but today is day ${day}.`,
        });
        return false;
      }
    }
  }

  return true;
}

export function evaluateCustomerEligibility(
  rule: RuleWithDetails,
  context: TransactionContext,
  trace: TraceStep[]
): boolean {
  const target = rule.target;
  if (!target) return true;

  // Branch check
  if (target.targetBranchId && context.branchId && target.targetBranchId !== context.branchId) {
    trace.push({
      step: "ELIGIBILITY",
      ruleCode: rule.code,
      ruleName: rule.name,
      passed: false,
      detail: `Branch mismatch: Rule requires branch ${target.targetBranchId}, transaction branch is ${context.branchId}.`,
    });
    return false;
  }

  // Sales Channel check
  if (target.targetSalesChannelId && context.salesChannelId && target.targetSalesChannelId !== context.salesChannelId) {
    trace.push({
      step: "ELIGIBILITY",
      ruleCode: rule.code,
      ruleName: rule.name,
      passed: false,
      detail: `Sales channel mismatch: Rule requires channel ${target.targetSalesChannelId}, transaction channel is ${context.salesChannelId}.`,
    });
    return false;
  }

  const cType = target.targetCustomerType;
  if (cType === CustomerTargetType.ALL) {
    trace.push({
      step: "ELIGIBILITY",
      ruleCode: rule.code,
      ruleName: rule.name,
      passed: true,
      detail: `Customer targeting: ALL customers eligible.`,
    });
    return true;
  }

  if (cType === CustomerTargetType.SPECIFIC_CUSTOMER) {
    const matched = !!context.customerId && context.customerId === target.targetCustomerId;
    trace.push({
      step: "ELIGIBILITY",
      ruleCode: rule.code,
      ruleName: rule.name,
      passed: matched,
      detail: matched
        ? `Matched specific customer ID ${context.customerId}.`
        : `Customer ${context.customerId || "N/A"} does not match target customer ${target.targetCustomerId}.`,
    });
    return matched;
  }

  if (cType === CustomerTargetType.CUSTOMER_GROUP) {
    const targetGroupCode = (target as any).targetCustomerGroup?.code;
    const matched =
      (!!target.targetCustomerGroupId && context.customerGroupId === target.targetCustomerGroupId) ||
      (!!targetGroupCode && !!context.customerGroupCode && targetGroupCode.toUpperCase() === context.customerGroupCode.toUpperCase()) ||
      (!!context.customerGroupCode && context.customerGroupCode.toUpperCase() === "VIP" && target.targetCustomerType === "VIP");
    trace.push({
      step: "ELIGIBILITY",
      ruleCode: rule.code,
      ruleName: rule.name,
      passed: matched,
      detail: matched
        ? `Customer group matched (${context.customerGroupCode || target.targetCustomerGroupId}).`
        : `Customer group mismatch: Customer has group '${context.customerGroupCode || context.customerGroupId || "N/A"}', target is '${targetGroupCode || target.targetCustomerGroupId}'.`,
    });
    return matched;
  }

  if (cType === CustomerTargetType.VIP) {
    const targetGroupCode = (target as any).targetCustomerGroup?.code;
    const isVipGroup = targetGroupCode?.toUpperCase() === "VIP" || context.customerGroupCode?.toUpperCase() === "VIP";
    const matched = context.customerGroupCode?.toUpperCase() === "VIP" || isVipGroup;
    trace.push({
      step: "ELIGIBILITY",
      ruleCode: rule.code,
      ruleName: rule.name,
      passed: matched,
      detail: matched ? `VIP customer verified.` : `Customer is not VIP (Group: ${context.customerGroupCode || "None"}).`,
    });
    return matched;
  }

  if (cType === CustomerTargetType.WHOLESALE) {
    const targetGroupCode = (target as any).targetCustomerGroup?.code;
    const isWholesale = targetGroupCode?.toUpperCase() === "WHOLESALE" || context.customerGroupCode?.toUpperCase() === "WHOLESALE";
    const matched = context.customerGroupCode?.toUpperCase() === "WHOLESALE" || isWholesale;
    trace.push({
      step: "ELIGIBILITY",
      ruleCode: rule.code,
      ruleName: rule.name,
      passed: matched,
      detail: matched ? `Wholesale customer verified.` : `Customer is not Wholesale (Group: ${context.customerGroupCode || "None"}).`,
    });
    return matched;
  }

  if (cType === CustomerTargetType.B2B) {
    const matched = context.customerGroupCode?.toUpperCase() === "B2B";
    trace.push({
      step: "ELIGIBILITY",
      ruleCode: rule.code,
      ruleName: rule.name,
      passed: matched,
      detail: matched ? `B2B customer verified.` : `Customer is not B2B (Group: ${context.customerGroupCode || "None"}).`,
    });
    return matched;
  }

  if (cType === CustomerTargetType.EMPLOYEE) {
    const matched = context.customerGroupCode?.toUpperCase() === "EMPLOYEE";
    trace.push({
      step: "ELIGIBILITY",
      ruleCode: rule.code,
      ruleName: rule.name,
      passed: matched,
      detail: matched ? `Employee verified.` : `Customer is not Employee (Group: ${context.customerGroupCode || "None"}).`,
    });
    return matched;
  }

  if (cType === CustomerTargetType.NEW_CUSTOMER) {
    const matched = context.isNewCustomer === true;
    trace.push({
      step: "ELIGIBILITY",
      ruleCode: rule.code,
      ruleName: rule.name,
      passed: matched,
      detail: matched ? `New customer verified.` : `Customer is existing, not new.`,
    });
    return matched;
  }

  return true;
}

export function evaluateItemMatch(
  rule: RuleWithDetails,
  item: TransactionItemInput,
  trace?: TraceStep[]
): boolean {
  const target = rule.target as any;
  if (!target) return true;

  // 1. Metal check
  if (target.targetMetalId) {
    const targetCode = target.targetMetal?.code;
    const metalIdMatches = (item as any).metalId && item as any && (item as any).metalId === target.targetMetalId;
    const metalCodeMatches = item.metalCode && (
      target.targetMetalId.toUpperCase() === item.metalCode.toUpperCase() ||
      (targetCode && targetCode.toUpperCase() === item.metalCode.toUpperCase())
    );

    if (!metalIdMatches && !metalCodeMatches) {
      return false;
    }
  }

  // 2. Purity check
  if (target.targetPurityId) {
    const targetPurityCode = target.targetPurity?.code;
    const purityIdMatches = (item as any).purityId && (item as any).purityId === target.targetPurityId;
    const purityCodeMatches = item.purityCode && (
      target.targetPurityId.toUpperCase() === item.purityCode.toUpperCase() ||
      (targetPurityCode && targetPurityCode.toUpperCase() === item.purityCode.toUpperCase())
    );

    if (!purityIdMatches && !purityCodeMatches) {
      return false;
    }
  }

  // 3. Product Scope
  const pScope = target.targetProductScope;
  if (pScope === ProductTargetScope.ALL) {
    return true;
  }

  if (pScope === ProductTargetScope.CATEGORY) {
    const targetCategoryCode = target.targetCategory?.code;
    const catIdMatches = target.targetCategoryId && item.categoryId && target.targetCategoryId === item.categoryId;
    const catCodeMatches = (item as any).categoryCode && targetCategoryCode &&
      (item as any).categoryCode.toUpperCase() === targetCategoryCode.toUpperCase();
    const catNameMatches = target.targetCategoryId && (item as any).categoryCode &&
      target.targetCategoryId.toUpperCase() === (item as any).categoryCode.toUpperCase();

    return !!(catIdMatches || catCodeMatches || catNameMatches);
  }

  if (pScope === ProductTargetScope.SUB_CATEGORY) {
    return !!target.targetSubCategoryId && item.subCategoryId === target.targetSubCategoryId;
  }

  if (pScope === ProductTargetScope.ARTICLE_GROUP) {
    return !!target.targetArticleGroupId && item.articleGroupId === target.targetArticleGroupId;
  }

  if (pScope === ProductTargetScope.SPECIFIC_ARTICLE) {
    return !!target.targetArticleId && item.articleId === target.targetArticleId;
  }

  if (pScope === ProductTargetScope.SKU) {
    return !!target.targetSku && item.sku.toUpperCase() === target.targetSku.toUpperCase();
  }

  return true;
}

export function evaluateConditions(
  rule: RuleWithDetails,
  billGross: number,
  matchedItems: TransactionItemInput[],
  trace: TraceStep[]
): boolean {
  const cond = rule.condition;
  if (!cond) return true;

  // 1. Min Bill Value
  if (cond.minBillValue !== null && cond.minBillValue !== undefined && cond.minBillValue > 0) {
    if (billGross < cond.minBillValue) {
      trace.push({
        step: "CONDITION_CHECK",
        ruleCode: rule.code,
        ruleName: rule.name,
        passed: false,
        detail: `Bill value ₹${billGross.toLocaleString()} is below minimum requirement of ₹${cond.minBillValue.toLocaleString()}.`,
      });
      return false;
    }
    trace.push({
      step: "CONDITION_CHECK",
      ruleCode: rule.code,
      ruleName: rule.name,
      passed: true,
      detail: `Bill value ₹${billGross.toLocaleString()} meets minimum requirement of ₹${cond.minBillValue.toLocaleString()}.`,
    });
  }

  // 2. Max Bill Value
  if (cond.maxBillValue !== null && cond.maxBillValue !== undefined && cond.maxBillValue > 0) {
    if (billGross > cond.maxBillValue) {
      trace.push({
        step: "CONDITION_CHECK",
        ruleCode: rule.code,
        ruleName: rule.name,
        passed: false,
        detail: `Bill value ₹${billGross.toLocaleString()} exceeds maximum threshold of ₹${cond.maxBillValue.toLocaleString()}.`,
      });
      return false;
    }
  }

  // 3. Weight condition (Net weight of matched items or max weight)
  if (cond.minWeight !== null && cond.minWeight !== undefined && cond.minWeight > 0) {
    const totalWeight = matchedItems.reduce((acc, it) => acc + (it.netWeight || it.grossWeight || 0), 0);
    if (totalWeight < cond.minWeight) {
      trace.push({
        step: "CONDITION_CHECK",
        ruleCode: rule.code,
        ruleName: rule.name,
        passed: false,
        detail: `Matched item weight ${totalWeight}g is below minimum requirement of ${cond.minWeight}g.`,
      });
      return false;
    }
    trace.push({
      step: "CONDITION_CHECK",
      ruleCode: rule.code,
      ruleName: rule.name,
      passed: true,
      detail: `Item weight ${totalWeight}g meets minimum condition (${cond.minWeight}g).`,
    });
  }

  // 4. Quantity condition
  if (cond.minQuantity !== null && cond.minQuantity !== undefined && cond.minQuantity > 0) {
    const totalQty = matchedItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
    if (totalQty < cond.minQuantity) {
      trace.push({
        step: "CONDITION_CHECK",
        ruleCode: rule.code,
        ruleName: rule.name,
        passed: false,
        detail: `Item quantity ${totalQty} is below minimum requirement of ${cond.minQuantity}.`,
      });
      return false;
    }
  }

  return true;
}
