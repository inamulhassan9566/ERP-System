import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { AuditEntityType, AuditAction } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const where: any = {};

    if (entityType && entityType !== "ALL") {
      where.entityType = entityType as AuditEntityType;
    }

    if (action && action !== "ALL") {
      where.action = action as AuditAction;
    }

    if (userId && userId !== "ALL") {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { userName: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    });

    const applications = await prisma.discountApplication.findMany({
      take: 20,
      include: {
        user: { select: { name: true } },
        customer: { select: { name: true, code: true } },
        items: true,
        appliedComponents: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ logs, applications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
