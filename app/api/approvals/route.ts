import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { ApprovalStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status as ApprovalStatus;
    }

    // Sales staff only see their own requests; Managers & Admins see all requests
    if (user.roleCode === "SALES_STAFF") {
      where.requestedById = user.id;
    }

    const requests = await prisma.approvalRequest.findMany({
      where,
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, role: { select: { name: true, code: true } } },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const pendingCount = await prisma.approvalRequest.count({
      where: { status: ApprovalStatus.PENDING },
    });

    return NextResponse.json({ requests, pendingCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
