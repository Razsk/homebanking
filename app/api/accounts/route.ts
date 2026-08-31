import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(accounts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
