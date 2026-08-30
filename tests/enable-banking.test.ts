import { describe, it, expect } from "vitest";
import { EnableBankingClient } from "../lib/enable-banking";

describe("Seam 4: Enable Banking Live Client & Validation", () => {
  it("detects configuration status and reports missing keys accurately", () => {
    const client = new EnableBankingClient({ appId: "", keyId: "" });
    const status = client.getConfigurationStatus();

    expect(status.isConfigured).toBe(false);
    expect(status.hasPrivateKey).toBe(true);
    expect(status.hasPublicKey).toBe(true);
    expect(status.publicKey).toContain("BEGIN PUBLIC KEY");
  });

  it("throws clear explanatory error when attempting auth without credentials", async () => {
    const client = new EnableBankingClient({ appId: "", keyId: "" });

    await expect(client.startAuth("Nordea", "DK")).rejects.toThrowError(
      /Enable Banking API-nøgler mangler/
    );
  });

  it("validates that isConfigured returns true only when appId and keyId are non-empty", () => {
    const unconfigured = new EnableBankingClient({ appId: "", keyId: "" });
    expect(unconfigured.isConfigured()).toBe(false);

    const configured = new EnableBankingClient({
      appId: "mock-app-id",
      keyId: "mock-key-id",
      privateKeyPath: "./private.key",
    });
    expect(configured.isConfigured()).toBe(true);
  });
});
