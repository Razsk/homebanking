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
      privateKeyPath: config?.privateKeyPath || process.env.ENABLE_BANKING_KEY_PATH || "",
      redirectUrl: config?.redirectUrl || process.env.ENABLE_BANKING_REDIRECT_URL || "http://localhost:3000/api/auth/callback",
    };
  }

  public isConfigured(): boolean {
    return Boolean(this.config.appId && this.config.keyId && this.config.privateKeyPath && fs.existsSync(this.config.privateKeyPath));
  }

  private generateToken(): string {
    if (!this.isConfigured()) {
      throw new Error("Enable Banking credentials not configured.");
    }

    const privateKey = fs.readFileSync(path.resolve(this.config.privateKeyPath), "utf8");
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      iss: this.config.appId,
      aud: "https://api.enablebanking.com",
      iat: now,
      exp: now + 3600, // 1 hour
    };

    return jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      keyid: this.config.keyId,
    });
  }

  public async startAuth(bankName: string = "Nordea", country: string = "DK", state: string = "nordea_auth"): Promise<{ url: string; sessionId: string }> {
    if (!this.isConfigured()) {
      // Return local mock auth url
      return {
        url: `/api/auth/callback?code=mock_nordea_auth_code&state=${encodeURIComponent(state)}`,
        sessionId: "mock-session-" + Date.now(),
      };
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
      throw new Error(`Enable Banking auth failed: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return {
      url: data.url,
      sessionId: data.session_id,
    };
  }

  public async createSession(code: string): Promise<{ sessionId: string; accounts: BankAccountData[] }> {
    if (!this.isConfigured() || code.startsWith("mock_")) {
      return MockNordeaProvider.getMockSession();
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
      throw new Error(`Enable Banking createSession failed: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return {
      sessionId: data.session_id,
      accounts: (data.accounts || []).map((acc: any) => ({
        accountId: acc.account_id?.iban || acc.uid || acc.account_id,
        iban: acc.account_id?.iban,
        accountNumber: acc.account_id?.other?.identification,
        name: acc.account_id?.name || "Nordea Konto",
        currency: acc.currency || "DKK",
        balance: 0,
      })),
    };
  }

  public async fetchTransactions(accountId: string, dateFrom?: string): Promise<BankTransactionData[]> {
    if (!this.isConfigured() || accountId.startsWith("mock-")) {
      return MockNordeaProvider.getMockTransactions(accountId);
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
      throw new Error(`Enable Banking fetchTransactions failed: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return (data.transactions || []).map((tx: any) => ({
      transactionId: tx.entry_reference || tx.transaction_id,
      amount: parseFloat(tx.transaction_amount?.amount || tx.amount || "0"),
      date: tx.booking_date || tx.value_date || new Date().toISOString().split("T")[0],
      valueDate: tx.value_date,
      text: tx.remittance_information_unstructured || tx.creditor_name || "Postering",
      counterparty: tx.creditor_name || tx.debtor_name,
      status: tx.status === "pending" ? "pending" : "booked",
    }));
  }
}

// -------------------------------------------------------------
// Realistisk Dansk Mock Provider til offline/lokal udvikling
// -------------------------------------------------------------
export class MockNordeaProvider {
  public static getMockSession(): { sessionId: string; accounts: BankAccountData[] } {
    return {
      sessionId: "mock-nordea-session-" + Date.now(),
      accounts: [
        {
          accountId: "mock-acc-lon",
          iban: "DK5020000123456789",
          accountNumber: "2360 0344801207",
          name: "Nordea Lønkonto",
          currency: "DKK",
          balance: 38450.50,
          bookedBalance: 38450.50,
          availableBalance: 53450.50, // inkl. kassekredit
        },
        {
          accountId: "mock-acc-budget",
          iban: "DK5020000987654321",
          accountNumber: "2360 0344809912",
          name: "Nordea Budgetkonto",
          currency: "DKK",
          balance: 14200.00,
          bookedBalance: 14200.00,
          availableBalance: 14200.00,
        },
        {
          accountId: "mock-acc-opsparing",
          iban: "DK5020000456123789",
          accountNumber: "2360 0344804567",
          name: "Nordea Opsparing",
          currency: "DKK",
          balance: 95300.00,
          bookedBalance: 95300.00,
          availableBalance: 95300.00,
        },
      ],
    };
  }

  public static getMockTransactions(accountId: string): BankTransactionData[] {
    const today = new Date();
    const format = (d: Date) => d.toISOString().split("T")[0];

    const generateDate = (daysAgo: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return format(d);
    };

    if (accountId === "mock-acc-budget") {
      return [
        // Månedlige faste udgifter over 3 måneder
        { amount: -8500.00, date: generateDate(1), text: "Husleje / Boligforening", counterparty: "DEAS Ejendomme", status: "booked" },
        { amount: -8500.00, date: generateDate(31), text: "Husleje / Boligforening", counterparty: "DEAS Ejendomme", status: "booked" },
        { amount: -8500.00, date: generateDate(62), text: "Husleje / Boligforening", counterparty: "DEAS Ejendomme", status: "booked" },

        { amount: -650.00, date: generateDate(5), text: "Andel Energi El", counterparty: "Andel Energi", status: "booked" },
        { amount: -680.00, date: generateDate(35), text: "Andel Energi El", counterparty: "Andel Energi", status: "booked" },
        { amount: -640.00, date: generateDate(66), text: "Andel Energi El", counterparty: "Andel Energi", status: "booked" },

        { amount: -1150.00, date: generateDate(8), text: "Tryg Forsikring Indbo & Ulykke", counterparty: "Tryg Forsikring", status: "booked" },
        { amount: -1150.00, date: generateDate(38), text: "Tryg Forsikring Indbo & Ulykke", counterparty: "Tryg Forsikring", status: "booked" },
        { amount: -1150.00, date: generateDate(69), text: "Tryg Forsikring Indbo & Ulykke", counterparty: "Tryg Forsikring", status: "booked" },

        { amount: -399.00, date: generateDate(10), text: "Hiper Bredbånd Fibernet", counterparty: "Hiper A/S", status: "booked" },
        { amount: -399.00, date: generateDate(41), text: "Hiper Bredbånd Fibernet", counterparty: "Hiper A/S", status: "booked" },
        { amount: -399.00, date: generateDate(72), text: "Hiper Bredbånd Fibernet", counterparty: "Hiper A/S", status: "booked" },

        { amount: 11000.00, date: generateDate(1), text: "Overførsel fra Lønkonto til Budget", counterparty: "Egen overførsel", status: "booked" },
        { amount: 11000.00, date: generateDate(31), text: "Overførsel fra Lønkonto til Budget", counterparty: "Egen overførsel", status: "booked" },
        { amount: 11000.00, date: generateDate(62), text: "Overførsel fra Lønkonto til Budget", counterparty: "Egen overførsel", status: "booked" },
      ];
    }

    if (accountId === "mock-acc-opsparing") {
      return [
        { amount: 4000.00, date: generateDate(1), text: "Månedlig opsparing", counterparty: "Egen overførsel", status: "booked" },
        { amount: 4000.00, date: generateDate(31), text: "Månedlig opsparing", counterparty: "Egen overførsel", status: "booked" },
        { amount: 4000.00, date: generateDate(62), text: "Månedlig opsparing", counterparty: "Egen overførsel", status: "booked" },
        { amount: 245.50, date: generateDate(60), text: "Rentetilskrivning", counterparty: "Nordea Bank", status: "booked" },
      ];
    }

    // Default: Lønkonto med abonnementer, dagligvarer, café, transport, løn osv.
    return [
      // Indkomst
      { amount: 34500.00, date: generateDate(1), text: "Lønudbetaling Novo Nordisk A/S", counterparty: "Novo Nordisk", status: "booked" },
      { amount: 34500.00, date: generateDate(31), text: "Lønudbetaling Novo Nordisk A/S", counterparty: "Novo Nordisk", status: "booked" },
      { amount: 34500.00, date: generateDate(62), text: "Lønudbetaling Novo Nordisk A/S", counterparty: "Novo Nordisk", status: "booked" },

      // Abonnementer (tilbagevendende månedlige)
      { amount: -149.00, date: generateDate(2), text: "Netflix.com Premium", counterparty: "Netflix", status: "booked" },
      { amount: -149.00, date: generateDate(32), text: "Netflix.com Premium", counterparty: "Netflix", status: "booked" },
      { amount: -149.00, date: generateDate(63), text: "Netflix.com Premium", counterparty: "Netflix", status: "booked" },

      { amount: -109.00, date: generateDate(4), text: "Spotify AB Premium", counterparty: "Spotify", status: "booked" },
      { amount: -109.00, date: generateDate(34), text: "Spotify AB Premium", counterparty: "Spotify", status: "booked" },
      { amount: -109.00, date: generateDate(65), text: "Spotify AB Premium", counterparty: "Spotify", status: "booked" },

      { amount: -299.00, date: generateDate(1), text: "PureGym Medlemskab", counterparty: "PureGym / Fitness World", status: "booked" },
      { amount: -299.00, date: generateDate(31), text: "PureGym Medlemskab", counterparty: "PureGym / Fitness World", status: "booked" },
      { amount: -299.00, date: generateDate(61), text: "PureGym Medlemskab", counterparty: "PureGym / Fitness World", status: "booked" },

      { amount: -89.00, date: generateDate(12), text: "HBO Max / Max.com", counterparty: "WarnerMedia", status: "booked" },
      { amount: -89.00, date: generateDate(42), text: "HBO Max / Max.com", counterparty: "WarnerMedia", status: "booked" },
      { amount: -89.00, date: generateDate(73), text: "HBO Max / Max.com", counterparty: "WarnerMedia", status: "booked" },

      { amount: -160.00, date: generateDate(15), text: "OpenAI ChatGPT Plus Subscription", counterparty: "OpenAI", status: "booked" },
      { amount: -160.00, date: generateDate(45), text: "OpenAI ChatGPT Plus Subscription", counterparty: "OpenAI", status: "booked" },
      { amount: -160.00, date: generateDate(76), text: "OpenAI ChatGPT Plus Subscription", counterparty: "OpenAI", status: "booked" },

      { amount: -129.00, date: generateDate(18), text: "YouSee Mobil Abonnement", counterparty: "Nuuday / YouSee", status: "booked" },
      { amount: -129.00, date: generateDate(48), text: "YouSee Mobil Abonnement", counterparty: "Nuuday / YouSee", status: "booked" },

      // Variable udgifter / Dagligvarer
      { amount: -384.50, date: generateDate(0), text: "Netto Nørrebrogade", counterparty: "Salling Group", status: "pending" },
      { amount: -142.00, date: generateDate(0), text: "Espresso House KBH", counterparty: "Espresso House", status: "pending" },
      { amount: -512.80, date: generateDate(2), text: "Føtex Frederiksberg", counterparty: "Salling Group", status: "booked" },
      { amount: -229.40, date: generateDate(3), text: "Rema 1000 Jagtvej", counterparty: "Rema 1000", status: "booked" },
      { amount: -180.00, date: generateDate(6), text: "MobilePay til Kasper (Biograf)", counterparty: "MobilePay", status: "booked" },
      { amount: -650.00, date: generateDate(9), text: "Restaurant Pluto KBH", counterparty: "Pluto", status: "booked" },
      { amount: -450.00, date: generateDate(14), text: "OK Benzin Nærum", counterparty: "OK a.m.b.a.", status: "booked" },
      { amount: -76.00, date: generateDate(16), text: "DSB Billet Rejsekort", counterparty: "DSB", status: "booked" },
      { amount: -890.00, date: generateDate(20), text: "Zalando SE Tøj", counterparty: "Zalando", status: "booked" },
      { amount: -415.00, date: generateDate(22), text: "Meny Rotunden", counterparty: "Dagrofa / Meny", status: "booked" },
      { amount: -11000.00, date: generateDate(1), text: "Overførsel til Budgetkonto", counterparty: "Egen overførsel", status: "booked" },
      { amount: -4000.00, date: generateDate(1), text: "Overførsel til Opsparing", counterparty: "Egen overførsel", status: "booked" },
    ];
  }
}
