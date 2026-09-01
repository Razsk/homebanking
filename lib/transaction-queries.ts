export function buildTransactionWhereClause(params: {
  search?: string | null;
  accountId?: string | null;
  categoryId?: string | null;
  isSubscription?: string | boolean | null;
}) {
  const where: any = {};
  if (params.accountId) where.accountId = params.accountId;
  if (params.categoryId) where.categoryId = params.categoryId;
  if (params.isSubscription === "true" || params.isSubscription === true) {
    where.isSubscription = true;
  }
  if (params.search && params.search.trim()) {
    const words = params.search
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    const noise = ["bs", "betaling", "køb", "visa", "dankort", "den", "nota", "dkk", "eur", "usd", "sek", "nok", "aps", "a/s", "ab", "se"];
    const significantWords = words.filter(
      (w) => !noise.includes(w.toLowerCase())
    );

    const merchantWords = significantWords.filter((w) => !/^[\d\.,]+$/.test(w));
    const filterWords = merchantWords.length > 0 
      ? merchantWords 
      : (significantWords.length > 0 ? significantWords : words);

    where.AND = filterWords.map((w) => ({
      OR: [
        { text: { contains: w } },
        { counterparty: { contains: w } },
      ],
    }));
  }
  return where;
}
