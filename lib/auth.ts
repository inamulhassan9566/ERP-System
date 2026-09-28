import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { AuthUser } from "./types";

const AUTH_COOKIE_NAME = "jewellery_erp_session";
const JWT_SECRET = process.env.AUTH_SECRET || "super-secret-jwt-key-for-jewellery-erp-discount-engine-2026";

export function signJwtToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyJwtToken<T>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(request?: NextRequest): Promise<AuthUser | null> {
  try {
    let token: string | undefined;

    if (request) {
      token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      if (!token) {
        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7);
        }
      }
    } else {
      const cookieStore = cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    }

    if (!token) {
      return null;
    }

    const decoded = verifyJwtToken<{ userId: string }>(token);
    if (!decoded || !decoded.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
        branch: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.role.id,
      roleCode: user.role.code as "ADMIN" | "MANAGER" | "SALES_STAFF",
      roleName: user.role.name,
      maxDiscountPercent: user.role.maxDiscountPercent,
      maxDiscountAmount: user.role.maxDiscountAmount,
      canOverridePrice: user.role.canOverridePrice,
      canDiscountBill: user.role.canDiscountBill,
      canApprove: user.role.canApprove,
      allowedComponents: user.role.allowedComponents,
      branchId: user.branchId,
      branchName: user.branch?.name ?? null,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

export function checkUserDiscountAuthority(
  user: AuthUser,
  requestedPercent: number,
  requestedAmount: number,
  component?: string
): {
  allowed: boolean;
  reason?: string;
  maxAllowedPercent: number;
  maxAllowedAmount: number;
} {
  // Admin has 100% authority
  if (user.roleCode === "ADMIN") {
    return {
      allowed: true,
      maxAllowedPercent: 100,
      maxAllowedAmount: user.maxDiscountAmount,
    };
  }

  // Component check: if specified and not allowed for role
  if (component && component !== "ENTIRE_BILL") {
    if (user.allowedComponents.length > 0 && !user.allowedComponents.includes(component)) {
      return {
        allowed: false,
        reason: `Role '${user.roleName}' is not authorized to give manual discounts on component '${component}'. Allowed: ${user.allowedComponents.join(", ")}`,
        maxAllowedPercent: user.maxDiscountPercent,
        maxAllowedAmount: user.maxDiscountAmount,
      };
    }
  }

  if (component === "ENTIRE_BILL" && !user.canDiscountBill) {
    return {
      allowed: false,
      reason: `Role '${user.roleName}' is not authorized to apply bill-level discounts directly. Manager approval required.`,
      maxAllowedPercent: user.maxDiscountPercent,
      maxAllowedAmount: user.maxDiscountAmount,
    };
  }

  // Percentage check
  if (requestedPercent > user.maxDiscountPercent) {
    return {
      allowed: false,
      reason: `Requested discount of ${requestedPercent.toFixed(1)}% exceeds user authority limit of ${user.maxDiscountPercent}%.`,
      maxAllowedPercent: user.maxDiscountPercent,
      maxAllowedAmount: user.maxDiscountAmount,
    };
  }

  // Amount check
  if (requestedAmount > user.maxDiscountAmount) {
    return {
      allowed: false,
      reason: `Requested discount amount of ₹${requestedAmount.toLocaleString()} exceeds user authority limit of ₹${user.maxDiscountAmount.toLocaleString()}.`,
      maxAllowedPercent: user.maxDiscountPercent,
      maxAllowedAmount: user.maxDiscountAmount,
    };
  }

  return {
    allowed: true,
    maxAllowedPercent: user.maxDiscountPercent,
    maxAllowedAmount: user.maxDiscountAmount,
  };
}
