import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { RuleStatus, StackingMethod, CustomerTargetType, ProductTargetScope, ComponentType, CalculationMethod, WeightBasis, AuditEntityType, AuditAction } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const customerGroup = searchParams.get("customerGroup");
    const category = searchParams.get("category");
    const component = searchParams.get("component");

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status as RuleStatus;
    }

    if (priority) {
      where.priority = parseInt(priority, 10);
    }

    if (customerGroup && customerGroup !== "ALL") {
      where.target = {
        ...where.target,
        OR: [
          { targetCustomerGroupId: customerGroup },
          { targetCustomerGroup: { code: customerGroup } },
        ],
      };
    }

    if (category && category !== "ALL") {
      where.target = {
        ...where.target,
        targetCategoryId: category,
      };
    }

    if (component && component !== "ALL") {
      where.components = {
        some: {
          component: component as ComponentType,
        },
      };
    }

    const rules = await prisma.discountRule.findMany({
      where,
      include: {
        target: {
          include: {
            targetCustomer: { select: { id: true, name: true, code: true } },
            targetCustomerGroup: { select: { id: true, name: true, code: true } },
            targetCategory: { select: { id: true, name: true, code: true } },
            targetMetal: { select: { id: true, name: true, code: true } },
            targetPurity: { select: { id: true, name: true, code: true } },
            targetArticle: { select: { id: true, name: true, code: true } },
          },
        },
        components: true,
        condition: true,
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
        _count: {
          select: { versions: true, usages: true },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ rules, total: rules.length });
  } catch (error: any) {
    console.error("Fetch discount rules error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sales staff cannot create discount rules
    if (user.roleCode === "SALES_STAFF") {
      return NextResponse.json(
        { error: "Sales staff do not have permission to create discount rules. Manager or Admin required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      code,
      name,
      description,
      status = RuleStatus.DRAFT,
      priority = 10,
      stackable = false,
      stackingMethod = StackingMethod.STACK,
      approvalRequired = false,
      startDate,
      endDate,
      startTime,
      endTime,
      daysOfWeek,
      target,
      components,
      condition,
    } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: "Rule code and rule name are required" },
        { status: 400 }
      );
    }

    // Check code uniqueness
    const existingRule = await prisma.discountRule.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (existingRule) {
      return NextResponse.json(
        { error: `Rule code '${code}' already exists. Please choose a unique rule identifier.` },
        { status: 409 }
      );
    }

    if (!components || !Array.isArray(components) || components.length === 0) {
      return NextResponse.json(
        { error: "At least one discount component must be configured" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Create Rule and related records in transaction
    const newRule = await prisma.discountRule.create({
      data: {
        code: cleanCode,
        name: name.trim(),
        description: description?.trim() || null,
        status: status as RuleStatus,
        priority: Number(priority) || 10,
        stackable: Boolean(stackable),
        stackingMethod: stackingMethod as StackingMethod,
        approvalRequired: Boolean(approvalRequired),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        startTime: startTime || null,
        endTime: endTime || null,
        daysOfWeek: daysOfWeek || "ALL",
        currentVersion: 1,
        createdById: user.id,
        updatedById: user.id,

        target: target
          ? {
              create: {
                targetCustomerType: (target.targetCustomerType || CustomerTargetType.ALL) as CustomerTargetType,
                targetCustomerId: target.targetCustomerId || null,
                targetCustomerGroupId: target.targetCustomerGroupId || null,
                targetProductScope: (target.targetProductScope || ProductTargetScope.ALL) as ProductTargetScope,
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
            }
          : undefined,

        components: {
          create: components.map((c: any) => ({
            component: c.component as ComponentType,
            calculationMethod: (c.calculationMethod || CalculationMethod.PERCENTAGE) as CalculationMethod,
            discountValue: Number(c.discountValue) || 0,
            weightBasis: (c.weightBasis || WeightBasis.NET_WEIGHT) as WeightBasis,
            maxDiscountPercent: c.maxDiscountPercent ? Number(c.maxDiscountPercent) : null,
            maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
            maxPerItem: c.maxPerItem ? Number(c.maxPerItem) : null,
            maxPerBill: c.maxPerBill ? Number(c.maxPerBill) : null,
          })),
        },

        condition: condition
          ? {
              create: {
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
            }
          : undefined,

        versions: {
          create: {
            versionNumber: 1,
            snapshot: JSON.stringify({
              code: cleanCode,
              name: name.trim(),
              status,
              priority,
              stackable,
              stackingMethod,
              target,
              components,
              condition,
            }),
            changeSummary: "Initial version created",
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

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        entityType: AuditEntityType.RULE,
        entityId: newRule.id,
        action: AuditAction.CREATE,
        userId: user.id,
        userName: user.name,
        details: JSON.stringify({
          code: newRule.code,
          name: newRule.name,
          status: newRule.status,
          priority: newRule.priority,
          componentsCount: components.length,
        }),
      },
    });

    return NextResponse.json({ success: true, rule: newRule }, { status: 201 });
  } catch (error: any) {
    console.error("Create discount rule error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
