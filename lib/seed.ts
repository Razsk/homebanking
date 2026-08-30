import { PrismaClient } from "@prisma/client";
import { MockNordeaProvider } from "./enable-banking";
import { generateTransactionHash, classifyTransaction, detectSubscriptionsFromTransactions } from "./classifier";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Danish Homebanking categories and rules...");

  // 1. Create standard categories
  const categoriesData = [
    { name: "Løn & Indkomst", color: "#10b981", icon: "TrendingUp", isIncome: true },
    { name: "Bolig & Husleje", color: "#6366f1", icon: "Home", isIncome: false },
    { name: "Forsyning & Energi", color: "#06b6d4", icon: "Zap", isIncome: false },
    { name: "Dagligvarer & Mad", color: "#f59e0b", icon: "ShoppingCart", isIncome: false },
    { name: "Abonnementer & Streaming", color: "#ec4899", icon: "PlaySquare", isIncome: false },
    { name: "Forsikring & Finans", color: "#8b5cf6", icon: "ShieldCheck", isIncome: false },
    { name: "Transport & Brændstof", color: "#3b82f6", icon: "Car", isIncome: false },
    { name: "Café & Restauranter", color: "#f97316", icon: "Utensils", isIncome: false },
    { name: "Fritid & Træning", color: "#14b8a6", icon: "Activity", isIncome: false },
    { name: "Shopping & Tøj", color: "#a855f7", icon: "ShoppingBag", isIncome: false },
    { name: "Opsparing & Overførsel", color: "#64748b", icon: "Landmark", isIncome: false },
    { name: "Andet / Diverse", color: "#94a3b8", icon: "MoreHorizontal", isIncome: false },
  ];

  const categories: { [key: string]: any } = {};

  for (const cat of categoriesData) {
    const record = await prisma.category.upsert({
      where: { name: cat.name },
      update: cat,
      create: cat,
    });
    categories[cat.name] = record;
  }

  // 2. Create classification rules
  const rulesData = [
    { pattern: "løn", categoryName: "Løn & Indkomst", isSub: false, priority: 10 },
    { pattern: "novo nordisk", categoryName: "Løn & Indkomst", isSub: false, priority: 20 },
    { pattern: "skat", categoryName: "Løn & Indkomst", isSub: false, priority: 10 },
    { pattern: "husleje", categoryName: "Bolig & Husleje", isSub: true, priority: 20 },
    { pattern: "deas", categoryName: "Bolig & Husleje", isSub: true, priority: 20 },
    { pattern: "andel energi", categoryName: "Forsyning & Energi", isSub: true, priority: 20 },
    { pattern: "hiper", categoryName: "Forsyning & Energi", isSub: true, priority: 20 },
    { pattern: "fibernet", categoryName: "Forsyning & Energi", isSub: true, priority: 15 },
    { pattern: "netto", categoryName: "Dagligvarer & Mad", isSub: false, priority: 15 },
    { pattern: "føtex", categoryName: "Dagligvarer & Mad", isSub: false, priority: 15 },
    { pattern: "rema 1000", categoryName: "Dagligvarer & Mad", isSub: false, priority: 15 },
    { pattern: "meny", categoryName: "Dagligvarer & Mad", isSub: false, priority: 15 },
    { pattern: "netflix", categoryName: "Abonnementer & Streaming", isSub: true, priority: 30 },
    { pattern: "spotify", categoryName: "Abonnementer & Streaming", isSub: true, priority: 30 },
    { pattern: "hbo", categoryName: "Abonnementer & Streaming", isSub: true, priority: 30 },
    { pattern: "max.com", categoryName: "Abonnementer & Streaming", isSub: true, priority: 30 },
    { pattern: "openai", categoryName: "Abonnementer & Streaming", isSub: true, priority: 30 },
    { pattern: "chatgpt", categoryName: "Abonnementer & Streaming", isSub: true, priority: 30 },
    { pattern: "yousee", categoryName: "Abonnementer & Streaming", isSub: true, priority: 20 },
    { pattern: "puregym", categoryName: "Fritid & Træning", isSub: true, priority: 25 },
    { pattern: "fitness world", categoryName: "Fritid & Træning", isSub: true, priority: 25 },
    { pattern: "tryg", categoryName: "Forsikring & Finans", isSub: true, priority: 25 },
    { pattern: "topdanmark", categoryName: "Forsikring & Finans", isSub: true, priority: 25 },
    { pattern: "ok benzin", categoryName: "Transport & Brændstof", isSub: false, priority: 20 },
    { pattern: "dsb", categoryName: "Transport & Brændstof", isSub: false, priority: 20 },
    { pattern: "rejsekort", categoryName: "Transport & Brændstof", isSub: false, priority: 20 },
    { pattern: "espresso house", categoryName: "Café & Restauranter", isSub: false, priority: 20 },
    { pattern: "restaurant", categoryName: "Café & Restauranter", isSub: false, priority: 10 },
    { pattern: "zalando", categoryName: "Shopping & Tøj", isSub: false, priority: 20 },
    { pattern: "opsparing", categoryName: "Opsparing & Overførsel", isSub: false, priority: 15 },
    { pattern: "overførsel", categoryName: "Opsparing & Overførsel", isSub: false, priority: 5 },
  ];

  await prisma.classificationRule.deleteMany({});
  for (const r of rulesData) {
    if (categories[r.categoryName]) {
      await prisma.classificationRule.create({
        data: {
          pattern: r.pattern,
          matchType: "contains",
          categoryId: categories[r.categoryName].id,
          isSubscription: r.isSub,
          priority: r.priority,
        },
      });
    }
  }

  // 3. Create Mock Nordea Accounts and Transactions
  const mockSession = MockNordeaProvider.getMockSession();
  const dbRules = await prisma.classificationRule.findMany({ include: { category: true } });
  const allCategories = Object.values(categories);

  const createdTransactions: any[] = [];

  for (const acc of mockSession.accounts) {
    const accountRecord = await prisma.account.upsert({
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

    const txs = MockNordeaProvider.getMockTransactions(acc.accountId);
    for (const tx of txs) {
      const hash = generateTransactionHash(acc.accountId, tx.date, tx.amount, tx.text);
      const { categoryId, isSubscription } = classifyTransaction(
        tx.text,
        tx.counterparty,
        tx.amount,
        dbRules,
        allCategories
      );

      const txRecord = await prisma.transaction.upsert({
        where: { hash },
        update: {
          status: tx.status,
          amount: tx.amount,
        },
        create: {
          accountId: accountRecord.id,
          amount: tx.amount,
          date: new Date(tx.date),
          text: tx.text,
          counterparty: tx.counterparty,
          status: tx.status,
          categoryId: categoryId,
          isSubscription: isSubscription,
          hash: hash,
        },
      });
      createdTransactions.push(txRecord);
    }
  }

  // 4. Create Consent Session (180 days from now)
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 179);
  await prisma.consentSession.upsert({
    where: { sessionId: mockSession.sessionId },
    update: { validUntil, status: "active" },
    create: {
      aggregator: "enable_banking",
      bankName: "Nordea",
      sessionId: mockSession.sessionId,
      validUntil,
      status: "active",
    },
  });

  // 5. Detect and populate subscriptions
  const detected = detectSubscriptionsFromTransactions(createdTransactions);
  await prisma.subscription.deleteMany({});
  for (const sub of detected) {
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

  console.log(`Database seeded successfully! Generated ${createdTransactions.length} transactions and ${detected.length} active subscriptions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
