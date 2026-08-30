import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EnableBankingClient } from "@/lib/enable-banking";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/settings?error=" + encodeURIComponent(error || "Intet autorisationskode modtaget"), req.url));
  }

  try {
    const client = new EnableBankingClient();
    const { sessionId, accounts } = await client.createSession(code);

    // Save consent session (180 days)
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 179);

    await prisma.consentSession.upsert({
      where: { sessionId },
      update: { validUntil, status: "active" },
      create: {
        aggregator: "enable_banking",
        bankName: "Nordea",
        sessionId,
        validUntil,
        status: "active",
      },
    });

    // Save or update accounts
    for (const acc of accounts) {
      await prisma.account.upsert({
        where: { id: acc.accountId },
        update: {
          name: acc.name,
          iban: acc.iban,
          accountNumber: acc.accountNumber,
          currency: acc.currency,
          balance: acc.balance,
          bookedBalance: acc.bookedBalance,
          availableBalance: acc.availableBalance,
        },
        create: {
          id: acc.accountId,
          bankName: "Nordea",
          name: acc.name,
          iban: acc.iban,
          accountNumber: acc.accountNumber,
          currency: acc.currency,
          balance: acc.balance,
          bookedBalance: acc.bookedBalance,
          availableBalance: acc.availableBalance,
        },
      });
    }

    return NextResponse.redirect(new URL("/settings?success=1", req.url));
  } catch (err: any) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(new URL("/settings?error=" + encodeURIComponent(err.message), req.url));
  }
}
