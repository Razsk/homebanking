import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [subscriptions, transactions] = await Promise.all([
      prisma.subscription.findMany({
        include: { category: true },
        orderBy: { amount: "desc" },
      }),
      prisma.transaction.findMany({
        select: { id: true, text: true, counterparty: true, amount: true },
      }),
    ]);

    const subsWithCounts = subscriptions.map((s) => {
      // Clean query for search
      const cleanName = s.name
        .replace(/Visa Køb (DKK|EUR|USD)\s+[\d\.,]+/gi, "")
        .replace(/Bs [bB]etaling\s+/gi, "")
        .replace(/Dankort-nota\s+/gi, "")
        .replace(/Den \d\d\.\d\d/gi, "")
        .trim();

      const query = cleanName || s.name;
      const qLower = query.toLowerCase();
      const keywords = qLower
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !["membership", "subscription", "subs", "dkk", "eur", "usd"].includes(w));

      const matchedTxs = transactions.filter((t) => {
        const full = `${t.text} ${t.counterparty || ""}`.toLowerCase();
        if (keywords.length > 0) {
          return keywords.every((kw) => full.includes(kw));
        }
        return full.includes(qLower);
      });

      return {
        ...s,
        transactionCount: matchedTxs.length,
        searchQuery: query,
      };
    });

    const monthlyTotal = subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => {
        let monthly = s.amount;
        if (s.interval === "weekly") monthly = s.amount * 4.33;
        if (s.interval === "quarterly") monthly = s.amount / 3;
        if (s.interval === "yearly") monthly = s.amount / 12;
        return sum + monthly;
      }, 0);

    const yearlyTotal = monthlyTotal * 12;

    return NextResponse.json({
      subscriptions: subsWithCounts,
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      yearlyTotal: Math.round(yearlyTotal * 100) / 100,
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
