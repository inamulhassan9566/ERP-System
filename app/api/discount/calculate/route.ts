import { NextRequest, NextResponse } from "next/server";
import { calculateDiscount } from "@/services/discount/engine";
import { TransactionContext } from "@/lib/types";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();

    const context: TransactionContext = {
      ...body,
      userId: user?.id || body.userId || "anonymous",
      userRoleCode: user?.roleCode || body.userRoleCode || "SALES_STAFF",
      userMaxDiscountPercent: user?.maxDiscountPercent ?? body.userMaxDiscountPercent ?? 10,
      userMaxDiscountAmount: user?.maxDiscountAmount ?? body.userMaxDiscountAmount ?? 10000,
      userCanDiscountBill: user?.canDiscountBill ?? body.userCanDiscountBill ?? false,
      userAllowedComponents: user?.allowedComponents ?? body.userAllowedComponents ?? ["MAKING_CHARGE"],
    };

    const calculationResult = await calculateDiscount(context);

    return NextResponse.json(calculationResult);
  } catch (error: any) {
    console.error("Discount calculation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate discount" },
      { status: 500 }
    );
  }
}
