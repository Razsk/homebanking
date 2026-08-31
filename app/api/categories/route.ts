import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { transactions: true, rules: true, subscriptions: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, color, icon, isIncome } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Kategorinavn er påkrævet" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        color: color || "#3b82f6",
        icon: icon || "Tag",
        isIncome: Boolean(isIncome),
      },
    });
    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, color, icon, isIncome } = await req.json();
    if (!id || !name?.trim()) {
      return NextResponse.json({ error: "ID og navn er påkrævet" }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        color: color || "#3b82f6",
        icon: icon || "Tag",
        isIncome: Boolean(isIncome),
      },
    });
    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID mangler" }, { status: 400 });
    }

    // Find or create fallback category "Andet / Diverse"
    let fallback = await prisma.category.findFirst({
      where: { name: "Andet / Diverse", NOT: { id } },
    });

    if (fallback) {
      await prisma.transaction.updateMany({
        where: { categoryId: id },
        data: { categoryId: fallback.id },
      });
      await prisma.subscription.updateMany({
        where: { categoryId: id },
        data: { categoryId: fallback.id },
      });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
