import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  RuleStatus,
  StackingMethod,
  CustomerTargetType,
  ProductTargetScope,
  ComponentType,
  CalculationMethod,
  WeightBasis,
  AuditEntityType,
  AuditAction,
} from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const rule = await prisma.discountRule.findUnique({
      where: { id },
      include: {
        target: {
          include: {
            targetCustomer: true,
            targetCustomerGroup: true,
            targetCategory: true,
            targetSubCategory: true,
            targetArticleGroup: true,
            targetArticle: true,
            targetMetal: true,
            targetPurity: true,
            targetBranch: true,
            targetSalesChannel: true,
          },
        },
        components: true,
        condition: true,
        versions: {
          include: {
            changedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { versionNumber: "desc" },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
        usages: {
          take: 10,
          orderBy: { discountApplication: { createdAt: "desc" } },
          include: {
            discountApplication: {
              select: {
                transactionNumber: true,
                createdAt: true,
                totalGrossAmount: true,
                totalDiscountAmount: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({ rule });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.roleCode === "SALES_STAFF") {
      return NextResponse.json(
        { error: "Sales staff cannot modify discount rules" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    const existingRule = await prisma.discountRule.findUnique({
      where: { id },
      include: { target: true, components: true, condition: true },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const {
      name = existingRule.name,
      description = existingRule.description,
      status = existingRule.status,
      priority = existingRule.priority,
      stackable = existingRule.stackable,
      stackingMethod = existingRule.stackingMethod,
      approvalRequired = existingRule.approvalRequired,
      startDate = existingRule.startDate,
      endDate = existingRule.endDate,
      startTime = existingRule.startTime,
      endTime = existingRule.endTime,
      daysOfWeek = existingRule.daysOfWeek,
      target,
      components,
      condition,
      changeSummary = "Rule configuration updated",
    } = body;

    const nextVersionNumber = existingRule.currentVersion + 1;

    // Execute update and version snapshot atomically
    const updatedRule = await prisma.$transaction(async (tx) => {
      // 1. Snapshot the new state in DiscountRuleVersion
      await tx.discountRuleVersion.create({
        data: {
          ruleId: id,
          versionNumber: nextVersionNumber,
          snapshot: JSON.stringify({
            name,
            description,
            status,
            priority,
            stackable,
            stackingMethod,
            target,
            components,
            condition,
          }),
          changeSummary: changeSummary || `Updated to Version ${nextVersionNumber}`,
          changedById: user.id,
        },
      });

      // 2. Update target
      if (target) {
        await tx.discountRuleTarget.upsert({
          where: { ruleId: id },
          create: {
            ruleId: id,
            targetCustomerType: target.targetCustomerType || CustomerTargetType.ALL,
            targetCustomerId: target.targetCustomerId || null,
            targetCustomerGroupId: target.targetCustomerGroupId || null,
            targetProductScope: target.targetProductScope || ProductTargetScope.ALL,
            targetCategoryId: target.targetCategoryId || null,
            targetSubCategoryId: target.targetSubCategoryId || null,
            targetArticleGroupId: target.targetArticleGroupId || null,
            targetArticleId: target.targetArticleId || null,
            targetSku: target.targetSku || null,
            targetMetalId: target.targetMetalId || null,
            targetPurityId: target.targetPurityId || null,
            targetBranchId: target.targetBranchId || null,
            targetSalesChannelId: target.targetSalesChannelId || null,
          },
          update: {
            targetCustomerType: target.targetCustomerType || CustomerTargetType.ALL,
            targetCustomerId: target.targetCustomerId || null,
            targetCustomerGroupId: target.targetCustomerGroupId || null,
            targetProductScope: target.targetProductScope || ProductTargetScope.ALL,
            targetCategoryId: target.targetCategoryId || null,
            targetSubCategoryId: target.targetSubCategoryId || null,
            targetArticleGroupId: target.targetArticleGroupId || null,
            targetArticleId: target.targetArticleId || null,
            targetSku: target.targetSku || null,
            targetMetalId: target.targetMetalId || null,
            targetPurityId: target.targetPurityId || null,
            targetBranchId: target.targetBranchId || null,
            targetSalesChannelId: target.targetSalesChannelId || null,
          },
        });
      }

      // 3. Update components
      if (components && Array.isArray(components)) {
        await tx.discountRuleComponent.deleteMany({ where: { ruleId: id } });
        await tx.discountRuleComponent.createMany({
          data: components.map((c: any) => ({
            ruleId: id,
            component: c.component as ComponentType,
            calculationMethod: (c.calculationMethod || CalculationMethod.PERCENTAGE) as CalculationMethod,
            discountValue: Number(c.discountValue) || 0,
            weightBasis: (c.weightBasis || WeightBasis.NET_WEIGHT) as WeightBasis,
            maxDiscountPercent: c.maxDiscountPercent ? Number(c.maxDiscountPercent) : null,
            maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
            maxPerItem: c.maxPerItem ? Number(c.maxPerItem) : null,
            maxPerBill: c.maxPerBill ? Number(c.maxPerBill) : null,
          })),
        });
      }

      // 4. Update conditions
      if (condition) {
        await tx.discountRuleCondition.upsert({
          where: { ruleId: id },
          create: {
            ruleId: id,
            minBillValue: condition.minBillValue ? Number(condition.minBillValue) : null,
            maxBillValue: condition.maxBillValue ? Number(condition.maxBillValue) : null,
            minQuantity: condition.minQuantity ? Number(condition.minQuantity) : null,
            maxQuantity: condition.maxQuantity ? Number(condition.maxQuantity) : null,
            minWeight: condition.minWeight ? Number(condition.minWeight) : null,
            maxWeight: condition.maxWeight ? Number(condition.maxWeight) : null,
            minItemValue: condition.minItemValue ? Number(condition.minItemValue) : null,
            maxItemValue: condition.maxItemValue ? Number(condition.maxItemValue) : null,
            customConditions: condition.customConditions || null,
          },
          update: {
            minBillValue: condition.minBillValue ? Number(condition.minBillValue) : null,
            maxBillValue: condition.maxBillValue ? Number(condition.maxBillValue) : null,
            minQuantity: condition.minQuantity ? Number(condition.minQuantity) : null,
            maxQuantity: condition.maxQuantity ? Number(condition.maxQuantity) : null,
            minWeight: condition.minWeight ? Number(condition.minWeight) : null,
            maxWeight: condition.maxWeight ? Number(condition.maxWeight) : null,
            minItemValue: condition.minItemValue ? Number(condition.minItemValue) : null,
            maxItemValue: condition.maxItemValue ? Number(condition.maxItemValue) : null,
            customConditions: condition.customConditions || null,
          },
        });
      }

      // 5. Update parent rule
      return tx.discountRule.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          status: status as RuleStatus,
          priority: Number(priority) || 10,
          stackable: Boolean(stackable),
          stackingMethod: stackingMethod as StackingMethod,
          approvalRequired: Boolean(approvalRequired),
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          startTime: startTime || null,
          endTime: endTime || null,
          daysOfWeek: daysOfWeek || "ALL",
          currentVersion: nextVersionNumber,
          updatedById: user.id,
        },
        include: {
          target: true,
          components: true,
          condition: true,
          versions: true,
        },
      });
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: AuditEntityType.RULE,
        entityId: id,
        action: AuditAction.UPDATE,
        userId: user.id,
        userName: user.name,
        details: JSON.stringify({
          code: updatedRule.code,
          version: nextVersionNumber,
          changeSummary,
        }),
      },
    });

    return NextResponse.json({ success: true, rule: updatedRule });
  } catch (error: any) {
    console.error("Update discount rule error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.roleCode !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can delete discount rules" },
        { status: 403 }
      );
    }

    const { id } = params;

    const rule = await prisma.discountRule.findUnique({
      where: { id },
      include: { usages: true },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    // If rule has been used in actual transactions, do not delete; deactivate to preserve historical integrity!
    if (rule.usages && rule.usages.length > 0) {
      const deactivated = await prisma.discountRule.update({
        where: { id },
        data: { status: RuleStatus.INACTIVE, updatedById: user.id },
      });

      await prisma.auditLog.create({
        data: {
          entityType: AuditEntityType.RULE,
          entityId: id,
          action: AuditAction.DEACTIVATE,
          userId: user.id,
          userName: user.name,
          details: JSON.stringify({
            code: rule.code,
            reason: "Deactivated instead of deleted because rule is referenced by historical transactions",
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Rule has transaction history. Status updated to INACTIVE to preserve audit records.",
        rule: deactivated,
      });
    }

    // If no transaction history, safe to delete cascading
    await prisma.$transaction([
      prisma.discountRuleVersion.deleteMany({ where: { ruleId: id } }),
      prisma.discountRuleComponent.deleteMany({ where: { ruleId: id } }),
      prisma.discountRuleCondition.deleteMany({ where: { ruleId: id } }),
      prisma.discountRuleTarget.deleteMany({ where: { ruleId: id } }),
      prisma.discountRule.delete({ where: { id } }),
    ]);

    await prisma.auditLog.create({
      data: {
        entityType: AuditEntityType.RULE,
        entityId: id,
        action: AuditAction.DELETE,
        userId: user.id,
        userName: user.name,
        details: JSON.stringify({ code: rule.code, name: rule.name }),
      },
    });

    return NextResponse.json({ success: true, message: "Rule successfully deleted" });
  } catch (error: any) {
    console.error("Delete discount rule error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
