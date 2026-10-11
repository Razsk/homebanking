import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EnableBankingClient } from "@/lib/enable-banking";
import { generateTransactionHash, classifyTransaction, detectSubscriptionsFromTransactions } from "@/lib/classifier";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const client = new EnableBankingClient();

    if (!client.isConfigured()) {
      return NextResponse.json(
        {
          error:
            "Enable Banking er ikke konfigureret endnu. Indtast dit Application ID og Key ID under 'Forbindelse & Regler'.",
        },
        { status: 400 }
      );
    }

    const currentAccounts = await prisma.account.findMany();
    if (currentAccounts.length === 0) {
      return NextResponse.json(
        {
          error:
            "Ingen bankkonti tilknyttet endnu. Tryk på 'Forbind med Nordea (MitID)' under Indstillinger for at give samtykke.",
        },
        { status: 400 }
      );
    }

    // Determine history date
    let effectiveDateFrom: string | undefined = body.dateFrom;
    if (!effectiveDateFrom) {
      const pref = await prisma.userPreference.findUnique({ where: { key: "syncHistoryDays" } });
      const days = parseInt(body.historyDays || pref?.value || "180", 10);
      const d = new Date(Date.now() - Math.min(days, 535) * 24 * 60 * 60 * 1000);
      effectiveDateFrom = d.toISOString().split("T")[0];
    }

    const rules = await prisma.classificationRule.findMany({ include: { category: true } });
    const categories = await prisma.category.findMany();

    let totalSynced = 0;

    for (const acc of currentAccounts) {
      // Sync live account balances
      try {
        const bal = await client.fetchBalances(acc.id);
        await prisma.account.update({
          where: { id: acc.id },
          data: {
            balance: bal.balance,
            bookedBalance: bal.bookedBalance,
            availableBalance: bal.availableBalance,
          },
        });
      } catch (balErr) {
        console.warn(`Kunne ikke opdatere saldo for konto ${acc.id}:`, balErr);
      }

      const bankTxs = await client.fetchTransactions(acc.id, effectiveDateFrom);

      for (const tx of bankTxs) {
        const hash = generateTransactionHash(acc.id, tx.date, tx.amount, tx.text);
        const { categoryId, isSubscription } = classifyTransaction(
          tx.text,
          tx.counterparty,
          tx.amount,
          rules,
          categories
        );

        // Check if existing transaction was already customized by user
        const existing = await prisma.transaction.findUnique({ where: { hash } });

        await prisma.transaction.upsert({
          where: { hash },
          update: {
            status: tx.status,
            amount: tx.amount,
            // Preserve user category if set
            categoryId: existing?.categoryId ? existing.categoryId : categoryId,
            isSubscription: existing?.isSubscription !== undefined ? existing.isSubscription : isSubscription,
          },
          create: {
            accountId: acc.id,
            amount: tx.amount,
            date: new Date(tx.date),
            valueDate: tx.valueDate ? new Date(tx.valueDate) : null,
            text: tx.text,
            counterparty: tx.counterparty,
            status: tx.status,
            categoryId: categoryId,
            isSubscription: isSubscription,
            hash: hash,
          },
        });
        totalSynced++;
      }
    }

    // Refresh Subscriptions
    const allTransactions = await prisma.transaction.findMany();
    const detectedSubs = detectSubscriptionsFromTransactions(allTransactions);
    const validNames = new Set<string>();

    for (const sub of detectedSubs) {
      validNames.add(sub.name);
      const existingSub = await prisma.subscription.findFirst({
        where: { name: sub.name },
      });

      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            amount: sub.amount,
            interval: sub.interval,
            lastPaymentDate: sub.lastPaymentDate,
            nextPaymentDate: sub.nextPaymentDate,
            status: sub.status,
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            name: sub.name,
            amount: sub.amount,
            interval: sub.interval,
            categoryId: sub.categoryId,
            lastPaymentDate: sub.lastPaymentDate,
            nextPaymentDate: sub.nextPaymentDate,
            status: sub.status,
            detectedAuto: true,
          },
        });
      }
    }

    // Prune stale auto-detected subscriptions that no longer pass strict frequency/variance checks
    await prisma.subscription.deleteMany({
      where: {
        detectedAuto: true,
        name: { notIn: Array.from(validNames) },
      },
    });

    return NextResponse.json({
      success: true,
      syncedCount: totalSynced,
      subscriptionsCount: detectedSubs.length,
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message || "Synkronisering fejlede" }, { status: 500 });
  }
}
