import { describe, it, expect } from "vitest";
import { 
  generateTransactionHash, 
  classifyTransaction, 
  cleanMerchantName,
  cleanMerchantKey,
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

describe("Seam 4: cleanMerchantName & cleanMerchantKey (Data Cleansing)", () => {
  it("cleans Betalingsservice texts properly", () => {
    expect(cleanMerchantName("Bs betaling ANDEL ENERGI A/S")).toBe("Andel Energi");
    expect(cleanMerchantName("Bs betaling DCC ENERGI A/S")).toBe("DCC Energi");
    expect(cleanMerchantName("Bs betaling DCC ENERGI MOBILITY")).toBe("DCC Energi Mobility");
    expect(cleanMerchantName("Bs betaling DEN LILLE SKOLE")).toBe("Den Lille Skole");
    expect(cleanMerchantName("Bs betaling NEXT FORSIKRING")).toBe("Next Forsikring");
    expect(cleanMerchantName("Bs betaling TRYG")).toBe("Tryg");
    expect(cleanMerchantName("Bs betaling SYNOPTIK A/S")).toBe("Synoptik A/S");
  });

  it("cleans Dankort-nota texts properly", () => {
    expect(cleanMerchantName("Dankort-nota 7 Eleven B112  47868")).toBe("7-Eleven");
    expect(cleanMerchantName("Dankort-nota Aldershvile Pl 78352")).toBe("Aldershvile Planteskole");
    expect(cleanMerchantName("Dankort-nota Bagsværd Apote 14775")).toBe("Bagsværd Apotek");
    expect(cleanMerchantName("Dankort-nota emmerys (205)   2003")).toBe("Emmerys");
    expect(cleanMerchantName("Dankort-nota Lagkagehuset 3 24480")).toBe("Lagkagehuset");
    expect(cleanMerchantName("Dankort-nota BAUHAUS Gladsa 55058")).toBe("Bauhaus");
    expect(cleanMerchantName("Dankort-nota Meal4u.dk      41132")).toBe("Mealo Takeaway");
  });

  it("cleans MobilePay texts with transaction IDs and references", () => {
    expect(cleanMerchantName("SCTI2TX215398437 Mobilepay MobilePay Rejsekort Reference 11234021377665")).toBe("Rejsekort");
    expect(cleanMerchantName("SCTI2TX220053837 Mobilepay MobilePay DEN LILLE SKOLE Reference 10734332378291")).toBe("Den Lille Skole");
    expect(cleanMerchantName("SCTI2TX247739900 Mobilepay MobilePay Ingenting - Hafniensis Reference 08234984502705")).toBe("Hafniensis");
  });

  it("cleans Visa texts across currencies (DKK, EUR, USD)", () => {
    expect(cleanMerchantName("Visa køb DKK 12,50 Patreon* Membership Den 01.04")).toBe("Patreon");
    expect(cleanMerchantName("Visa køb EUR 765,10 Hilton Sorrento Pala Den 07.04")).toBe("Hilton Sorrento Palace");
    expect(cleanMerchantName("Visa køb USD 20,00 OPENAI *CHATGPT SUBS Den 11.04")).toBe("OpenAI (ChatGPT)");
    expect(cleanMerchantName("Visa køb DKK 23,16 PAYPAL *STEAM GAMES Den 09.06")).toBe("Steam Games");
  });

  it("cleans Zettle transactions", () => {
    expect(cleanMerchantName("ZETTLE-*IS SALONEN A DKK 12,00 Den 15.10")).toBe("Issalonen");
    expect(cleanMerchantName("Zettle-*Tower Bridge GBP 10,00 Den 30.07")).toBe("Tower Bridge");
    expect(cleanMerchantName("ZETTLE-*WILD BURGERS SEK 1146,00 Den 23.07")).toBe("Wild Burgers");
  });

  it("cleans international, utility and cultural merchant descriptions", () => {
    expect(cleanMerchantName("2025-03 Vindstød Overførsel 2025-03 Vindstød")).toBe("Vindstød");
    expect(cleanMerchantName("WARNERBROS STUDIOS GBP 86,34 Den 29.07")).toBe("Warner Bros. Studio Tour");
    expect(cleanMerchantName("Audible*1M92W2MM3 USD 7,49 Den 13.06")).toBe("Audible");
    expect(cleanMerchantName("BRITISH MUSEUM CAF GBP 16,30 Den 29.07")).toBe("British Museum");
    expect(cleanMerchantName("AROS AARHUS KUNSTMUS DKK 52,00 Den 13.07")).toBe("ARoS Kunstmuseum");
  });
});

