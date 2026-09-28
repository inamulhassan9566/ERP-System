import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { ApprovalStatus, AuditEntityType, AuditAction } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.canApprove) {
      return NextResponse.json(
        { error: "Your role does not possess approval authority" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { comment = "Discount request rejected by management" } = body;

    const approvalReq = await prisma.approvalRequest.findUnique({
      where: { id },
    });

    if (!approvalReq) {
      return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
    }

    if (approvalReq.status !== ApprovalStatus.PENDING) {
      return NextResponse.json(
        { error: `This request is already ${approvalReq.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const updated = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: ApprovalStatus.REJECTED,
        reviewerId: user.id,
        reviewerComment: comment,
        reviewedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: AuditEntityType.APPROVAL,
        entityId: id,
        action: AuditAction.REJECT,
        userId: user.id,
        userName: user.name,
        details: JSON.stringify({
          requestCode: approvalReq.requestCode,
          requestedById: approvalReq.requestedById,
          reviewerComment: comment,
        }),
      },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
