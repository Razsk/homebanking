import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { action } = await req.json();

    if (action === "clear_transactions") {
      await prisma.transaction.deleteMany({});
      await prisma.subscription.deleteMany({});
      return NextResponse.json({ success: true, message: "Alle transaktioner og abonnementer er slettet." });
    }

    if (action === "clear_all") {
      await prisma.transaction.deleteMany({});
      await prisma.subscription.deleteMany({});
      await prisma.account.deleteMany({});
      await prisma.consentSession.deleteMany({});
      return NextResponse.json({ success: true, message: "Transaktioner, konti og samtykkesessioner er ryddet." });
    }

    return NextResponse.json({ error: "Ugyldig handling" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
