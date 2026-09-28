import { describe, it, expect } from "vitest";
import { prisma } from "../lib/prisma";
import { ApprovalStatus } from "../lib/types";

describe("Rule Versioning & Approval Workflow Integration Tests", () => {
  it("Acceptance Test 13 & 57: Historical versioning retains historical calculation and does not overwrite", async () => {
    // 1. Create a test rule at Version 1 (20% making discount)
    const admin = await prisma.user.findFirst({ where: { role: { code: "ADMIN" } } });
    expect(admin).not.toBeNull();

    const testRule = await prisma.discountRule.create({
      data: {
        code: "RULE-HIST-TEST",
        name: "Historical Version Test Rule",
        status: "DRAFT",
        priority: 50,
        stackable: true,
        startDate: new Date("2026-01-01"),
        currentVersion: 1,
        createdById: admin!.id,
        components: {
          create: [
            {
              component: "MAKING_CHARGE",
              calculationMethod: "PERCENTAGE",
              discountValue: 20,
            },
          ],
        },
        versions: {
          create: {
            versionNumber: 1,
            snapshot: JSON.stringify({ rate: 20, component: "MAKING_CHARGE" }),
            changeSummary: "Initial Version 1 with 20% discount",
            changedById: admin!.id,
          },
        },
      },
    });

    // 2. Simulate transaction at Version 1
    const historicalTxn = await prisma.discountApplication.create({
      data: {
        transactionNumber: `TXN-V1-${Date.now()}`,
        userId: admin!.id,
        totalGrossAmount: 10000,
        totalDiscountAmount: 2000, // 20%
        totalFinalAmount: 8000,
        status: "APPLIED",
        calculationTrace: JSON.stringify({ version: 1, appliedRate: 20, discount: 2000 }),
        appliedComponents: {
          create: [
            {
              ruleId: testRule.id,
              ruleVersionNumber: 1, // Historical version preserved!
              componentType: "MAKING_CHARGE",
              originalValue: 10000,
              discountType: "PERCENTAGE",
              discountRate: 20,
              discountAmount: 2000,
              finalValue: 8000,
            },
          ],
        },
      },
      include: {
        appliedComponents: true,
      },
    });

    expect(historicalTxn.appliedComponents[0].ruleVersionNumber).toBe(1);
    expect(historicalTxn.appliedComponents[0].discountAmount).toBe(2000);

    // 3. Update Rule to Version 2 (25% making discount)
    await prisma.discountRuleComponent.updateMany({
      where: { ruleId: testRule.id, component: "MAKING_CHARGE" },
      data: { discountValue: 25 },
    });

    const updatedRule = await prisma.discountRule.update({
      where: { id: testRule.id },
      data: {
        currentVersion: 2,
        versions: {
          create: {
            versionNumber: 2,
            snapshot: JSON.stringify({ rate: 25, component: "MAKING_CHARGE" }),
            changeSummary: "Upgraded making discount to 25% for Version 2",
            changedById: admin!.id,
          },
        },
      },
      include: {
        versions: true,
        components: true,
      },
    });

    expect(updatedRule.currentVersion).toBe(2);
    expect(updatedRule.versions.length).toBe(2);

    // 4. Verify historical transaction STILL retains Version 1 and 20% discount!
    const retrievedHistoricalTxn = await prisma.discountApplication.findUnique({
      where: { id: historicalTxn.id },
      include: { appliedComponents: true },
    });

    expect(retrievedHistoricalTxn).not.toBeNull();
    expect(retrievedHistoricalTxn!.appliedComponents[0].ruleVersionNumber).toBe(1);
    expect(retrievedHistoricalTxn!.appliedComponents[0].discountRate).toBe(20);
    expect(retrievedHistoricalTxn!.appliedComponents[0].discountAmount).toBe(2000);
    expect(retrievedHistoricalTxn!.totalFinalAmount).toBe(8000);

    // Clean up test rule and transaction
    await prisma.discountApplicationComponent.deleteMany({ where: { discountApplicationId: historicalTxn.id } });
    await prisma.discountApplication.delete({ where: { id: historicalTxn.id } });
    await prisma.discountRuleVersion.deleteMany({ where: { ruleId: testRule.id } });
    await prisma.discountRuleComponent.deleteMany({ where: { ruleId: testRule.id } });
    await prisma.discountRule.delete({ where: { id: testRule.id } });
  });

  it("Acceptance Test 11 & 56: Approval workflow - pending request review and approval update", async () => {
    const salesUser = await prisma.user.findFirst({ where: { role: { code: "SALES_STAFF" } } });
    const managerUser = await prisma.user.findFirst({ where: { role: { code: "MANAGER" } } });

    expect(salesUser).not.toBeNull();
    expect(managerUser).not.toBeNull();

    // Create an approval request where sales requested 20% (exceeding 10% limit)
    const request = await prisma.approvalRequest.create({
      data: {
        requestCode: `APR-TEST-${Date.now()}`,
        requestedById: salesUser!.id,
        status: ApprovalStatus.PENDING,
        requestedDiscountPercent: 20,
        requestedDiscountAmount: 2000,
        userAllowedPercent: 10,
        userAllowedAmount: 1000,
        reason: "Customer requested 20% on making charge",
        transactionSnapshot: JSON.stringify({ item: "Gold Chain", gross: 10000 }),
        calculationPreview: JSON.stringify({ making: 10000, discount: 2000, final: 8000 }),
      },
    });

    expect(request.status).toBe(ApprovalStatus.PENDING);

    // Manager reviews and approves
    const reviewed = await prisma.approvalRequest.update({
      where: { id: request.id },
      data: {
        status: ApprovalStatus.APPROVED,
        reviewerId: managerUser!.id,
        reviewedAt: new Date(),
        reviewerComment: "Approved exceptional festive discount for VIP customer",
      },
    });

    expect(reviewed.status).toBe(ApprovalStatus.APPROVED);
    expect(reviewed.reviewerId).toBe(managerUser!.id);

    // Clean up
    await prisma.approvalRequest.delete({ where: { id: request.id } });
  });
});
