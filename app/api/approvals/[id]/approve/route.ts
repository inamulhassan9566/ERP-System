import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { ApprovalStatus, AuditEntityType, AuditAction, ApplicationStatus } from "@prisma/client";

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
    const { comment = "Approved by management" } = body;

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

    // Update approval status
    const updated = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: ApprovalStatus.APPROVED,
        reviewerId: user.id,
        reviewerComment: comment,
        reviewedAt: new Date(),
      },
    });

    // Also record an approved discount application if snapshot exists
    let txnSnapshot: any = null;
    let preview: any = null;
    try {
      txnSnapshot = JSON.parse(approvalReq.transactionSnapshot);
      preview = JSON.parse(approvalReq.calculationPreview);
    } catch {}

    const txnNumber = `TXN-APR-${approvalReq.requestCode}`;
    const totalGross = preview?.finalValue ? preview.finalValue + approvalReq.requestedDiscountAmount : 50000;

    await prisma.discountApplication.create({
      data: {
        transactionNumber: txnNumber,
        userId: approvalReq.requestedById,
        approvalRequestId: approvalReq.id,
        totalGrossAmount: totalGross,
        totalDiscountAmount: approvalReq.requestedDiscountAmount,
        totalFinalAmount: Math.max(0, totalGross - approvalReq.requestedDiscountAmount),
        status: ApplicationStatus.APPLIED,
        isManual: true,
        notes: `Applied following manager approval (${approvalReq.requestCode}) by ${user.name}: ${comment}`,
        calculationTrace: JSON.stringify({
          approvalRequest: approvalReq.requestCode,
          approvedBy: user.name,
          requestedPercent: approvalReq.requestedDiscountPercent,
          approvedAmount: approvalReq.requestedDiscountAmount,
          comment,
        }),
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        entityType: AuditEntityType.APPROVAL,
        entityId: id,
        action: AuditAction.APPROVE,
        userId: user.id,
        userName: user.name,
        details: JSON.stringify({
          requestCode: approvalReq.requestCode,
          requestedById: approvalReq.requestedById,
          requestedAmount: approvalReq.requestedDiscountAmount,
          reviewerComment: comment,
        }),
      },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error("Approve error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
