import { prisma } from "@/lib/prisma";
import {
  TransactionContext,
  DiscountCalculationResponse,
  TraceStep,
  ConflictInfo,
  ItemCalculationResult,
  ComponentCalculationResult,
  ComponentType,
  CalculationMethod,
  RuleStatus,
} from "@/lib/types";
import {
  RuleWithDetails,
  evaluateRuleValidity,
  evaluateCustomerEligibility,
  evaluateItemMatch,
  evaluateConditions,
} from "./matcher";
import { getComponentValue, computeRawDiscountAmount, applyLimits } from "./calculator";
import { CandidateRuleApplication, detectRuleConflicts } from "./conflict";
import { resolveStacking } from "./stacking";
import { evaluateDiscountPermissions } from "./permissions";

const ALL_COMPONENTS: ComponentType[] = [
  ComponentType.METAL_VALUE,
  ComponentType.GOLD_VALUE,
  ComponentType.SILVER_VALUE,
  ComponentType.OTHER_METAL_VALUE,
  ComponentType.MAKING_CHARGE,
  ComponentType.LABOUR_CHARGE,
  ComponentType.WASTAGE,
  ComponentType.OTHER_MANUFACTURING,
  ComponentType.STONE_VALUE,
  ComponentType.DIAMOND_VALUE,
  ComponentType.STONE_SETTING,
  ComponentType.OTHER_STONE,
  ComponentType.HALLMARK_CHARGE,
  ComponentType.CERTIFICATION_CHARGE,
  ComponentType.ENGRAVING,
  ComponentType.POLISHING,
  ComponentType.OTHER_CHARGES,
  ComponentType.ENTIRE_ITEM,
  ComponentType.ENTIRE_BILL,
];

export async function calculateDiscount(
  context: TransactionContext,
  injectedRules?: RuleWithDetails[]
): Promise<DiscountCalculationResponse> {
  const trace: TraceStep[] = [];
  const warnings: string[] = [];
  const currentDate = context.date ? new Date(context.date) : new Date();

  // 1. Fetch active rules if not injected
  let rules: RuleWithDetails[];
  if (injectedRules) {
    rules = injectedRules;
  } else {
    try {
      rules = (await prisma.discountRule.findMany({
        where: {
          status: RuleStatus.ACTIVE,
        },
        include: {
          target: {
            include: {
              targetCategory: true,
              targetCustomerGroup: true,
              targetCustomer: true,
              targetMetal: true,
              targetPurity: true,
              targetArticle: true,
            },
          },
          condition: true,
          components: true,
        },
        orderBy: {
          priority: "desc",
        },
      })) as RuleWithDetails[];
    } catch (dbError: any) {
      console.error("Database error fetching discount rules:", dbError);
      rules = [];
      warnings.push("Could not load discount rules from database. Using fallback/empty rule set.");
    }
  }

  trace.push({
    step: "DISCOVERY",
    passed: true,
    detail: `Discovered ${rules.length} active discount rules in database.`,
  });

  // Calculate gross bill sum from items
  let calculatedGross = 0;
  for (const item of context.items) {
    const c = item.components;
    const itemGross =
      (c.metalValue || 0) +
      (c.makingCharge || 0) +
      (c.wastage || 0) +
      (c.stoneValue || 0) +
      (c.hallmarkCharge || 0) +
      (c.certificationCharge || 0) +
      (c.engraving || 0) +
      (c.polishing || 0) +
      (c.otherCharges || 0);
    calculatedGross += itemGross;
  }

  const effectiveBillGross = context.billValueOverride && context.billValueOverride > 0
    ? context.billValueOverride
    : calculatedGross;

  // 2. Evaluate Rule Eligibility (Status, Dates, Customer Targeting)
  const eligibleRules: RuleWithDetails[] = [];
  const applicableRulesReport: DiscountCalculationResponse["applicableRules"] = [];

  for (const rule of rules) {
    const isValid = evaluateRuleValidity(rule, currentDate, trace);
    if (!isValid) {
      applicableRulesReport.push({
        ruleId: rule.id,
        ruleCode: rule.code,
        ruleName: rule.name,
        priority: rule.priority,
        stackable: rule.stackable,
        stackingMethod: rule.stackingMethod,
        status: rule.status,
        matched: false,
        reason: "Validity or date window check failed.",
      });
      continue;
    }

    const isCustomerEligible = evaluateCustomerEligibility(rule, context, trace);
    if (!isCustomerEligible) {
      applicableRulesReport.push({
        ruleId: rule.id,
        ruleCode: rule.code,
        ruleName: rule.name,
        priority: rule.priority,
        stackable: rule.stackable,
        stackingMethod: rule.stackingMethod,
        status: rule.status,
        matched: false,
        reason: "Customer eligibility criteria not met.",
      });
      continue;
    }

    eligibleRules.push(rule);
  }

  // 3. Match items and evaluate condition per rule
  const itemLevelCandidates: CandidateRuleApplication[] = [];
  const billLevelCandidates: CandidateRuleApplication[] = [];
  let ruleExplicitApproval = false;
  const violatingRules: string[] = [];

  for (const rule of eligibleRules) {
    // Check which items this rule targets
    const matchedItems = context.items.filter((item) => evaluateItemMatch(rule, item, trace));

    // For ENTIRE_BILL rules, items can be empty or general
    const isBillRule = rule.components.some((rc) => rc.component === ComponentType.ENTIRE_BILL);

    if (!isBillRule && matchedItems.length === 0) {
      applicableRulesReport.push({
        ruleId: rule.id,
        ruleCode: rule.code,
        ruleName: rule.name,
        priority: rule.priority,
        stackable: rule.stackable,
        stackingMethod: rule.stackingMethod,
        status: rule.status,
        matched: false,
        reason: "No items in transaction match product/category/metal targeting.",
      });
      continue;
    }

    // Check conditions (min bill value, min weight, min qty)
    const passedConditions = evaluateConditions(rule, effectiveBillGross, matchedItems, trace);
    if (!passedConditions) {
      applicableRulesReport.push({
        ruleId: rule.id,
        ruleCode: rule.code,
        ruleName: rule.name,
        priority: rule.priority,
        stackable: rule.stackable,
        stackingMethod: rule.stackingMethod,
        status: rule.status,
        matched: false,
        reason: "Threshold conditions (minimum bill value, weight, or quantity) not satisfied.",
      });
      continue;
    }

    applicableRulesReport.push({
      ruleId: rule.id,
      ruleCode: rule.code,
      ruleName: rule.name,
      priority: rule.priority,
      stackable: rule.stackable,
      stackingMethod: rule.stackingMethod,
      status: rule.status,
      matched: true,
      reason: `Matched ${isBillRule ? "Entire Bill" : `${matchedItems.length} item(s)`}.`,
    });

    if (rule.approvalRequired) {
      ruleExplicitApproval = true;
      violatingRules.push(rule.code);
    }

    // Queue candidates for each configured component
    for (const compConfig of rule.components) {
      if (compConfig.component === ComponentType.ENTIRE_BILL) {
        billLevelCandidates.push({
          rule,
          componentType: ComponentType.ENTIRE_BILL,
          calculationMethod: compConfig.calculationMethod,
          discountValue: compConfig.discountValue,
          weightBasis: compConfig.weightBasis,
          calculatedAmount: 0,
          priority: rule.priority,
          stackable: rule.stackable,
          stackingMethod: rule.stackingMethod,
          limits: {
            maxDiscountPercent: compConfig.maxDiscountPercent,
            maxDiscountAmount: compConfig.maxDiscountAmount,
            maxPerBill: compConfig.maxPerBill,
          },
        });
      } else {
        for (const item of matchedItems) {
          itemLevelCandidates.push({
            rule,
            componentType: compConfig.component,
            calculationMethod: compConfig.calculationMethod,
            discountValue: compConfig.discountValue,
            weightBasis: compConfig.weightBasis,
            calculatedAmount: 0,
            priority: rule.priority,
            stackable: rule.stackable,
            stackingMethod: rule.stackingMethod,
            limits: {
              maxDiscountPercent: compConfig.maxDiscountPercent,
              maxDiscountAmount: compConfig.maxDiscountAmount,
              maxPerItem: compConfig.maxPerItem,
            },
            itemId: item.id,
            itemSku: item.sku,
          });
        }
      }
    }
  }

  // 4. Detect conflicts
  const { conflicts: itemConflicts, filteredCandidates: resolvedItemCandidates } =
    detectRuleConflicts(itemLevelCandidates, trace);

  const { conflicts: billConflicts, filteredCandidates: resolvedBillCandidates } =
    detectRuleConflicts(billLevelCandidates, trace);

  const allConflicts: ConflictInfo[] = [...itemConflicts, ...billConflicts];
  if (allConflicts.length > 0) {
    warnings.push(`${allConflicts.length} rule conflict(s) detected. Conflicting rules with identical priority withheld.`);
  }

  // 5. Calculate Item-level and Component-level Discounts
  const discountByItem: Record<string, ItemCalculationResult> = {};
  const discountByComponent: Record<ComponentType, number> = {} as any;
  for (const c of ALL_COMPONENTS) {
    discountByComponent[c] = 0;
  }

  const appliedRulesList: DiscountCalculationResponse["appliedRules"] = [];
  let totalItemDiscountsSum = 0;

  for (const item of context.items) {
    const itemComponentsMap: Record<ComponentType, ComponentCalculationResult> = {} as any;
    let itemTotalDiscount = 0;
    const itemGross =
      (item.components.metalValue || 0) +
      (item.components.makingCharge || 0) +
      (item.components.wastage || 0) +
      (item.components.stoneValue || 0) +
      (item.components.hallmarkCharge || 0) +
      (item.components.certificationCharge || 0) +
      (item.components.engraving || 0) +
      (item.components.polishing || 0) +
      (item.components.otherCharges || 0);

    for (const compType of ALL_COMPONENTS) {
      if (compType === ComponentType.ENTIRE_BILL) continue;

      const origVal = getComponentValue(compType, item.components);
      if (origVal <= 0 && compType !== ComponentType.ENTIRE_ITEM) {
        itemComponentsMap[compType] = {
          componentType: compType,
          originalValue: 0,
          discountAmount: 0,
          finalValue: 0,
          appliedRules: [],
        };
        continue;
      }

      // Filter candidates for this specific item and component
      const matchingCandidates = resolvedItemCandidates.filter(
        (c) => c.itemId === item.id && c.componentType === compType
      );

      const stackResult = resolveStacking(matchingCandidates, origVal, item, trace);

      itemComponentsMap[compType] = {
        componentType: compType,
        originalValue: origVal,
        discountAmount: stackResult.totalDiscount,
        finalValue: stackResult.finalValue,
        appliedRules: stackResult.appliedRules,
      };

      if (stackResult.totalDiscount > 0) {
        discountByComponent[compType] = (discountByComponent[compType] || 0) + stackResult.totalDiscount;
        itemTotalDiscount += stackResult.totalDiscount;

        for (const ar of stackResult.appliedRules) {
          appliedRulesList.push({
            ruleId: ar.ruleId,
            ruleCode: ar.ruleCode,
            ruleName: ar.ruleName,
            priority: matchingCandidates.find((c) => c.rule.id === ar.ruleId)?.priority || 10,
            component: compType,
            discountAmount: ar.discountAmount,
            method: ar.method,
            value: ar.rateOrValue,
          });
        }
      }
    }

    const itemLevelDiscount = itemComponentsMap[ComponentType.ENTIRE_ITEM]?.discountAmount || 0;
    totalItemDiscountsSum += itemTotalDiscount;

    discountByItem[item.id] = {
      itemId: item.id,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      grossWeight: item.grossWeight,
      netWeight: item.netWeight,
      components: itemComponentsMap,
      originalItemTotal: itemGross,
      itemLevelDiscount,
      totalItemDiscount: Math.min(itemTotalDiscount, itemGross),
      finalItemTotal: Math.max(0, itemGross - itemTotalDiscount),
    };
  }

  // 6. Calculate Bill-level Discount
  let billDiscount = 0;
  const billGrossAfterItems = Math.max(0, effectiveBillGross - totalItemDiscountsSum);

  if (resolvedBillCandidates.length > 0 && billGrossAfterItems > 0) {
    const stackResult = resolveStacking(resolvedBillCandidates, billGrossAfterItems, undefined, trace);
    billDiscount = stackResult.totalDiscount;
    discountByComponent[ComponentType.ENTIRE_BILL] = billDiscount;

    for (const ar of stackResult.appliedRules) {
      appliedRulesList.push({
        ruleId: ar.ruleId,
        ruleCode: ar.ruleCode,
        ruleName: ar.ruleName,
        priority: resolvedBillCandidates.find((c) => c.rule.id === ar.ruleId)?.priority || 10,
        component: ComponentType.ENTIRE_BILL,
        discountAmount: ar.discountAmount,
        method: ar.method,
        value: ar.rateOrValue,
      });
    }
  }

  const grandTotalDiscount = totalItemDiscountsSum + billDiscount;
  const grandTotalFinal = Math.max(0, effectiveBillGross - grandTotalDiscount);

  // 7. Evaluate User Authority & Approval Requirement
  const permissionResult = evaluateDiscountPermissions(
    context,
    grandTotalDiscount,
    effectiveBillGross,
    ruleExplicitApproval,
    violatingRules,
    trace
  );

  return {
    applicableRules: applicableRulesReport,
    appliedRules: appliedRulesList,
    discountByItem,
    discountByComponent,
    billDiscount,
    totalGrossAmount: effectiveBillGross,
    totalDiscountAmount: grandTotalDiscount,
    totalFinalAmount: grandTotalFinal,
    approvalRequired: permissionResult.approvalRequired,
    approvalReason: permissionResult.approvalReason,
    approvalDetails: permissionResult.approvalDetails,
    warnings,
    conflicts: allConflicts,
    calculationTrace: trace,
  };
}
