import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { RuleStatus, AuditEntityType, AuditAction } from "@prisma/client";

export async function POST(
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
        { error: "Sales staff cannot duplicate rules" },
        { status: 403 }
      );
    }

    const { id } = params;

    const source = await prisma.discountRule.findUnique({
      where: { id },
      include: { target: true, components: true, condition: true },
    });

    if (!source) {
      return NextResponse.json({ error: "Source rule not found" }, { status: 404 });
    }

    const newCode = `${source.code}-COPY-${Date.now().toString().slice(-4)}`;

    const duplicated = await prisma.discountRule.create({
      data: {
        code: newCode,
        name: `${source.name} (Copy)`,
        description: source.description,
        status: RuleStatus.DRAFT,
        priority: source.priority,
        stackable: source.stackable,
        stackingMethod: source.stackingMethod,
        approvalRequired: source.approvalRequired,
        startDate: new Date(),
        endDate: source.endDate,
        startTime: source.startTime,
        endTime: source.endTime,
        daysOfWeek: source.daysOfWeek,
        currentVersion: 1,
        createdById: user.id,
        updatedById: user.id,

        target: source.target
          ? {
              create: {
                targetCustomerType: source.target.targetCustomerType,
                targetCustomerId: source.target.targetCustomerId,
                targetCustomerGroupId: source.target.targetCustomerGroupId,
                targetProductScope: source.target.targetProductScope,
                targetCategoryId: source.target.targetCategoryId,
                targetSubCategoryId: source.target.targetSubCategoryId,
                targetArticleGroupId: source.target.targetArticleGroupId,
                targetArticleId: source.target.targetArticleId,
                targetSku: source.target.targetSku,
                targetMetalId: source.target.targetMetalId,
                targetPurityId: source.target.targetPurityId,
                targetBranchId: source.target.targetBranchId,
                targetSalesChannelId: source.target.targetSalesChannelId,
              },
            }
          : undefined,

        components: {
          create: source.components.map((c) => ({
            component: c.component,
            calculationMethod: c.calculationMethod,
            discountValue: c.discountValue,
            weightBasis: c.weightBasis,
            maxDiscountPercent: c.maxDiscountPercent,
            maxDiscountAmount: c.maxDiscountAmount,
            maxPerItem: c.maxPerItem,
            maxPerBill: c.maxPerBill,
          })),
        },

        condition: source.condition
          ? {
              create: {
                minBillValue: source.condition.minBillValue,
                maxBillValue: source.condition.maxBillValue,
                minQuantity: source.condition.minQuantity,
                maxQuantity: source.condition.maxQuantity,
                minWeight: source.condition.minWeight,
                maxWeight: source.condition.maxWeight,
                minItemValue: source.condition.minItemValue,
                maxItemValue: source.condition.maxItemValue,
                customConditions: source.condition.customConditions,
              },
            }
          : undefined,

        versions: {
          create: {
            versionNumber: 1,
            snapshot: JSON.stringify({
              code: newCode,
              copiedFrom: source.code,
              name: `${source.name} (Copy)`,
            }),
            changeSummary: `Duplicated from ${source.code}`,
            changedById: user.id,
          },
        },
      },
      include: {
        target: true,
        components: true,
        condition: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: AuditEntityType.RULE,
        entityId: duplicated.id,
        action: AuditAction.CREATE,
        userId: user.id,
        userName: user.name,
        details: JSON.stringify({
          action: "DUPLICATE",
          sourceRuleCode: source.code,
          newRuleCode: duplicated.code,
        }),
      },
    });

    return NextResponse.json({ success: true, rule: duplicated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
