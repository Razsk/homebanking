import { describe, it, expect } from "vitest";
import { buildTransactionWhereClause } from "../lib/transaction-queries";
import { classifyTransaction, CategoryModel, RuleModel } from "../lib/classifier";

describe("Transactions Search & Bulk Classification Filter Helper", () => {
  it("builds empty where clause when no filter parameters are supplied", () => {
    const where = buildTransactionWhereClause({});
    expect(where).toEqual({});
  });

  it("builds accountId and categoryId filters accurately", () => {
    const where = buildTransactionWhereClause({
      accountId: "acc-123",
      categoryId: "cat-abc",
    });

    expect(where.accountId).toBe("acc-123");
    expect(where.categoryId).toBe("cat-abc");
  });

  it("handles isSubscription boolean or string flag", () => {
    const whereStr = buildTransactionWhereClause({ isSubscription: "true" });
    expect(whereStr.isSubscription).toBe(true);

    const whereBool = buildTransactionWhereClause({ isSubscription: true });
    expect(whereBool.isSubscription).toBe(true);
  });

  it("splits search query and filters noise words to build text OR counterparty clauses", () => {
    const where = buildTransactionWhereClause({
      search: "Dankort-nota Netto Nørrebro",
    });

    expect(where.AND).toBeDefined();
    expect(where.AND.length).toBeGreaterThan(0);
    const containsWords = where.AND.map((clause: any) => clause.OR[0].text.contains);
    expect(containsWords).toContain("Netto");
    expect(containsWords).toContain("Nørrebro");
  });

  it("dynamically creates and tests rule matching on search pattern", () => {
    const mockCategories: CategoryModel[] = [
      { id: "cat-groceries", name: "Dagligvarer", color: "#f59e0b", icon: "ShoppingCart", isIncome: false },
      { id: "cat-streaming", name: "Streaming", color: "#ec4899", icon: "PlaySquare", isIncome: false },
    ];

    const newCreatedRule: RuleModel & { category: CategoryModel } = {
      id: "rule-custom-1",
      pattern: "rema 1000",
      matchType: "contains",
      categoryId: "cat-groceries",
      category: mockCategories[0],
      isSubscription: false,
      priority: 20,
    };

    const txText = "Dankort-nota Rema 1000 Valby";
    const classification = classifyTransaction(txText, null, -125.5, [newCreatedRule], mockCategories);

    expect(classification.categoryId).toBe("cat-groceries");
    expect(classification.isSubscription).toBe(false);
  });
});
