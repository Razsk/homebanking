import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

export interface EnableBankingConfig {
  appId: string;
  keyId: string;
  privateKeyPath: string;
  redirectUrl: string;
}

export interface BankAccountData {
  accountId: string;
  iban?: string;
  accountNumber?: string;
  name: string;
  currency: string;
  balance: number;
  bookedBalance?: number;
  availableBalance?: number;
}

export interface BankTransactionData {
  transactionId?: string;
  amount: number;
  date: string;
  valueDate?: string;
  text: string;
  counterparty?: string;
  status: "booked" | "pending";
}

export class EnableBankingClient {
  private config: EnableBankingConfig;
  private baseUrl = "https://api.enablebanking.com";

  constructor(config?: Partial<EnableBankingConfig>) {
    this.config = {
      appId: config?.appId || process.env.ENABLE_BANKING_APP_ID || "",
      keyId: config?.keyId || process.env.ENABLE_BANKING_KEY_ID || "",
      privateKeyPath: config?.privateKeyPath || process.env.ENABLE_BANKING_KEY_PATH || "./private.key",
      redirectUrl: config?.redirectUrl || process.env.ENABLE_BANKING_REDIRECT_URL || "http://localhost:3000/api/auth/callback",
    };
  }

  public isConfigured(): boolean {
    const keyPath = path.resolve(this.config.privateKeyPath);
    const effectiveKeyId = this.config.keyId || this.config.appId;
    return Boolean(
      this.config.appId && 
      this.config.appId.trim() !== "" && 
      effectiveKeyId && 
      effectiveKeyId.trim() !== "" && 
      fs.existsSync(keyPath)
    );
  }

  public getConfigurationStatus() {
    const keyPath = path.resolve(this.config.privateKeyPath);
    const pubPath = path.resolve("./public.key");
    const crtPath = path.resolve("./public.crt");

    return {
      isConfigured: this.isConfigured(),
      hasAppId: Boolean(this.config.appId && this.config.appId.trim() !== ""),
      hasKeyId: Boolean((this.config.keyId || this.config.appId) && (this.config.keyId || this.config.appId).trim() !== ""),
      hasPrivateKey: fs.existsSync(keyPath),
      hasPublicKey: fs.existsSync(pubPath) || fs.existsSync(crtPath),
      publicKey: fs.existsSync(pubPath) ? fs.readFileSync(pubPath, "utf8") : null,
      certificate: fs.existsSync(crtPath) ? fs.readFileSync(crtPath, "utf8") : (fs.existsSync(pubPath) ? fs.readFileSync(pubPath, "utf8") : null),
      appId: this.config.appId ? `${this.config.appId.slice(0, 4)}...${this.config.appId.slice(-4)}` : "",
      keyId: this.config.keyId || this.config.appId || "",
      redirectUrl: this.config.redirectUrl,
    };
  }

  private generateToken(): string {
    if (!this.isConfigured()) {
      throw new Error(
        "Enable Banking er ikke konfigureret endnu. Indtast venligst dit Application ID og Key ID i Indstillinger eller i .env filen."
      );
    }

    const resolvedPath = path.resolve(this.config.privateKeyPath);
    const privateKey = fs.readFileSync(resolvedPath, "utf8");
    const now = Math.floor(Date.now() / 1000);

    // Official Enable Banking JWT format:
    // Header: { "typ": "JWT", "alg": "RS256", "kid": "<application_id>" }
    // Payload: { "iss": "enablebanking.com", "aud": "api.enablebanking.com", "iat": now, "exp": now + 3600 }
    const payload = {
      iss: "enablebanking.com",
      aud: "api.enablebanking.com",
      iat: now,
      exp: now + 3600, // 1 hour TTL (max allowed by Enable Banking is 24 hours)
    };

    return jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      keyid: this.config.keyId || this.config.appId,
    });
  }

  public async startAuth(
    bankName: string = "Nordea",
    country: string = "DK",
    state: string = "nordea_auth"
  ): Promise<{ url: string; sessionId: string }> {
    if (!this.isConfigured()) {
      throw new Error(
        "Enable Banking API-nøgler mangler. Gå til 'Forbindelse & Regler' for at indtaste dit Application ID og Key ID."
      );
    }

    const token = this.generateToken();
    const validUntil = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

    const response = await fetch(`${this.baseUrl}/auth`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access: { valid_until: validUntil },
        aspsp: { name: bankName, country: country },
        redirect_url: this.config.redirectUrl,
        state: state,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Enable Banking /auth fejl (${response.status}): ${err}`);
    }

    const data = await response.json();
    return {
      url: data.url,
      sessionId: data.session_id,
    };
  }

  public async createSession(code: string): Promise<{ sessionId: string; accounts: BankAccountData[] }> {
    if (!this.isConfigured()) {
      throw new Error("Enable Banking er ikke konfigureret.");
    }

    const token = this.generateToken();
    const response = await fetch(`${this.baseUrl}/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Enable Banking /sessions fejl (${response.status}): ${err}`);
    }

    const data = await response.json();

    const accounts: BankAccountData[] = [];
    for (const acc of data.accounts || []) {
      const accId = acc.account_id?.iban || acc.uid || acc.account_id || acc.iban;
      let balance = 0;
      let bookedBalance = 0;
      let availableBalance = 0;

      // Fetch live balances
      try {
        const balRes = await fetch(`${this.baseUrl}/accounts/${encodeURIComponent(accId)}/balances`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (balRes.ok) {
          const balData = await balRes.json();
          for (const b of balData.balances || []) {
            const val = parseFloat(b.balance_amount?.amount || b.amount || "0");
            if (b.balance_type === "closingBooked" || b.balance_type === "interimBooked") {
              bookedBalance = val;
              balance = val;
            } else if (b.balance_type === "interimAvailable" || b.balance_type === "expected") {
              availableBalance = val;
            }
          }
        }
      } catch (e) {
        console.warn("Kunne ikke hente saldi for konto", accId, e);
      }

      accounts.push({
        accountId: accId,
        iban: acc.account_id?.iban || acc.iban,
        accountNumber: acc.account_id?.other?.identification || acc.account_number,
        name: acc.account_id?.name || acc.name || "Nordea Konto",
        currency: acc.currency || "DKK",
        balance: balance,
        bookedBalance: bookedBalance,
        availableBalance: availableBalance || balance,
      });
    }

    return {
      sessionId: data.session_id,
      accounts,
    };
  }

  public async fetchTransactions(accountId: string, dateFrom?: string): Promise<BankTransactionData[]> {
    if (!this.isConfigured()) {
      throw new Error("Enable Banking er ikke konfigureret.");
    }

    const token = this.generateToken();
    const query = dateFrom ? `?date_from=${dateFrom}` : "";
    const response = await fetch(`${this.baseUrl}/accounts/${encodeURIComponent(accountId)}/transactions${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Enable Banking /transactions fejl (${response.status}): ${err}`);
    }

    const data = await response.json();
    return (data.transactions || []).map((tx: any) => ({
      transactionId: tx.entry_reference || tx.transaction_id,
      amount: parseFloat(tx.transaction_amount?.amount || tx.amount || "0"),
      date: tx.booking_date || tx.value_date || new Date().toISOString().split("T")[0],
      valueDate: tx.value_date,
      text: tx.remittance_information_unstructured || tx.creditor_name || tx.debtor_name || "Postering",
      counterparty: tx.creditor_name || tx.debtor_name,
      status: tx.status === "pending" ? "pending" : "booked",
    }));
  }
}
