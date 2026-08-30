import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(accounts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, customName, isHidden } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Konto ID mangler" }, { status: 400 });
    }

    const updated = await prisma.account.update({
      where: { id },
      data: {
        customName: customName !== undefined ? (customName?.trim() || null) : undefined,
        isHidden: isHidden !== undefined ? Boolean(isHidden) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Konto ID mangler" }, { status: 400 });
    }

    await prisma.account.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
