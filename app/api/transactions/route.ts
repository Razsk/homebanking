import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const isSubscription = searchParams.get("isSubscription");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limitParam = searchParams.get("limit");
    
    // limit 0 or "all" means return everything without limit
    const isUnlimited = limitParam === "0" || limitParam === "all";
    const limit = isUnlimited ? 0 : parseInt(limitParam || "100", 10);

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

    const totalCount = await prisma.transaction.count({ where });

    const findOptions: any = {
      where,
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: "desc" },
    };

    if (limit > 0) {
      findOptions.take = limit;
      findOptions.skip = (page - 1) * limit;
    }

    const transactions = await prisma.transaction.findMany(findOptions);
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

    const totalPages = limit > 0 ? Math.max(1, Math.ceil(totalCount / limit)) : 1;

    return NextResponse.json({
      transactions,
      categories,
      totalCount,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ids, categoryId, isSubscription } = body;

    // Bulk update multiple transactions
    if (Array.isArray(ids) && ids.length > 0) {
      const updateData: any = {};
      if (categoryId !== undefined) {
        updateData.categoryId = categoryId ? categoryId : null;
      }
      if (isSubscription !== undefined) {
        updateData.isSubscription = isSubscription;
      }

      const result = await prisma.transaction.updateMany({
        where: { id: { in: ids } },
        data: updateData,
      });

      return NextResponse.json({ success: true, count: result.count });
    }

    if (!id) {
      return NextResponse.json({ error: "Mangler transaktions-ID" }, { status: 400 });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(categoryId !== undefined ? { categoryId: categoryId ? categoryId : null } : {}),
        ...(isSubscription !== undefined ? { isSubscription } : {}),
      },
      include: { category: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
