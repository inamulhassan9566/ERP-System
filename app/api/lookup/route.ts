import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      customers,
      customerGroups,
      customerTypes,
      customerTiers,
      products,
      categories,
      subCategories,
      articleGroups,
      articles,
      metals,
      purities,
      branches,
      salesChannels,
      discountReasons,
      roles,
      users,
    ] = await Promise.all([
      prisma.customer.findMany({
        include: { customerGroup: true, customerType: true, customerTier: true },
        orderBy: { name: "asc" },
      }),
      prisma.customerGroup.findMany({ orderBy: { name: "asc" } }),
      prisma.customerType.findMany({ orderBy: { name: "asc" } }),
      prisma.customerTier.findMany({ orderBy: { name: "asc" } }),
      prisma.product.findMany({
        include: {
          category: true,
          subCategory: true,
          articleGroup: true,
          article: true,
          metal: true,
          purity: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.subCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.articleGroup.findMany({ orderBy: { name: "asc" } }),
      prisma.article.findMany({ orderBy: { name: "asc" } }),
      prisma.metal.findMany({ include: { purities: true }, orderBy: { name: "asc" } }),
      prisma.purity.findMany({ orderBy: { name: "asc" } }),
      prisma.branch.findMany({ orderBy: { name: "asc" } }),
      prisma.salesChannel.findMany({ orderBy: { name: "asc" } }),
      prisma.discountReason.findMany({ orderBy: { name: "asc" } }),
      prisma.role.findMany({ orderBy: { name: "asc" } }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: { select: { code: true, name: true } } },
      }),
    ]);

    return NextResponse.json({
      customers,
      customerGroups,
      customerTypes,
      customerTiers,
      products,
      categories,
      subCategories,
      articleGroups,
      articles,
      metals,
      purities,
      branches,
      salesChannels,
      discountReasons,
      roles,
      users,
    });
  } catch (error: any) {
    console.error("Lookup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
