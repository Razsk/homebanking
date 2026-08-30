import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EnableBankingClient } from "@/lib/enable-banking";
import { generateTransactionHash, classifyTransaction, detectSubscriptionsFromTransactions } from "@/lib/classifier";

export async function POST(req: Request) {
  try {
    const client = new EnableBankingClient();
    const accounts = await prisma.account.findMany();

    if (accounts.length === 0) {
      // If no accounts yet, create initial mock/real session
      const { accounts: fetchedAccounts } = await client.createSession("mock_init");
      for (const acc of fetchedAccounts) {
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
    }

    const currentAccounts = await prisma.account.findMany();
    const rules = await prisma.classificationRule.findMany({ include: { category: true } });
    const categories = await prisma.category.findMany();

    let totalSynced = 0;

    for (const acc of currentAccounts) {
      const bankTxs = await client.fetchTransactions(acc.id);

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
            // Only update category if user hasn't set one yet
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

    for (const sub of detectedSubs) {
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
            status: "active",
            detectedAuto: true,
          },
        });
      }
    }

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
