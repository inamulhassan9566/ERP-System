import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RuleStatus, ApprovalStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      activeRulesCount,
      draftRulesCount,
      inactiveRulesCount,
      expiredRulesCount,
      pendingApprovalsCount,
      todayApplications,
      recentActivity,
      recentTransactions,
      allRules,
    ] = await Promise.all([
      prisma.discountRule.count({ where: { status: RuleStatus.ACTIVE } }),
      prisma.discountRule.count({ where: { status: RuleStatus.DRAFT } }),
      prisma.discountRule.count({ where: { status: RuleStatus.INACTIVE } }),
      prisma.discountRule.count({ where: { status: RuleStatus.EXPIRED } }),
      prisma.approvalRequest.count({ where: { status: ApprovalStatus.PENDING } }),
      prisma.discountApplication.findMany({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, role: { select: { name: true } } } },
        },
      }),
      prisma.discountApplication.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true, code: true } },
          user: { select: { name: true } },
          items: true,
          appliedComponents: true,
        },
      }),
      prisma.discountRule.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          priority: true,
          status: true,
          _count: { select: { usages: true } },
        },
        orderBy: { usages: { _count: "desc" } },
        take: 5,
      }),
    ]);

    const discountsAppliedToday = todayApplications.length;
    const totalDiscountAmountToday = todayApplications.reduce((acc, a) => acc + (a.totalDiscountAmount || 0), 0);
    const manualDiscountsToday = todayApplications.filter((a) => a.isManual).length;
    const autoDiscountsToday = todayApplications.filter((a) => !a.isManual).length;

    // Detect potential rule conflicts in active rules with same priority
    const activeRulesForConflict = await prisma.discountRule.findMany({
      where: { status: RuleStatus.ACTIVE },
      include: { components: true },
    });

    let detectedConflictsCount = 0;
    const priorityComponentMap = new Map<string, number>();
    for (const r of activeRulesForConflict) {
      if (!r.stackable) {
        for (const c of r.components) {
          const key = `${r.priority}_${c.component}`;
          const current = priorityComponentMap.get(key) || 0;
          if (current > 0) {
            detectedConflictsCount++;
          }
          priorityComponentMap.set(key, current + 1);
        }
      }
    }

    return NextResponse.json({
      metrics: {
        activeRulesCount,
        draftRulesCount,
        inactiveRulesCount,
        expiredRulesCount,
        pendingApprovalsCount,
        discountsAppliedToday,
        totalDiscountAmountToday,
        manualDiscountsToday,
        autoDiscountsToday,
        conflictsCount: detectedConflictsCount,
      },
      recentActivity,
      recentTransactions,
      topPerformingRules: allRules.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        priority: r.priority,
        status: r.status,
        usageCount: r._count.usages,
      })),
    });
  } catch (error: any) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
