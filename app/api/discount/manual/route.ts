import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, checkUserDiscountAuthority } from "@/lib/auth";
import { computeRawDiscountAmount, getComponentValue } from "@/services/discount/calculator";
import {
  ComponentType,
  CalculationMethod,
  WeightBasis,
  ApprovalStatus,
  ApplicationStatus,
  AuditEntityType,
  AuditAction,
} from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      itemId,
      productId,
      sku,
      productName,
      component,
      calculationMethod = CalculationMethod.PERCENTAGE,
      discountValue,
      weightBasis = WeightBasis.NET_WEIGHT,
      grossWeight = 0,
      netWeight = 0,
      stoneCarat = 0,
      quantity = 1,
      components,
      reason,
      branchId,
      salesChannelId,
    } = body;

    if (!component || discountValue === undefined || discountValue === null || discountValue <= 0) {
      return NextResponse.json(
        { error: "Component and a positive discount value are required" },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "A reason is mandatory for manual discount application" },
        { status: 400 }
      );
    }

    const origValue = getComponentValue(component as ComponentType, components);
    if (origValue <= 0 && component !== ComponentType.ENTIRE_ITEM) {
      return NextResponse.json(
        { error: `The selected component '${component}' has a value of ₹0 in this item.` },
        { status: 400 }
      );
    }

    const fakeItem = {
      id: itemId || "item-manual",
      sku: sku || "SKU-MANUAL",
      name: productName || "Manual Item",
      quantity: Number(quantity) || 1,
      grossWeight: Number(grossWeight) || 0,
      netWeight: Number(netWeight) || 0,
      stoneCarat: Number(stoneCarat) || 0,
      components,
    };

    const calculatedDiscountAmount = computeRawDiscountAmount(
      calculationMethod as CalculationMethod,
      Number(discountValue),
      origValue,
      fakeItem,
      weightBasis as WeightBasis
    );

    const calculatedPercent = origValue > 0 ? (calculatedDiscountAmount / origValue) * 100 : 0;

    // Check user authority on server side
    const authorityCheck = checkUserDiscountAuthority(
      user,
      calculatedPercent,
      calculatedDiscountAmount,
      component
    );

    // If authority check fails -> MUST create Approval Request
    if (!authorityCheck.allowed) {
      const requestCode = `APR-${Date.now().toString().slice(-6)}`;

      const approvalRequest = await prisma.approvalRequest.create({
        data: {
          requestCode,
          requestedById: user.id,
          status: ApprovalStatus.PENDING,
          requestedDiscountPercent: calculatedPercent,
          requestedDiscountAmount: calculatedDiscountAmount,
          userAllowedPercent: authorityCheck.maxAllowedPercent,
          userAllowedAmount: authorityCheck.maxAllowedAmount,
          reason: reason.trim(),
          transactionSnapshot: JSON.stringify({
            customerId,
            sku,
            productName,
            component,
            originalValue: origValue,
            components,
          }),
          calculationPreview: JSON.stringify({
            component,
            calculationMethod,
            discountValue,
            calculatedDiscountAmount,
            finalValue: origValue - calculatedDiscountAmount,
          }),
        },
      });

      await prisma.auditLog.create({
        data: {
          entityType: AuditEntityType.APPROVAL,
          entityId: approvalRequest.id,
          action: AuditAction.CREATE,
          userId: user.id,
          userName: user.name,
          details: JSON.stringify({
            requestCode,
            reason: authorityCheck.reason,
            requestedAmount: calculatedDiscountAmount,
            requestedPercent: calculatedPercent,
          }),
        },
      });

      return NextResponse.json({
        applied: false,
        approvalRequired: true,
        approvalRequest,
        message: authorityCheck.reason || "Discount exceeds user limit. Approval request submitted to manager queue.",
        preview: {
          originalValue: origValue,
          discountAmount: calculatedDiscountAmount,
          finalValue: Math.max(0, origValue - calculatedDiscountAmount),
        },
      });
    }

    // Within authority -> Apply directly!
    const txnNumber = `TXN-${Date.now().toString().slice(-6)}`;
    const totalGross =
      (components.metalValue || 0) +
      (components.makingCharge || 0) +
      (components.wastage || 0) +
      (components.stoneValue || 0) +
      (components.hallmarkCharge || 0) +
      (components.certificationCharge || 0) +
      (components.engraving || 0) +
      (components.polishing || 0) +
      (components.otherCharges || 0);

    const discountApplication = await prisma.discountApplication.create({
      data: {
        transactionNumber: txnNumber,
        customerId: customerId || null,
        branchId: branchId || user.branchId || null,
        salesChannelId: salesChannelId || null,
        userId: user.id,
        totalGrossAmount: totalGross,
        totalDiscountAmount: calculatedDiscountAmount,
        totalFinalAmount: Math.max(0, totalGross - calculatedDiscountAmount),
        status: ApplicationStatus.APPLIED,
        isManual: true,
        notes: `Manual discount applied: ${reason}`,
        calculationTrace: JSON.stringify({
          type: "MANUAL_DISCOUNT",
          component,
          method: calculationMethod,
          rateOrValue: discountValue,
          originalValue: origValue,
          discountAmount: calculatedDiscountAmount,
          appliedBy: user.name,
          reason,
        }),

        items: {
          create: [
            {
              productId: productId || null,
              sku: sku || "MANUAL-SKU",
              productName: productName || "Jewellery Article",
              quantity: Number(quantity) || 1,
              grossWeight: Number(grossWeight) || 0,
              netWeight: Number(netWeight) || 0,
              totalGross,
              totalDiscount: calculatedDiscountAmount,
              totalFinal: Math.max(0, totalGross - calculatedDiscountAmount),
            },
          ],
        },

        appliedComponents: {
          create: [
            {
              componentType: component as ComponentType,
              originalValue: origValue,
              discountType: calculationMethod as CalculationMethod,
              discountRate: Number(discountValue),
              discountAmount: calculatedDiscountAmount,
              finalValue: Math.max(0, origValue - calculatedDiscountAmount),
              isManual: true,
              manualReason: reason,
            },
          ],
        },
      },
      include: {
        items: true,
        appliedComponents: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: AuditEntityType.MANUAL_DISCOUNT,
        entityId: discountApplication.id,
        action: AuditAction.APPLY,
        userId: user.id,
        userName: user.name,
        details: JSON.stringify({
          transactionNumber: txnNumber,
          component,
          discountAmount: calculatedDiscountAmount,
          originalValue: origValue,
          finalValue: origValue - calculatedDiscountAmount,
          reason,
        }),
      },
    });

    return NextResponse.json({
      applied: true,
      approvalRequired: false,
      discountApplication,
      message: `Manual discount of ₹${calculatedDiscountAmount.toLocaleString()} applied successfully!`,
      result: {
        originalValue: origValue,
        discountAmount: calculatedDiscountAmount,
        finalValue: Math.max(0, origValue - calculatedDiscountAmount),
      },
    });
  } catch (error: any) {
    console.error("Manual discount error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
