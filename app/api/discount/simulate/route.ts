import { NextRequest, NextResponse } from "next/server";
import { calculateDiscount } from "@/services/discount/engine";
import { TransactionContext } from "@/lib/types";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const { context, tempRule } = body;

    const transactionContext: TransactionContext = {
      ...(context || body),
      userId: user?.id || (context || body).userId || "simulator-user",
      userRoleCode: user?.roleCode || (context || body).userRoleCode || "ADMIN",
      userMaxDiscountPercent: user?.maxDiscountPercent ?? (context || body).userMaxDiscountPercent ?? 100,
      userMaxDiscountAmount: user?.maxDiscountAmount ?? (context || body).userMaxDiscountAmount ?? 1000000,
    };

    // If simulating a temporary or draft rule without saving to DB
    const calculationResult = await calculateDiscount(
      transactionContext,
      tempRule ? [tempRule] : undefined
    );

    return NextResponse.json({
      success: true,
      simulation: calculationResult,
    });
  } catch (error: any) {
    console.error("Simulation error:", error);
    return NextResponse.json(
      { error: error.message || "Simulation failed" },
      { status: 500 }
    );
  }
}
