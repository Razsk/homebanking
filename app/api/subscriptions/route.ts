import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: { category: true },
      orderBy: { amount: "desc" },
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
      subscriptions,
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
    const { id, status } = body;

    const sub = await prisma.subscription.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(sub);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
