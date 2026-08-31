import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany();
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await prisma.transaction.findMany({
      include: { category: true, account: true },
      orderBy: { date: "asc" },
    });

    const thisMonthTxs = transactions.filter((t) => new Date(t.date) >= startOfMonth);

    const monthlyIncome = thisMonthTxs
      .filter((t) => t.amount > 0 && !t.text.toLowerCase().includes("overførsel"))
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = thisMonthTxs
      .filter((t) => t.amount < 0 && !t.text.toLowerCase().includes("overførsel til"))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Group expenses by category
    const categoryTotals: { [key: string]: { name: string; color: string; total: number; count: number } } = {};

    for (const tx of thisMonthTxs) {
      if (tx.amount < 0 && !tx.text.toLowerCase().includes("overførsel til opsparing")) {
        const catName = tx.category ? tx.category.name : "Ukategoriseret";
        const catColor = tx.category ? tx.category.color : "#94a3b8";

        if (!categoryTotals[catName]) {
          categoryTotals[catName] = { name: catName, color: catColor, total: 0, count: 0 };
        }
        categoryTotals[catName].total += Math.abs(tx.amount);
        categoryTotals[catName].count++;
      }
    }

    const categoryBreakdown = Object.values(categoryTotals)
      .map((c) => ({
        ...c,
        total: Math.round(c.total * 100) / 100,
      }))
      .sort((a, b) => b.total - a.total);

    // Monthly cashflow timeline (last 6 months)
    const monthsMap: { [key: string]: { month: string; income: number; expense: number } } = {};

    for (const tx of transactions) {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = d.toLocaleString("da-DK", { month: "short", year: "2-digit" });

      if (!monthsMap[key]) {
        monthsMap[key] = { month: monthLabel, income: 0, expense: 0 };
      }

      if (tx.amount > 0 && !tx.text.toLowerCase().includes("overførsel")) {
        monthsMap[key].income += tx.amount;
      } else if (tx.amount < 0 && !tx.text.toLowerCase().includes("overførsel")) {
        monthsMap[key].expense += Math.abs(tx.amount);
      }
    }

    const monthlyTimeline = Object.entries(monthsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([_, v]) => ({
        month: v.month,
        income: Math.round(v.income),
        expense: Math.round(v.expense),
      }));

    // Subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: { status: "active" },
      include: { category: true },
    });

    const monthlySubTotal = subscriptions.reduce((sum, s) => {
      let monthly = s.amount;
      if (s.interval === "weekly") monthly = s.amount * 4.33;
      if (s.interval === "quarterly") monthly = s.amount / 3;
      if (s.interval === "yearly") monthly = s.amount / 12;
      return sum + monthly;
    }, 0);

    // Consent session
    const consent = await prisma.consentSession.findFirst({
      where: { status: "active" },
      orderBy: { validUntil: "desc" },
    });

    let daysRemaining = 0;
    if (consent) {
      const diffTime = new Date(consent.validUntil).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return NextResponse.json({
      totalBalance: Math.round(totalBalance * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      monthlyExpense: Math.round(monthlyExpense * 100) / 100,
      netCashflow: Math.round((monthlyIncome - monthlyExpense) * 100) / 100,
      categoryBreakdown,
      monthlyTimeline,
      subscriptionsCount: subscriptions.length,
      monthlySubTotal: Math.round(monthlySubTotal * 100) / 100,
      consent: consent
        ? {
            bankName: consent.bankName,
            validUntil: consent.validUntil,
            daysRemaining,
          }
        : null,
      accountsCount: accounts.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
