import { describe, it, expect } from "vitest";
import { 
  generateTransactionHash, 
  classifyTransaction, 
  CategoryModel, 
  RuleModel 
} from "../lib/classifier";

describe("Seam 3: generateTransactionHash (Idempotent Pipeline)", () => {
  it("produces deterministic SHA-256 hash for identical transaction attributes", () => {
    const accountId = "acc-nordea-001";
    const date = "2026-08-30";
    const amount = -149.0;
    const text = "Netflix.com Premium";

    const hash1 = generateTransactionHash(accountId, date, amount, text);
    const hash2 = generateTransactionHash(accountId, new Date("2026-08-30T10:00:00Z"), amount, "  netflix.com premium  ");

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("produces distinct hashes for different accounts or amounts", () => {
    const hash1 = generateTransactionHash("acc-1", "2026-08-30", -100, "Netto");
    const hash2 = generateTransactionHash("acc-2", "2026-08-30", -100, "Netto");
    const hash3 = generateTransactionHash("acc-1", "2026-08-30", -150, "Netto");

    expect(hash1).not.toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });
});

describe("Seam 1: classifyTransaction (Rule Matching & Fallbacks)", () => {
  const mockCategories: CategoryModel[] = [
    { id: "cat-income", name: "Løn & Indkomst", color: "#10b981", icon: "TrendingUp", isIncome: true },
    { id: "cat-groceries", name: "Dagligvarer & Mad", color: "#f59e0b", icon: "ShoppingCart", isIncome: false },
    { id: "cat-streaming", name: "Abonnementer & Streaming", color: "#ec4899", icon: "PlaySquare", isIncome: false },
    { id: "cat-other", name: "Andet / Diverse", color: "#94a3b8", icon: "MoreHorizontal", isIncome: false },
  ];

  const mockRules: (RuleModel & { category: CategoryModel })[] = [
    {
      id: "r-1",
      pattern: "netto",
      matchType: "contains",
      categoryId: "cat-groceries",
      category: mockCategories[1],
      isSubscription: false,
      priority: 10,
    },
    {
      id: "r-2",
      pattern: "netflix",
      matchType: "contains",
      categoryId: "cat-streaming",
      category: mockCategories[2],
      isSubscription: true,
      priority: 30,
    },
    {
      id: "r-3",
      pattern: "^(løn|salary)",
      matchType: "regex",
      categoryId: "cat-income",
      category: mockCategories[0],
      isSubscription: false,
      priority: 25,
    },
  ];

  it("classifies text matching 'contains' rule and assigns correct category", () => {
    const result = classifyTransaction("Netto Nørrebrogade KBH", "Salling Group", -245.5, mockRules, mockCategories);
    expect(result.categoryId).toBe("cat-groceries");
    expect(result.isSubscription).toBe(false);
  });

  it("classifies subscription merchant and sets isSubscription to true", () => {
    const result = classifyTransaction("Netflix.com Subscription", "Netflix", -149.0, mockRules, mockCategories);
    expect(result.categoryId).toBe("cat-streaming");
    expect(result.isSubscription).toBe(true);
  });

  it("classifies with regex rule pattern", () => {
    const result = classifyTransaction("Lønudbetaling Novo", "Novo Nordisk", 35000, mockRules, mockCategories);
    expect(result.categoryId).toBe("cat-income");
    expect(result.isSubscription).toBe(false);
  });

  it("defaults unclassified positive amounts to Income category", () => {
    const result = classifyTransaction("Ukendt indbetaling fra ven", "Kasper", 500, mockRules, mockCategories);
    expect(result.categoryId).toBe("cat-income");
  });

  it("defaults unclassified negative amounts to Other / Diverse category", () => {
    const result = classifyTransaction("Ukendt hævning i automat", null, -200, mockRules, mockCategories);
    expect(result.categoryId).toBe("cat-other");
  });
});
