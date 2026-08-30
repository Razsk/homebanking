import crypto from "crypto";

export interface RuleModel {
  id: string;
  pattern: string;
  matchType: string;
  categoryId: string;
  isSubscription: boolean;
  priority: number;
}

export interface CategoryModel {
  id: string;
  name: string;
  color: string;
  icon: string;
  isIncome: boolean;
}

export function generateTransactionHash(
  accountId: string,
  date: string | Date,
  amount: number,
  text: string
): string {
  const d = typeof date === "string" ? date.split("T")[0] : date.toISOString().split("T")[0];
  const raw = `${accountId}|${d}|${amount.toFixed(2)}|${text.trim().toLowerCase()}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function classifyTransaction(
  text: string,
  counterparty: string | null | undefined,
  amount: number,
  rules: (RuleModel & { category: CategoryModel })[],
  categories: CategoryModel[]
): { categoryId: string | null; isSubscription: boolean } {
  const combined = `${text} ${counterparty || ""}`.toLowerCase();

  // Sort rules by priority descending
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    const pattern = rule.pattern.toLowerCase();
    let matched = false;

    if (rule.matchType === "exact") {
      matched = combined.trim() === pattern.trim();
    } else if (rule.matchType === "regex") {
      try {
        const re = new RegExp(rule.pattern, "i");
        matched = re.test(combined);
      } catch (e) {
        matched = false;
      }
    } else {
      // contains
      matched = combined.includes(pattern);
    }

    if (matched) {
      return {
        categoryId: rule.categoryId,
        isSubscription: rule.isSubscription,
      };
    }
  }

  // Fallback defaults
  if (amount > 0) {
    const incomeCat = categories.find((c) => c.isIncome || c.name.toLowerCase().includes("løn") || c.name.toLowerCase().includes("indkomst"));
    if (incomeCat) return { categoryId: incomeCat.id, isSubscription: false };
  }

  const otherCat = categories.find((c) => c.name.toLowerCase().includes("andet") || c.name.toLowerCase().includes("diverse"));
  return {
    categoryId: otherCat ? otherCat.id : null,
    isSubscription: false,
  };
}

export interface DetectedSubscription {
  name: string;
  amount: number;
  interval: "weekly" | "monthly" | "quarterly" | "yearly";
  categoryId: string | null;
  lastPaymentDate: Date;
  nextPaymentDate: Date;
  occurrences: number;
}

export function detectSubscriptionsFromTransactions(
  transactions: {
    id: string;
    amount: number;
    date: Date | string;
    text: string;
    counterparty?: string | null;
    categoryId?: string | null;
  }[]
): DetectedSubscription[] {
  // Only consider expense transactions
  const expenses = transactions
    .filter((tx) => tx.amount < 0)
    .map((tx) => ({
      ...tx,
      dateObj: typeof tx.date === "string" ? new Date(tx.date) : tx.date,
    }))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  // Group by normalized merchant/name
  const groups: { [key: string]: typeof expenses } = {};

  for (const tx of expenses) {
    const raw = tx.counterparty || tx.text;
    const cleanKey = raw
      .toLowerCase()
      .replace(/[\d\.\-\/]/g, "")
      .replace(/\s+(a\/s|aps|se|ab|ltd|com|dk|holding)$/i, "")
      .trim();

    if (!groups[cleanKey]) groups[cleanKey] = [];
    groups[cleanKey].push(tx);
  }

  const results: DetectedSubscription[] = [];

  for (const [key, txList] of Object.entries(groups)) {
    if (txList.length < 2) continue;

    // Calculate intervals between occurrences in days
    const intervals: number[] = [];
    const amounts = txList.map((t) => Math.abs(t.amount));

    for (let i = 1; i < txList.length; i++) {
      const diffDays = Math.round(
        (txList[i].dateObj.getTime() - txList[i - 1].dateObj.getTime()) / (1000 * 60 * 60 * 24)
      );
      intervals.push(diffDays);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountVariation = Math.max(...amounts) - Math.min(...amounts);

    // Check if amount is consistent (within 15% variation or 50 DKK)
    const isAmountConsistent = amountVariation <= avgAmount * 0.15 || amountVariation < 50;

    let intervalType: "weekly" | "monthly" | "quarterly" | "yearly" | null = null;
    let daysToAdd = 30;

    if (avgInterval >= 5 && avgInterval <= 9) {
      intervalType = "weekly";
      daysToAdd = 7;
    } else if (avgInterval >= 25 && avgInterval <= 36) {
      intervalType = "monthly";
      daysToAdd = 30;
    } else if (avgInterval >= 80 && avgInterval <= 100) {
      intervalType = "quarterly";
      daysToAdd = 90;
    } else if (avgInterval >= 340 && avgInterval <= 390) {
      intervalType = "yearly";
      daysToAdd = 365;
    }

    if (intervalType && isAmountConsistent) {
      const lastTx = txList[txList.length - 1];
      const nextDate = new Date(lastTx.dateObj);
      nextDate.setDate(nextDate.getDate() + daysToAdd);

      // Name title case
      const displayName = (lastTx.counterparty || lastTx.text)
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      results.push({
        name: displayName,
        amount: Math.round(avgAmount * 100) / 100,
        interval: intervalType,
        categoryId: lastTx.categoryId || null,
        lastPaymentDate: lastTx.dateObj,
        nextPaymentDate: nextDate,
        occurrences: txList.length,
      });
    }
  }

  return results;
}
