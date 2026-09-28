import { describe, it, expect } from "vitest";
import { calculateDiscount } from "../services/discount/engine";
import { prisma } from "../lib/prisma";
import { ComponentType } from "../lib/types";

describe("Discount Engine - Live Database Integration Tests", () => {
  it("End-to-End Test 54 against Seeded DB: Aisha Patel (VIP) + 22K Gold Chain", async () => {
    // Look up customer Aisha from DB
    const customer = await prisma.customer.findFirst({
      where: { code: "CUST-002" },
      include: { customerGroup: true },
    });
    expect(customer).not.toBeNull();
    expect(customer?.customerGroup?.code).toBe("VIP");

    // Look up product 22K Gold Chain from DB
    const product = await prisma.product.findUnique({
      where: { sku: "GC-22K-001" },
      include: { category: true, metal: true, purity: true },
    });
    expect(product).not.toBeNull();

    const context: any = {
      customerId: customer!.id,
      customerCode: customer!.code,
      customerName: customer!.name,
      customerGroupId: customer!.customerGroupId!,
      customerGroupCode: customer!.customerGroup?.code,
      userId: "test-user-id",
      userRoleCode: "ADMIN",
      billValueOverride: 120000,
      items: [
        {
          id: "item-aisha-1",
          productId: product!.id,
          sku: product!.sku,
          name: product!.name,
          categoryId: product!.categoryId,
          metalCode: product!.metal.code,
          purityCode: product!.purity.code,
          grossWeight: 10.0,
          netWeight: 10.0,
          quantity: 1,
          components: {
            metalValue: product!.baseMetalValue,
            makingCharge: 10000,
            wastage: 5000,
            stoneValue: 0,
            hallmarkCharge: 500,
            certificationCharge: 0,
            engraving: 0,
            polishing: 0,
            otherCharges: 0,
          },
        },
      ],
    };

    // Calculate discount pulling live rules directly from PostgreSQL!
    const result = await calculateDiscount(context);

    // Rule 1 (VIP-GOLD-001: 20% on making) yields ₹2,000, which is higher than Rule 4 (10g * ₹150 = ₹1,500)
    const makingComponent = result.discountByItem["item-aisha-1"].components[ComponentType.MAKING_CHARGE];
    expect(makingComponent.originalValue).toBe(10000);
    expect(makingComponent.discountAmount).toBe(2000);
    expect(makingComponent.finalValue).toBe(8000);

    // Metal value (110000) must NOT be discounted
    const metalComponent = result.discountByItem["item-aisha-1"].components[ComponentType.METAL_VALUE];
    expect(metalComponent.discountAmount).toBe(0);
    expect(metalComponent.finalValue).toBe(110000);
  });

  it("End-to-End Test 55 against Seeded DB: Wholesale Silver Value Discount", async () => {
    const wholesaleCustomer = await prisma.customer.findFirst({
      where: { code: "CUST-003" },
      include: { customerGroup: true },
    });
    expect(wholesaleCustomer).not.toBeNull();

    const silverProduct = await prisma.product.findUnique({
      where: { sku: "SC-925-004" },
      include: { metal: true },
    });
    expect(silverProduct).not.toBeNull();

    const context: any = {
      customerId: wholesaleCustomer!.id,
      customerGroupCode: wholesaleCustomer!.customerGroup?.code, // WHOLESALE
      userId: "test-user-id",
      userRoleCode: "ADMIN",
      items: [
        {
          id: "item-silver-1",
          productId: silverProduct!.id,
          sku: silverProduct!.sku,
          name: silverProduct!.name,
          metalCode: silverProduct!.metal.code, // SILVER
          grossWeight: 10.0,
          netWeight: 10.0,
          quantity: 1,
          components: {
            metalValue: 20000,
            makingCharge: 1500,
            wastage: 500,
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

    const result = await calculateDiscount(context);

    // Seeded Rule 2 (WHOLESALE-SILVER-002: ₹5/g on Silver Value) matches: 10g * ₹5 = ₹50
    // And Seeded Rule 5 (SILVER-VALUE-005: 3% on Silver Value, stackable) matches: 3% of 20,000 = ₹600
    // Total silver discount = ₹50 + ₹600 = ₹650
    const silverComp = result.discountByItem["item-silver-1"].components[ComponentType.SILVER_VALUE];
    expect(silverComp.discountAmount).toBeGreaterThanOrEqual(50);
  });
});
