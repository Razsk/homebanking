import { describe, it, expect } from "vitest";
import { detectSubscriptionsFromTransactions } from "../lib/classifier";

describe("Seam 2: detectSubscriptionsFromTransactions (Frequency & Interval Analysis)", () => {
  it("detects monthly subscription from 3 recurring monthly transactions", () => {
    const transactions = [
      { id: "tx-1", amount: -109.0, date: new Date("2026-06-01"), text: "Spotify AB", categoryId: "cat-streaming" },
      { id: "tx-2", amount: -109.0, date: new Date("2026-07-01"), text: "Spotify AB", categoryId: "cat-streaming" },
      { id: "tx-3", amount: -109.0, date: new Date("2026-08-01"), text: "Spotify AB", categoryId: "cat-streaming" },
    ];

    const detected = detectSubscriptionsFromTransactions(transactions);
    expect(detected).toHaveLength(1);

    const spotify = detected[0];
    expect(spotify.name.toLowerCase()).toContain("spotify");
    expect(spotify.amount).toBe(109.0);
    expect(spotify.interval).toBe("monthly");
    expect(spotify.occurrences).toBe(3);
    
    // next payment date should be ~30 days after Aug 1, 2026 (Aug 31)
    const nextDate = new Date(spotify.nextPaymentDate);
    expect(nextDate.getMonth()).toBe(7); // August (0-indexed)
    expect(nextDate.getDate()).toBe(31);
  });

  it("detects quarterly subscription with interval ~90 days", () => {
    const transactions = [
      { id: "tx-1", amount: -650.0, date: new Date("2026-01-10"), text: "Andel Energi Vand & Varme" },
      { id: "tx-2", amount: -650.0, date: new Date("2026-04-10"), text: "Andel Energi Vand & Varme" },
      { id: "tx-3", amount: -650.0, date: new Date("2026-07-10"), text: "Andel Energi Vand & Varme" },
    ];

    const detected = detectSubscriptionsFromTransactions(transactions);
    expect(detected).toHaveLength(1);
    expect(detected[0].interval).toBe("quarterly");
    expect(detected[0].amount).toBe(650.0);
  });

  it("ignores one-off or irregular expenses", () => {
    const transactions = [
      { id: "tx-1", amount: -250.0, date: new Date("2026-08-01"), text: "Restaurant Pluto" },
      { id: "tx-2", amount: -900.0, date: new Date("2026-08-04"), text: "Restaurant Pluto" }, // big amount jump, 3 days interval
    ];

    const detected = detectSubscriptionsFromTransactions(transactions);
    expect(detected).toHaveLength(0);
  });

  it("handles minor currency variations within 15% (e.g. OpenAI USD conversion)", () => {
    const transactions = [
      { id: "tx-1", amount: -158.50, date: new Date("2026-06-15"), text: "OpenAI ChatGPT Plus" },
      { id: "tx-2", amount: -161.20, date: new Date("2026-07-15"), text: "OpenAI ChatGPT Plus" },
      { id: "tx-3", amount: -159.80, date: new Date("2026-08-15"), text: "OpenAI ChatGPT Plus" },
    ];

    const detected = detectSubscriptionsFromTransactions(transactions);
    expect(detected).toHaveLength(1);
    expect(detected[0].name.toLowerCase()).toContain("openai");
    expect(detected[0].interval).toBe("monthly");
  });
});
