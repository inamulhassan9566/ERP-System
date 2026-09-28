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
        { error: "Sales staff cannot change rule status" },
        { status: 403 }
      );
    }

    const { id } = params;

    const rule = await prisma.discountRule.update({
      where: { id },
      data: {
        status: RuleStatus.INACTIVE,
        updatedById: user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: AuditEntityType.RULE,
        entityId: id,
        action: AuditAction.DEACTIVATE,
        userId: user.id,
        userName: user.name,
        details: JSON.stringify({ code: rule.code, status: RuleStatus.INACTIVE }),
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
