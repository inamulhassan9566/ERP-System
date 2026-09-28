import { describe, it, expect } from "vitest";
import { calculateDiscount } from "../services/discount/engine";
import {
  RuleStatus,
  StackingMethod,
  CustomerTargetType,
  ProductTargetScope,
  ComponentType,
  CalculationMethod,
  WeightBasis,
} from "../lib/types";

describe("Discount Calculation Engine - Core Acceptance Tests", () => {
  // Test 1 & Section 54: 20% on making charge for VIP customers
  it("Acceptance Test 1 & 54: 20% on making charge for VIP customer (Aisha)", async () => {
    const vipRule: any = {
      id: "rule-1",
      code: "VIP-GOLD-001",
      name: "VIP Gold Chain Making Discount",
      status: RuleStatus.ACTIVE,
      priority: 50,
      stackable: true,
      stackingMethod: StackingMethod.STACK,
      approvalRequired: false,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2027-12-31"),
      currentVersion: 1,
      target: {
        targetCustomerType: CustomerTargetType.CUSTOMER_GROUP,
        targetCustomerGroupId: "vip-group-id",
        targetProductScope: ProductTargetScope.CATEGORY,
        targetCategoryId: "cat-gold-chains",
        targetMetalId: "GOLD",
      },
      components: [
        {
          component: ComponentType.MAKING_CHARGE,
          calculationMethod: CalculationMethod.PERCENTAGE,
          discountValue: 20,
        },
      ],
      condition: {
        minBillValue: 50000,
      },
    };

    const context: any = {
      customerId: "cust-aisha",
      customerName: "Aisha Patel",
      customerGroupId: "vip-group-id",
      customerGroupCode: "VIP",
      billValueOverride: 120000,
      userId: "user-sales",
      userRoleCode: "SALES_STAFF",
      userMaxDiscountPercent: 10,
      items: [
        {
          id: "item-1",
          sku: "GC-22K-001",
          name: "22K Gold Chain",
          categoryId: "cat-gold-chains",
          metalCode: "GOLD",
          purityCode: "22K",
          grossWeight: 25.0,
          netWeight: 25.0,
          quantity: 1,
          components: {
            metalValue: 105000,
            makingCharge: 10000,
            wastage: 5000,
            stoneValue: 0,
            hallmarkCharge: 0,
            certificationCharge: 0,
            engraving: 0,
            polishing: 0,
            otherCharges: 0,
          },
        },
      ],
    };

    const result = await calculateDiscount(context, [vipRule]);

    expect(result.appliedRules.length).toBe(1);
    expect(result.appliedRules[0].ruleCode).toBe("VIP-GOLD-001");
    expect(result.appliedRules[0].discountAmount).toBe(2000);

    // Component isolation check: Making charge has discount, metal value is untouched
    const itemResult = result.discountByItem["item-1"];
    expect(itemResult.components[ComponentType.MAKING_CHARGE].originalValue).toBe(10000);
    expect(itemResult.components[ComponentType.MAKING_CHARGE].discountAmount).toBe(2000);
    expect(itemResult.components[ComponentType.MAKING_CHARGE].finalValue).toBe(8000);

    // Metal value unchanged
    expect(itemResult.components[ComponentType.METAL_VALUE].originalValue).toBe(105000);
    expect(itemResult.components[ComponentType.METAL_VALUE].discountAmount).toBe(0);
    expect(itemResult.components[ComponentType.METAL_VALUE].finalValue).toBe(105000);

    expect(result.totalDiscountAmount).toBe(2000);
  });

  // Test 2: ₹100/g on making charge for a customer group
  it("Acceptance Test 2: ₹100/g on making charge based on net weight", async () => {
    const gramRule: any = {
      id: "rule-2",
      code: "GRAM-MAKING-002",
      name: "₹100/g Making Charge Discount",
      status: RuleStatus.ACTIVE,
      priority: 50,
      stackable: true,
      stackingMethod: StackingMethod.STACK,
      startDate: new Date("2026-01-01"),
      target: {
        targetCustomerType: CustomerTargetType.CUSTOMER_GROUP,
        targetCustomerGroupId: "retail-group-id",
        targetProductScope: ProductTargetScope.ALL,
      },
      components: [
        {
          component: ComponentType.MAKING_CHARGE,
          calculationMethod: CalculationMethod.AMOUNT_PER_GRAM,
          discountValue: 100,
          weightBasis: WeightBasis.NET_WEIGHT,
        },
      ],
      condition: null,
    };

    const context: any = {
      customerGroupId: "retail-group-id",
      userId: "user-admin",
      userRoleCode: "ADMIN",
      items: [
        {
          id: "item-1",
          sku: "GC-22K-001",
          name: "22K Gold Chain (15g)",
          netWeight: 15.0,
          grossWeight: 15.0,
          quantity: 1,
          components: {
            metalValue: 90000,
            makingCharge: 8000,
          },
        },
      ],
    };

    const result = await calculateDiscount(context, [gramRule]);
    // 15g * ₹100 = ₹1,500
    expect(result.totalDiscountAmount).toBe(1500);
    expect(result.discountByItem["item-1"].components[ComponentType.MAKING_CHARGE].discountAmount).toBe(1500);
    expect(result.discountByItem["item-1"].components[ComponentType.MAKING_CHARGE].finalValue).toBe(6500);
  });

  // Test 3 & Section 55: ₹5/g on silver value for wholesale customers
  it("Acceptance Test 3 & 55: ₹5/g on silver value for wholesale customers", async () => {
    const wholesaleSilverRule: any = {
      id: "rule-3",
      code: "WHOLESALE-SILVER-002",
      name: "Wholesale Silver Value Discount",
      status: RuleStatus.ACTIVE,
      priority: 40,
      stackable: true,
      stackingMethod: StackingMethod.STACK,
      startDate: new Date("2026-01-01"),
      target: {
        targetCustomerType: CustomerTargetType.WHOLESALE,
        targetProductScope: ProductTargetScope.ALL,
        targetMetalId: "SILVER",
      },
      components: [
        {
          component: ComponentType.SILVER_VALUE,
          calculationMethod: CalculationMethod.AMOUNT_PER_GRAM,
          discountValue: 5,
          weightBasis: WeightBasis.NET_WEIGHT,
        },
      ],
      condition: null,
    };

    const context: any = {
      customerGroupCode: "WHOLESALE",
      userId: "user-sales",
      userRoleCode: "SALES_STAFF",
      items: [
        {
          id: "item-silver",
          sku: "SC-925-004",
          name: "Silver Chain",
          metalCode: "SILVER",
          netWeight: 10.0,
          grossWeight: 10.0,
          quantity: 1,
          components: {
            metalValue: 20000,
            makingCharge: 1500,
          },
        },
      ],
    };

    const result = await calculateDiscount(context, [wholesaleSilverRule]);
    // 10g * ₹5 = ₹50
    expect(result.totalDiscountAmount).toBe(50);
    expect(result.discountByItem["item-silver"].components[ComponentType.SILVER_VALUE].discountAmount).toBe(50);
    expect(result.discountByItem["item-silver"].components[ComponentType.SILVER_VALUE].finalValue).toBe(19950);
    expect(result.discountByItem["item-silver"].components[ComponentType.MAKING_CHARGE].discountAmount).toBe(0);
  });

  // Test 4: 10% on gold value for a specific category
  it("Acceptance Test 4: 10% on gold value for a specific category", async () => {
    const goldValueRule: any = {
      id: "rule-4",
      code: "CAT-GOLD-10",
      name: "10% on Gold Value for Gold Rings",
      status: RuleStatus.ACTIVE,
      priority: 50,
      stackable: true,
      stackingMethod: StackingMethod.STACK,
      startDate: new Date("2026-01-01"),
      target: {
        targetCustomerType: CustomerTargetType.ALL,
        targetProductScope: ProductTargetScope.CATEGORY,
        targetCategoryId: "cat-gold-rings",
        targetMetalId: "GOLD",
      },
      components: [
        {
          component: ComponentType.GOLD_VALUE,
          calculationMethod: CalculationMethod.PERCENTAGE,
          discountValue: 10,
        },
      ],
      condition: null,
    };

    const context: any = {
      userId: "user-admin",
      userRoleCode: "ADMIN",
      items: [
        {
          id: "ring-1",
          sku: "GR-18K-003",
          name: "18K Gold Ring",
          categoryId: "cat-gold-rings",
          metalCode: "GOLD",
          quantity: 1,
          components: {
            metalValue: 22000,
            makingCharge: 3500,
          },
        },
      ],
    };

    const result = await calculateDiscount(context, [goldValueRule]);
    // 10% of ₹22,000 = ₹2,200
    expect(result.totalDiscountAmount).toBe(2200);
    expect(result.discountByItem["ring-1"].components[ComponentType.GOLD_VALUE].discountAmount).toBe(2200);
    expect(result.discountByItem["ring-1"].components[ComponentType.GOLD_VALUE].finalValue).toBe(19800);
    expect(result.discountByItem["ring-1"].components[ComponentType.MAKING_CHARGE].discountAmount).toBe(0);
  });

  // Test 5: ₹3,000 fixed discount on a specific article
  it("Acceptance Test 5: ₹3,000 fixed discount on a specific article", async () => {
    const articleRule: any = {
      id: "rule-5",
      code: "ART-FIXED-005",
      name: "Flat ₹3,000 Article Discount",
      status: RuleStatus.ACTIVE,
      priority: 50,
      stackable: true,
      stackingMethod: StackingMethod.STACK,
      startDate: new Date("2026-01-01"),
      target: {
        targetCustomerType: CustomerTargetType.ALL,
        targetProductScope: ProductTargetScope.SPECIFIC_ARTICLE,
        targetArticleId: "art-royal-chain",
      },
      components: [
        {
          component: ComponentType.ENTIRE_ITEM,
          calculationMethod: CalculationMethod.FIXED_AMOUNT,
          discountValue: 3000,
        },
      ],
      condition: null,
    };

    const context: any = {
      userId: "user-admin",
      userRoleCode: "ADMIN",
      items: [
        {
          id: "item-1",
          sku: "GC-22K-001",
          name: "Royal Filigree Chain",
          articleId: "art-royal-chain",
          quantity: 1,
          components: {
            metalValue: 50000,
            makingCharge: 10000,
          },
        },
      ],
    };

    const result = await calculateDiscount(context, [articleRule]);
    expect(result.totalDiscountAmount).toBe(3000);
    expect(result.discountByItem["item-1"].itemLevelDiscount).toBe(3000);
    expect(result.discountByItem["item-1"].finalItemTotal).toBe(57000);
  });

  // Test 6: 15% on the entire item
  it("Acceptance Test 6: 15% on the entire item", async () => {
    const entireItemRule: any = {
      id: "rule-6",
      code: "ITEM-15-PCT",
      name: "15% on Entire Item",
      status: RuleStatus.ACTIVE,
      priority: 50,
      stackable: true,
      stackingMethod: StackingMethod.STACK,
      startDate: new Date("2026-01-01"),
      target: {
        targetCustomerType: CustomerTargetType.ALL,
        targetProductScope: ProductTargetScope.ALL,
      },
      components: [
        {
          component: ComponentType.ENTIRE_ITEM,
          calculationMethod: CalculationMethod.PERCENTAGE,
          discountValue: 15,
        },
      ],
      condition: null,
    };

    const context: any = {
      userId: "user-admin",
      userRoleCode: "ADMIN",
      items: [
        {
          id: "item-1",
          sku: "TEST-01",
          name: "Item Total 20k",
          quantity: 1,
          components: {
            metalValue: 15000,
            makingCharge: 5000,
          },
        },
      ],
    };

    const result = await calculateDiscount(context, [entireItemRule]);
    // 15% of 20,000 = 3,000
    expect(result.totalDiscountAmount).toBe(3000);
    expect(result.discountByItem["item-1"].finalItemTotal).toBe(17000);
  });

  // Test 7: ₹5,000 on the entire bill
  it("Acceptance Test 7: ₹5,000 on the entire bill", async () => {
    const billRule: any = {
      id: "rule-7",
      code: "BILL-5000-FIXED",
      name: "₹5,000 Bill Discount",
      status: RuleStatus.ACTIVE,
      priority: 50,
      stackable: true,
      stackingMethod: StackingMethod.STACK,
      startDate: new Date("2026-01-01"),
      target: {
        targetCustomerType: CustomerTargetType.ALL,
        targetProductScope: ProductTargetScope.ALL,
      },
      components: [
        {
          component: ComponentType.ENTIRE_BILL,
          calculationMethod: CalculationMethod.FIXED_AMOUNT,
          discountValue: 5000,
        },
      ],
      condition: {
        minBillValue: 50000,
      },
    };

    const context: any = {
      userId: "user-admin",
      userRoleCode: "ADMIN",
      billValueOverride: 80000,
      items: [
        {
          id: "item-1",
          sku: "TEST-01",
          name: "Item 1",
          quantity: 1,
          components: {
            metalValue: 70000,
            makingCharge: 10000,
          },
        },
      ],
    };

    const result = await calculateDiscount(context, [billRule]);
    expect(result.billDiscount).toBe(5000);
    expect(result.totalDiscountAmount).toBe(5000);
    expect(result.totalFinalAmount).toBe(75000);
  });

  // Test 8: Different discounts on different components of the same item
  it("Acceptance Test 8: Different discounts on different components of the same item", async () => {
    const multiCompRule: any = {
      id: "rule-8",
      code: "MULTI-COMP-008",
      name: "Dual Component Discount",
      status: RuleStatus.ACTIVE,
      priority: 50,
      stackable: true,
      stackingMethod: StackingMethod.STACK,
      startDate: new Date("2026-01-01"),
      target: {
        targetCustomerType: CustomerTargetType.ALL,
        targetProductScope: ProductTargetScope.ALL,
      },
      components: [
        {
          component: ComponentType.GOLD_VALUE,
          calculationMethod: CalculationMethod.PERCENTAGE,
          discountValue: 2, // 2% on Gold
        },
        {
          component: ComponentType.MAKING_CHARGE,
          calculationMethod: CalculationMethod.PERCENTAGE,
          discountValue: 20, // 20% on Making
        },
      ],
      condition: null,
    };

    const context: any = {
      userId: "user-admin",
      userRoleCode: "ADMIN",
      items: [
        {
          id: "item-1",
          sku: "GC-001",
          name: "Gold Item",
          quantity: 1,
          components: {
            metalValue: 100000,
            makingCharge: 10000,
            wastage: 5000,
            stoneValue: 20000,
          },
        },
      ],
    };

    const result = await calculateDiscount(context, [multiCompRule]);
    // Gold: 2% of 100,000 = 2,000
    // Making: 20% of 10,000 = 2,000
    // Total = 4,000
    expect(result.discountByComponent[ComponentType.GOLD_VALUE]).toBe(2000);
    expect(result.discountByComponent[ComponentType.MAKING_CHARGE]).toBe(2000);
    expect(result.discountByComponent[ComponentType.WASTAGE]).toBe(0);
    expect(result.discountByComponent[ComponentType.STONE_VALUE]).toBe(0);
    expect(result.totalDiscountAmount).toBe(4000);
  });

  // Test 9: Multiple discounts on the same transaction where stacking is allowed
  it("Acceptance Test 9: Multiple discounts stacked across rules", async () => {
    const ruleA: any = {
      id: "rule-a",
      code: "RULE-A",
      name: "VIP Making 10%",
      status: RuleStatus.ACTIVE,
      priority: 50,
      stackable: true,
      stackingMethod: StackingMethod.STACK,
      startDate: new Date("2026-01-01"),
      target: { targetCustomerType: CustomerTargetType.ALL, targetProductScope: ProductTargetScope.ALL },
      components: [
        { component: ComponentType.MAKING_CHARGE, calculationMethod: CalculationMethod.PERCENTAGE, discountValue: 10 },
      ],
    };

    const ruleB: any = {
      id: "rule-b",
      code: "RULE-B",
      name: "Festive Making ₹500",
      status: RuleStatus.ACTIVE,
      priority: 40,
      stackable: true,
      stackingMethod: StackingMethod.STACK,
      startDate: new Date("2026-01-01"),
      target: { targetCustomerType: CustomerTargetType.ALL, targetProductScope: ProductTargetScope.ALL },
      components: [
        { component: ComponentType.MAKING_CHARGE, calculationMethod: CalculationMethod.FIXED_AMOUNT, discountValue: 500 },
      ],
    };

    const context: any = {
      userId: "user-admin",
      userRoleCode: "ADMIN",
      items: [
        {
          id: "item-1",
          sku: "GC-001",
          name: "Item",
          quantity: 1,
          components: { makingCharge: 10000 },
        },
      ],
    };

    const result = await calculateDiscount(context, [ruleA, ruleB]);
    // 10% of 10,000 = 1,000 + ₹500 = ₹1,500
    expect(result.totalDiscountAmount).toBe(1500);
    expect(result.discountByItem["item-1"].components[ComponentType.MAKING_CHARGE].discountAmount).toBe(1500);
    expect(result.discountByItem["item-1"].components[ComponentType.MAKING_CHARGE].finalValue).toBe(8500);
  });

  // Test 10 & 11: Manual discounts limited by user permissions & Manager approval trigger
  it("Acceptance Test 10 & 11: Exceeding sales staff limit triggers approval required", async () => {
    const heavyRule: any = {
      id: "rule-heavy",
      code: "HEAVY-DISCOUNT",
      name: "Heavy 20% Making Discount",
      status: RuleStatus.ACTIVE,
      priority: 50,
      stackable: true,
      stackingMethod: StackingMethod.STACK,
      startDate: new Date("2026-01-01"),
      target: { targetCustomerType: CustomerTargetType.ALL, targetProductScope: ProductTargetScope.ALL },
      components: [
        { component: ComponentType.MAKING_CHARGE, calculationMethod: CalculationMethod.PERCENTAGE, discountValue: 20 },
      ],
    };

    const context: any = {
      userId: "sales-staff-id",
      userRoleCode: "SALES_STAFF",
      userMaxDiscountPercent: 10, // Staff only allowed 10%
      userMaxDiscountAmount: 5000,
      billValueOverride: 10000,
      items: [
        {
          id: "item-1",
          sku: "GC-001",
          name: "Item",
          quantity: 1,
          components: { makingCharge: 10000 },
        },
      ],
    };

    const result = await calculateDiscount(context, [heavyRule]);
    // 20% applied = ₹2,000 (20% of 10,000)
    // Exceeds staff 10% limit -> Approval MUST be required
    expect(result.approvalRequired).toBe(true);
    expect(result.approvalReason).toBeDefined();
    expect(result.approvalDetails?.requestedPercent).toBe(20);
    expect(result.approvalDetails?.allowedPercent).toBe(10);
  });

  // Conflict Detection Test
  it("Conflict Detection: Equal priority non-stackable rules create explicit CONFLICT", async () => {
    const conflictRule1: any = {
      id: "rule-c1",
      code: "CONFLICT-1",
      name: "Offer A 20%",
      status: RuleStatus.ACTIVE,
      priority: 50, // equal priority 50
      stackable: false, // not stackable!
      stackingMethod: StackingMethod.STACK,
      startDate: new Date("2026-01-01"),
      target: { targetCustomerType: CustomerTargetType.ALL, targetProductScope: ProductTargetScope.ALL },
      components: [
        { component: ComponentType.MAKING_CHARGE, calculationMethod: CalculationMethod.PERCENTAGE, discountValue: 20 },
      ],
    };

    const conflictRule2: any = {
      id: "rule-c2",
      code: "CONFLICT-2",
      name: "Offer B 15%",
      status: RuleStatus.ACTIVE,
      priority: 50, // equal priority 50
      stackable: false, // not stackable!
      stackingMethod: StackingMethod.STACK,
      startDate: new Date("2026-01-01"),
      target: { targetCustomerType: CustomerTargetType.ALL, targetProductScope: ProductTargetScope.ALL },
      components: [
        { component: ComponentType.MAKING_CHARGE, calculationMethod: CalculationMethod.PERCENTAGE, discountValue: 15 },
      ],
    };

    const context: any = {
      userId: "user-admin",
      userRoleCode: "ADMIN",
      items: [
        {
          id: "item-1",
          sku: "GC-001",
          name: "Item",
          quantity: 1,
          components: { makingCharge: 10000 },
        },
      ],
    };

    const result = await calculateDiscount(context, [conflictRule1, conflictRule2]);
    // Must NOT silently pick one!
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.conflicts[0].ruleCodes).toContain("CONFLICT-1");
    expect(result.conflicts[0].ruleCodes).toContain("CONFLICT-2");
    expect(result.conflicts[0].message).toContain("Conflict detected");
  });
});
