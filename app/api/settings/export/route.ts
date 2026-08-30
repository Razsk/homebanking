import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    const transactions = await prisma.transaction.findMany({
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: "desc" },
    });

    if (format === "csv") {
      const headers = ["Dato", "Konto", "Tekst", "Modpart", "Beløb", "Valuta", "Kategori", "Abonnement", "Status"];
      const rows = transactions.map((t) => [
        t.date.toISOString().split("T")[0],
        `"${(t.account.customName || t.account.name).replace(/"/g, '""')}"`,
        `"${t.text.replace(/"/g, '""')}"`,
        `"${(t.counterparty || "").replace(/"/g, '""')}"`,
        t.amount.toFixed(2),
        t.account.currency,
        `"${(t.category?.name || "Ukendt").replace(/"/g, '""')}"`,
        t.isSubscription ? "Ja" : "Nej",
        t.status,
      ]);

      const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="nordea_kontobevaegelser_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // JSON export
    const accounts = await prisma.account.findMany();
    const categories = await prisma.category.findMany();
    const rules = await prisma.classificationRule.findMany();
    const subscriptions = await prisma.subscription.findMany();

    const fullExport = {
      exportedAt: new Date().toISOString(),
      accounts,
      categories,
      rules,
      subscriptions,
      transactions,
    };

    return new NextResponse(JSON.stringify(fullExport, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="homebanking_backup_${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
