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
    // Nordea / ASPSP supports at most 180 days (15552000s). We use 179 days to guarantee it stays strictly within the boundary.
    const validUntil = new Date(Date.now() + 179 * 24 * 60 * 60 * 1000).toISOString();

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
    const rawAccounts = data.accounts || [];

    for (const acc of rawAccounts) {
      // Enable Banking account UID is always a UUID string (or in acc.uid / acc object)
      const accUid = typeof acc === "string" ? acc : acc.uid || acc.id || acc.account_uid || acc.account_id;
      if (!accUid || typeof accUid !== "string") continue;

      let accountInfo: any = {};
      try {
        const accRes = await fetch(`${this.baseUrl}/accounts/${encodeURIComponent(accUid)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (accRes.ok) {
          accountInfo = await accRes.json();
        }
      } catch (e) {
        console.warn("Kunne ikke hente kontoinfo for", accUid, e);
      }

      let balance = 0;
      let bookedBalance = 0;
      let availableBalance = 0;

      // Fetch live balances
      try {
        const bal = await this.fetchBalances(accUid);
        balance = bal.balance;
        bookedBalance = bal.bookedBalance;
        availableBalance = bal.availableBalance;
      } catch (e) {
        console.warn("Kunne ikke hente saldi for konto", accUid, e);
      }

      const iban = accountInfo.account_id?.iban || (typeof acc === "object" ? acc.account_id?.iban || acc.iban : null);
      const accountNumber = accountInfo.account_id?.other?.identification || (typeof acc === "object" ? acc.account_id?.other?.identification || acc.account_number : null);
      const name = accountInfo.holder_name || accountInfo.name || accountInfo.account_id?.name || (typeof acc === "object" ? acc.name : null) || (iban ? `Nordea (${iban.slice(-4)})` : "Nordea Konto");
      const currency = accountInfo.currency || (typeof acc === "object" ? acc.currency : null) || "DKK";

      accounts.push({
        accountId: accUid,
        iban: iban || null,
        accountNumber: accountNumber || null,
        name: name,
        currency: currency,
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

  public async fetchBalances(accountId: string): Promise<{
    balance: number;
    bookedBalance: number;
    availableBalance: number;
  }> {
    if (!this.isConfigured()) {
      throw new Error("Enable Banking er ikke konfigureret.");
    }

    const token = this.generateToken();
    const balRes = await fetch(`${this.baseUrl}/accounts/${encodeURIComponent(accountId)}/balances`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!balRes.ok) {
      const err = await balRes.text();
      throw new Error(`Enable Banking /balances fejl (${balRes.status}): ${err}`);
    }

    const balData = await balRes.json();
    let balance = 0;
    let bookedBalance = 0;
    let availableBalance = 0;
    let hasBooked = false;
    let hasAvailable = false;

    for (const b of balData.balances || []) {
      const val = parseFloat(b.balance_amount?.amount || b.amount || "0");
      const type = (b.balance_type || "").toUpperCase();
      const name = (b.name || "").toLowerCase();

      // Booked balance types: ITBD (Interim Booked), CLBD (Closing Booked), XPCD (Expected), PRCD
      if (
        type === "ITBD" ||
        type === "CLBD" ||
        type === "XPCD" ||
        type === "PRCD" ||
        type === "CLOSINGBOOKED" ||
        type === "INTERIMBOOKED" ||
        type === "EXPECTED" ||
        name.includes("booked") ||
        name.includes("bogført")
      ) {
        bookedBalance = val;
        balance = val;
        hasBooked = true;
      } 
      // Available balance types: ITAV (Interim Available), OPAV (Opening Available), AVLB
      else if (
        type === "ITAV" ||
        type === "OPAV" ||
        type === "AVLB" ||
        type === "INTERIMAVAILABLE" ||
        type === "OPENINGAVAILABLE" ||
        name.includes("available") ||
        name.includes("disponibel")
      ) {
        availableBalance = val;
        hasAvailable = true;
      }
    }

    // Fallbacks if only one balance type is provided or none matched explicitly
    if (!hasBooked && hasAvailable) {
      bookedBalance = availableBalance;
      balance = availableBalance;
    } else if (hasBooked && !hasAvailable) {
      availableBalance = bookedBalance;
    } else if (!hasBooked && !hasAvailable && Array.isArray(balData.balances) && balData.balances.length > 0) {
      const firstVal = parseFloat(balData.balances[0].balance_amount?.amount || balData.balances[0].amount || "0");
      balance = firstVal;
      bookedBalance = firstVal;
      availableBalance = firstVal;
    }

    return {
      balance,
      bookedBalance,
      availableBalance: hasAvailable || hasBooked ? availableBalance : balance,
    };
  }

  public async fetchTransactions(accountId: string, dateFrom?: string): Promise<BankTransactionData[]> {
    if (!this.isConfigured()) {
      throw new Error("Enable Banking er ikke konfigureret.");
    }

    const token = this.generateToken();

    // Clamp dateFrom so it doesn't exceed 540 days in the past (ASPSP Nordea maximum)
    let effectiveDateFrom = dateFrom;
    if (effectiveDateFrom) {
      const minDate = new Date(Date.now() - 535 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      if (effectiveDateFrom < minDate) {
        effectiveDateFrom = minDate;
      }
    }

    const allRawTransactions: any[] = [];
    let continuationKey: string | null = null;
    let pageCount = 0;
    const maxPages = 20; // Safety cap (up to ~2000 transactions per account)

    do {
      pageCount++;
      let url = `${this.baseUrl}/accounts/${encodeURIComponent(accountId)}/transactions`;
      const params = new URLSearchParams();
      if (effectiveDateFrom) {
        params.set("date_from", effectiveDateFrom);
      }
      if (continuationKey) {
        params.set("continuation_key", continuationKey);
      }

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Enable Banking /transactions fejl (${response.status}): ${err}`);
      }

      const data = await response.json();
      if (Array.isArray(data.transactions)) {
        allRawTransactions.push(...data.transactions);
      }

      continuationKey = data.continuation_key || null;
    } while (continuationKey && pageCount < maxPages);

    return allRawTransactions.map((tx: any) => {
      let amount = parseFloat(tx.transaction_amount?.amount || tx.amount || "0");
      // DBIT indicator means money went out (expense / negative)
      if (tx.credit_debit_indicator === "DBIT" && amount > 0) {
        amount = -amount;
      }

      let text = "";
      if (Array.isArray(tx.remittance_information) && tx.remittance_information.length > 0) {
        text = tx.remittance_information.join(" ").replace(/\n+/g, " ").trim();
      } else if (tx.remittance_information_unstructured) {
        text = tx.remittance_information_unstructured.trim();
      } else if (tx.creditor?.name) {
        text = tx.creditor.name.trim();
      } else if (tx.debtor?.name) {
        text = tx.debtor.name.trim();
      } else if (tx.bank_transaction_code?.description) {
        text = tx.bank_transaction_code.description.trim();
      } else {
        text = "Postering";
      }

      const counterparty = tx.creditor?.name || tx.debtor?.name || null;

      return {
        transactionId: tx.entry_reference || tx.transaction_id || `tx_${Math.random()}`,
        amount,
        date: tx.booking_date || tx.value_date || tx.transaction_date || new Date().toISOString().split("T")[0],
        valueDate: tx.value_date || null,
        text,
        counterparty,
        status: tx.status === "BOOK" || tx.status === "booked" ? "booked" : "pending",
      };
    });
  }
}
