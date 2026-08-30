import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const isSubscription = searchParams.get("isSubscription");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const where: any = {};
    if (accountId) where.accountId = accountId;
    if (categoryId) where.categoryId = categoryId;
    if (isSubscription === "true") where.isSubscription = true;
    if (search) {
      where.OR = [
        { text: { contains: search } },
        { counterparty: { contains: search } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

    return NextResponse.json({ transactions, categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, categoryId, isSubscription } = body;

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(isSubscription !== undefined ? { isSubscription } : {}),
      },
      include: { category: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
