import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const prefs = await prisma.userPreference.findMany();
    const map: { [key: string]: string } = {};
    for (const p of prefs) {
      map[p.key] = p.value;
    }

    return NextResponse.json({
      primaryBank: map.primaryBank || "Nordea",
      subDaysThreshold: map.subDaysThreshold || "5",
      subAmountVariance: map.subAmountVariance || "15",
      consentAlertDays: map.consentAlertDays || "14",
      currencySymbol: map.currencySymbol || "kr.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string" || typeof value === "number") {
        await prisma.userPreference.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
