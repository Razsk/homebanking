import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeKey(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/visa køb (dkk|eur|usd)\s+[\d\.,]+/gi, "")
    .replace(/bs [bb]etaling\s+/gi, "")
    .replace(/dankort-nota\s+/gi, "")
    .replace(/den \d\d\.\d\d/gi, "")
    .replace(/[\d\.\-\/]/g, "")
    .replace(/\s+(a\/s|aps|se|ab|ltd|com|dk|holding)$/i, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSearchQuery(name: string): string {
  const clean = name
    .replace(/Visa Køb (DKK|EUR|USD)\s+[\d\.,]+/gi, "")
    .replace(/Bs [bB]etaling\s+/gi, "")
    .replace(/Dankort-nota\s+/gi, "")
    .replace(/Den \d\d\.\d\d/gi, "")
    .trim();
  return clean || name;
}

export async function GET() {
  try {
    const [subscriptions, transactions] = await Promise.all([
      prisma.subscription.findMany({
        include: { category: true },
        orderBy: { amount: "desc" },
      }),
      prisma.transaction.findMany({
        select: { id: true, text: true, counterparty: true, amount: true, date: true },
        orderBy: { date: "asc" },
      }),
    ]);

    const subsWithCounts = subscriptions.map((s) => {
      const sNorm = normalizeKey(s.name);
      const keywords = sNorm
        .split(" ")
        .filter((w) => w.length > 2 && !["membership", "subscription", "subs", "betaling", "nota", "dkk", "eur", "usd"].includes(w));

      const matchedTxs = transactions.filter((t) => {
        const tNorm = normalizeKey(`${t.text} ${t.counterparty || ""}`);
        if (sNorm && (tNorm.includes(sNorm) || sNorm.includes(tNorm))) return true;
        if (keywords.length > 0) {
          return keywords.every((kw) => tNorm.includes(kw));
        }
        return false;
      });

      // Frequency analysis always requires at least 2 occurrences
      const finalCount = Math.max(matchedTxs.length, 2);
      const searchQuery = extractSearchQuery(s.name);

      // Analyze price change history
      let priceChange: any = null;
      let latestAmount = s.amount;

      if (matchedTxs.length >= 2) {
        const amounts = matchedTxs.map((t) => Math.abs(t.amount));
        const firstAmount = amounts[0];
        const lastAmount = amounts[amounts.length - 1];
        const diff = Math.round((lastAmount - firstAmount) * 100) / 100;
        const percentage = Math.round(((lastAmount - firstAmount) / firstAmount) * 1000) / 10;

        if (Math.abs(diff) >= 1) {
          priceChange = {
            hasChanged: true,
            isIncrease: diff > 0,
            previousAmount: firstAmount,
            currentAmount: lastAmount,
            diff,
            percentage,
          };
          latestAmount = lastAmount;
        }
      }

      return {
        ...s,
        amount: latestAmount,
        transactionCount: finalCount,
        searchQuery,
        priceChange,
      };
    });

    const activeSubs = subsWithCounts.filter((s) => s.status === "active");
    const inactiveSubs = subsWithCounts.filter((s) => s.status !== "active");

    const monthlyTotal = activeSubs.reduce((sum, s) => {
      let monthly = s.amount;
      if (s.interval === "weekly") monthly = s.amount * 4.33;
      if (s.interval === "quarterly") monthly = s.amount / 3;
      if (s.interval === "yearly") monthly = s.amount / 12;
      return sum + monthly;
    }, 0);

    const yearlyTotal = monthlyTotal * 12;

    const savedAnnualTotal = inactiveSubs.reduce((sum, s) => {
      let annual = s.amount * 12;
      if (s.interval === "weekly") annual = s.amount * 52;
      if (s.interval === "quarterly") annual = s.amount * 4;
      if (s.interval === "yearly") annual = s.amount * 1;
      return sum + annual;
    }, 0);

    const priceIncreaseCount = subsWithCounts.filter((s) => s.priceChange?.isIncrease).length;
    const priceDecreaseCount = subsWithCounts.filter((s) => s.priceChange?.hasChanged && !s.priceChange?.isIncrease).length;

    return NextResponse.json({
      subscriptions: subsWithCounts,
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      yearlyTotal: Math.round(yearlyTotal * 100) / 100,
      savedAnnualTotal: Math.round(savedAnnualTotal * 100) / 100,
      activeCount: activeSubs.length,
      inactiveCount: inactiveSubs.length,
      priceIncreaseCount,
      priceDecreaseCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, amount, interval = "monthly", categoryId, nextPaymentDate, lastPaymentDate } = body;

    const sub = await prisma.subscription.create({
      data: {
        name,
        amount: parseFloat(amount),
        interval,
        categoryId: categoryId || null,
        nextPaymentDate: new Date(nextPaymentDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastPaymentDate: new Date(lastPaymentDate || Date.now()),
        status: "active",
        detectedAuto: false,
      },
      include: { category: true },
    });

    return NextResponse.json(sub);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, categoryId, amount, interval, name, nextPaymentDate } = body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (categoryId !== undefined) data.categoryId = categoryId ? categoryId : null;
    if (amount !== undefined) data.amount = parseFloat(amount);
    if (interval !== undefined) data.interval = interval;
    if (name !== undefined) data.name = name;
    if (nextPaymentDate !== undefined) data.nextPaymentDate = new Date(nextPaymentDate);

    const sub = await prisma.subscription.update({
      where: { id },
      data,
      include: { category: true },
    });

    return NextResponse.json(sub);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
