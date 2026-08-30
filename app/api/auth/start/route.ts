import { NextResponse } from "next/server";
import { EnableBankingClient } from "@/lib/enable-banking";

export async function POST(req: Request) {
  try {
    const { bankName = "Nordea", country = "DK" } = await req.json().catch(() => ({}));
    const client = new EnableBankingClient();
    const result = await client.startAuth(bankName, country, "nordea_consent_" + Date.now());
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Start auth error:", error);
    return NextResponse.json({ error: error.message || "Kunne ikke starte godkendelse" }, { status: 500 });
  }
}
