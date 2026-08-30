import { describe, it, expect } from "vitest";
import { EnableBankingClient, MockNordeaProvider } from "../lib/enable-banking";

describe("Seam 4: Enable Banking & Mock Adapter", () => {
  it("provides complete realistic Danish Nordea mock session", () => {
    const session = MockNordeaProvider.getMockSession();
    expect(session.sessionId).toContain("mock-nordea-session");
    expect(session.accounts).toHaveLength(3);

    const lonAcc = session.accounts.find((a) => a.accountId === "mock-acc-lon");
    expect(lonAcc).toBeDefined();
    expect(lonAcc?.name).toBe("Nordea Lønkonto");
    expect(lonAcc?.currency).toBe("DKK");
    expect(lonAcc?.balance).toBeGreaterThan(0);
  });

  it("generates realistic historical transactions with booked and pending states", () => {
    const lonTxs = MockNordeaProvider.getMockTransactions("mock-acc-lon");
    expect(lonTxs.length).toBeGreaterThan(10);

    const hasSalary = lonTxs.some((t) => t.amount > 0 && t.text.includes("Løn"));
    const hasStreaming = lonTxs.some((t) => t.text.includes("Netflix") || t.text.includes("Spotify"));
    const hasPending = lonTxs.some((t) => t.status === "pending");
    const hasBooked = lonTxs.some((t) => t.status === "booked");

    expect(hasSalary).toBe(true);
    expect(hasStreaming).toBe(true);
    expect(hasPending).toBe(true);
    expect(hasBooked).toBe(true);
  });

  it("gracefully falls back to mock auth URL when live API keys are not supplied", async () => {
    const client = new EnableBankingClient();
    expect(client.isConfigured()).toBe(false);

    const authResult = await client.startAuth("Nordea", "DK", "test_state_123");
    expect(authResult.url).toContain("code=mock_nordea_auth_code");
    expect(authResult.url).toContain("state=test_state_123");
    expect(authResult.sessionId).toContain("mock-session");
  });

  it("exchanges mock authorization code for active accounts", async () => {
    const client = new EnableBankingClient();
    const result = await client.createSession("mock_nordea_auth_code");

    expect(result.accounts).toHaveLength(3);
    expect(result.accounts[0].name).toContain("Nordea");
  });
});
