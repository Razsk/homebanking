import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const rules = await prisma.classificationRule.findMany({
      include: { category: true },
      orderBy: { priority: "desc" },
    });
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ rules, categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pattern, categoryId, matchType = "contains", isSubscription = false, priority = 10 } = body;

    const rule = await prisma.classificationRule.create({
      data: {
        pattern,
        categoryId,
        matchType,
        isSubscription,
        priority: parseInt(priority, 10) || 10,
      },
      include: { category: true },
    });

    return NextResponse.json(rule);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.classificationRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
