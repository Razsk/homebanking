"use client";

import { useEffect, useState } from "react";
import { 
  Key, 
  Landmark, 
  ShieldCheck, 
  Tag, 
  Sliders, 
  Trash2, 
  Plus, 
  Check, 
  Copy, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Edit2, 
  Eye, 
  EyeOff, 
  Bell, 
  Database, 
  FileSpreadsheet, 
  FileJson, 
  Layers 
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"bank" | "accounts" | "categories" | "rules" | "subs" | "data">("bank");
  const [loading, setLoading] = useState(true);

  // Data states
  const [credStatus, setCredStatus] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>({
    primaryBank: "Nordea",
    subDaysThreshold: "5",
    subAmountVariance: "15",
    consentAlertDays: "14",
    syncHistoryDays: "180",
  });

  // Credential inputs
  const [appIdInput, setAppIdInput] = useState("");
  const [keyIdInput, setKeyIdInput] = useState("");
  const [redirectUrlInput, setRedirectUrlInput] = useState("http://localhost:3000/api/auth/callback");
  const [savingCreds, setSavingCreds] = useState(false);
  const [credSaved, setCredSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedRedirectUrl, setCopiedRedirectUrl] = useState(false);
  const [regeneratingKeys, setRegeneratingKeys] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Key & Certificate manual editing
  const [keyDisplayMode, setKeyDisplayMode] = useState<"crt" | "key">("crt");
  const [showManualKeyEdit, setShowManualKeyEdit] = useState(false);
  const [manualPublicKey, setManualPublicKey] = useState("");
  const [manualCertificate, setManualCertificate] = useState("");
  const [manualPrivateKey, setManualPrivateKey] = useState("");
  const [savingManualKeys, setSavingManualKeys] = useState(false);
  const [manualKeysSaved, setManualKeysSaved] = useState(false);

  // Category modal / form
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#3b82f6");
  const [newCatIsIncome, setNewCatIsIncome] = useState(false);

  // Rule form
  const [rulePattern, setRulePattern] = useState("");
  const [ruleCatId, setRuleCatId] = useState("");
  const [ruleIsSub, setRuleIsSub] = useState(false);
  const [rulePriority, setRulePriority] = useState("10");

  // Account editing
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editAccountName, setEditAccountName] = useState("");

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [credRes, analyticsRes, accRes, catRes, rulesRes, prefRes] = await Promise.all([
        fetch("/api/settings/credentials"),
        fetch("/api/analytics"),
        fetch("/api/settings/accounts"),
        fetch("/api/settings/categories"),
        fetch("/api/rules"),
        fetch("/api/settings/preferences"),
      ]);

      const cred = await credRes.json();
      const ana = await analyticsRes.json();
      const acc = await accRes.json();
      const cat = await catRes.json();
      const rul = await rulesRes.json();
      const pref = await prefRes.json();

      setCredStatus(cred);
      setAnalytics(ana);
      setAccounts(Array.isArray(acc) ? acc : []);
      setCategories(Array.isArray(cat) ? cat : []);
      setRules(rul.rules || []);
      setPreferences(pref);

      if (cred.publicKey && !manualPublicKey) setManualPublicKey(cred.publicKey);
      if (cred.certificate && !manualCertificate) setManualCertificate(cred.certificate);
      if (cred.appId && !appIdInput) setAppIdInput(cred.appId);
      if (cred.keyId && !keyIdInput) setKeyIdInput(cred.keyId);
      if (cred.redirectUrl) setRedirectUrlInput(cred.redirectUrl);
      if (cat.length > 0 && !ruleCatId) setRuleCatId(cat[0].id);
    } catch (e) {
      console.error("Fejl ved indlaesning af indstillinger:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingCreds(true);
      const res = await fetch("/api/settings/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: appIdInput,
          keyId: keyIdInput || appIdInput,
          redirectUrl: redirectUrlInput,
        }),
      });
      if (res.ok) {
        setCredSaved(true);
        setTimeout(() => setCredSaved(false), 3000);
        alert("API nøgler og Redirect URL gemt i .env!");
        loadAllData();
      } else {
        const err = await res.json();
        alert("Fejl: " + err.error);
      }
    } catch (e: any) {
      alert("Fejl: " + e.message);
    } finally {
      setSavingCreds(false);
    }
  };

  const handleRegenerateKeys = async () => {
    if (!confirm("Vil du generere et nyt RSA-4096 nøglepar og X.509 certifikat? Du skal uploade det nye certifikat til Enable Banking bagefter.")) return;
    try {
      setRegeneratingKeys(true);
      const res = await fetch("/api/settings/keys/regenerate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        if (data.publicKey) setManualPublicKey(data.publicKey);
        if (data.certificate) setManualCertificate(data.certificate);
        loadAllData();
      } else {
        alert("Fejl: " + data.error);
      }
    } catch (e: any) {
      alert("Fejl: " + e.message);
    } finally {
      setRegeneratingKeys(false);
    }
  };

  const handleSaveManualKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingManualKeys(true);
      const res = await fetch("/api/settings/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: manualPublicKey,
          certificate: manualCertificate,
          privateKey: manualPrivateKey,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setManualKeysSaved(true);
        setTimeout(() => setManualKeysSaved(false), 3000);
        setShowManualKeyEdit(false);
        setManualPrivateKey(""); // Clear sensitive input
        alert("Nøglefiler er opdateret i projektet!");
        loadAllData();
      } else {
        alert("Fejl: " + data.error);
      }
    } catch (e: any) {
      alert("Fejl: " + e.message);
    } finally {
      setSavingManualKeys(false);
    }
  };

  const handleStartAuth = async () => {
    try {
      setConnecting(true);
      const res = await fetch("/api/auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName: preferences.primaryBank || "Nordea", country: "DK" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Fejl ved start af MitID: " + (data.error || "Ukendt fejl"));
      }
    } catch (e: any) {
      alert("Fejl: " + e.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      if (res.ok) alert("Indstillinger gemt!");
    } catch (e: any) {
      alert("Fejl: " + e.message);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await fetch("/api/settings/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName, color: newCatColor, isIncome: newCatIsIncome }),
      });
      if (res.ok) {
        setNewCatName("");
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Slet denne kategori? Tilknyttede poster flyttes til 'Andet / Diverse'.")) return;
    try {
      const res = await fetch(`/api/settings/categories?id=${id}`, { method: "DELETE" });
      if (res.ok) loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAccountCustomName = async (id: string) => {
    try {
      const res = await fetch("/api/settings/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, customName: editAccountName }),
      });
      if (res.ok) {
        setEditingAccountId(null);
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAccountHidden = async (acc: any) => {
    try {
      const res = await fetch("/api/settings/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: acc.id, isHidden: !acc.isHidden }),
      });
      if (res.ok) loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rulePattern.trim()) return;
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pattern: rulePattern,
          categoryId: ruleCatId,
          isSubscription: ruleIsSub,
          priority: parseInt(rulePriority, 10),
          matchType: "contains",
        }),
      });
      if (res.ok) {
        setRulePattern("");
        setRuleIsSub(false);
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Slet regel?")) return;
    try {
      const res = await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
      if (res.ok) loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRerunRules = async () => {
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`Synkronisering og genklassificering fuldført! Synkroniserede poster: ${data.syncedCount}`);
        loadAllData();
      } else {
        alert("Fejl: " + data.error);
      }
    } catch (e: any) {
      alert("Fejl: " + e.message);
    }
  };

  const handleClearTransactions = async () => {
    if (!confirm("Er du sikker på, at du vil slette alle transaktioner og abonnementer? Konti og regler bevares.")) return;
    try {
      const res = await fetch("/api/settings/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_transactions" }),
      });
      if (res.ok) {
        alert("Alle transaktioner slettet.");
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("⚠️ ADVARSEL: Dette sletter alle konti, transaktioner og samtykkesessioner! Fortsæt?")) return;
    try {
      const res = await fetch("/api/settings/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_all" }),
      });
      if (res.ok) {
        alert("Systemet er nulstillet.");
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const tabs = [
    { id: "bank", label: "Bank & API Forbindelse", icon: Landmark },
    { id: "accounts", label: "Konti & Visning", icon: Layers },
    { id: "categories", label: "Kategorier & Farver", icon: Tag },
    { id: "rules", label: "Klassificeringsregler", icon: Sliders },
    { id: "subs", label: "Abonnementsparametre", icon: Bell },
    { id: "data", label: "Eksport & Data", icon: Database },
  ];;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Indstillinger</h1>
        <p className="text-sm text-slate-500">Konfigurér Open Banking, bankkonti, kategorier og datalagring</p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors shrink-0 ${
                isActive
                  ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BANK & API CONNECTION */}
      {activeTab === "bank" && (
        <div className="space-y-6">
          {/* Nordea MitID Connection Card */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0000a0] flex items-center justify-center text-white shadow-md">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-lg">Nordea Danmark (PSD2 AISP)</h3>
                    {analytics?.accountsCount > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Forbundet ({analytics.accountsCount} konti)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                        Ikke forbundet
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hent automatisk kontosaldi og posteringer direkte fra din Nordea netbank
                  </p>
                </div>
              </div>

              <button
                onClick={handleStartAuth}
                disabled={connecting || !credStatus?.isConfigured}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-white bg-[#0000a0] hover:bg-[#000088] shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{connecting ? "Åbner MitID..." : "Forbind med Nordea (MitID)"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-xs font-medium text-slate-500">Samtykkestatus</span>
                <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  {analytics?.consent ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Aktivt
                    </span>
                  ) : (
                    <span className="text-slate-400">Intet aktivt samtykke endnu</span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-xs font-medium text-slate-500">Gyldighed (180 Dage Regel)</span>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {analytics?.consent ? `${analytics.consent.daysRemaining} dage tilbage` : "0 dage"}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-xs font-medium text-slate-500">Tilknyttede Konti</span>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {analytics?.accountsCount || 0} konti godkendt
                </p>
              </div>
            </div>
          </div>

          {/* Enable Banking API Credentials */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Enable Banking API Nøgler</h3>
                  <p className="text-xs text-slate-400">RS256 JWT asymmetrisk autentificering</p>
                </div>
              </div>
              <div>
                {credStatus?.isConfigured ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Konfigureret (Live Klar)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5" /> Mangler API nøgler
                  </span>
                )}
              </div>
            </div>

            {/* Public Certificate & Key Display with Manual Editing */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setKeyDisplayMode("crt")}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        keyDisplayMode === "crt"
                          ? "bg-white text-blue-600 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      X.509 Certifikat (public.crt)
                    </button>
                    <button
                      type="button"
                      onClick={() => setKeyDisplayMode("key")}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        keyDisplayMode === "key"
                          ? "bg-white text-blue-600 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Offentlig Nøgle (public.key)
                    </button>
                  </div>
                  {keyDisplayMode === "crt" && (
                    <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                      Til Enable Banking
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowManualKeyEdit(!showManualKeyEdit)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-2xs transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{showManualKeyEdit ? "Skjul Editor" : "Redigér / Indsæt Nøgler"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerateKeys}
                    disabled={regeneratingKeys}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regeneratingKeys ? "animate-spin" : ""}`} />
                    <span>Regenerér (4096-bit)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textToCopy = keyDisplayMode === "crt" ? credStatus?.certificate : credStatus?.publicKey;
                      if (textToCopy) {
                        navigator.clipboard.writeText(textToCopy);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 3000);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? "Kopieret!" : keyDisplayMode === "crt" ? "Kopiér Certifikat" : "Kopiér Nøgle"}</span>
                  </button>
                </div>
              </div>

              {/* Code Preview */}
              {!showManualKeyEdit ? (
                <div className="relative">
                  <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto max-h-36 leading-relaxed select-all">
                    {keyDisplayMode === "crt"
                      ? (credStatus?.certificate || "Ingen public.crt fundet endnu...")
                      : (credStatus?.publicKey || "Ingen public.key fundet endnu...")}
                  </pre>
                  <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                    <span>
                      {keyDisplayMode === "crt"
                        ? "Dette er det selvsignerede X.509 certifikat, som du indsætter i Enable Banking kontrolpanelet under Trin 5."
                        : "Dette er den rå offentlige SPKI RSA-nøgle."}
                    </span>
                    <span className="font-mono text-slate-400">4096-bit RSA</span>
                  </div>
                </div>
              ) : (
                /* Manual Key Editor Form */
                <form onSubmit={handleSaveManualKeys} className="p-4 bg-white rounded-xl border border-blue-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase">Manuel Nøgleeditor</h4>
                    <span className="text-[11px] text-slate-500">Indsæt eller redigér dine nøgler direkte</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Offentligt Certifikat (public.crt)
                      </label>
                      <textarea
                        rows={4}
                        placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                        value={manualCertificate}
                        onChange={(e) => setManualCertificate(e.target.value)}
                        className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Offentlig Nøgle (public.key)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                        value={manualPublicKey}
                        onChange={(e) => setManualPublicKey(e.target.value)}
                        className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Privat Nøgle (private.key) — <span className="text-amber-600 font-normal">Udfyld kun hvis du vil overskrive den lokale private nøgle</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="-----BEGIN PRIVATE KEY----- / -----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                        value={manualPrivateKey}
                        onChange={(e) => setManualPrivateKey(e.target.value)}
                        className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowManualKeyEdit(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                    >
                      Annullér
                    </button>
                    <button
                      type="submit"
                      disabled={savingManualKeys}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                    >
                      {savingManualKeys ? "Gemmer..." : manualKeysSaved ? "Gemt!" : "Gem Nøglefiler"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Application ID (App ID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="f.eks. 273423cd-ed14-4612-9b16-..."
                    value={appIdInput}
                    onChange={(e) => setAppIdInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Key ID (kid) <span className="text-slate-400 font-normal">(Valgfri — standard er App ID)</span>
                  </label>
                  <input
                    type="text"
                    placeholder={appIdInput || "Samme som Application ID"}
                    value={keyIdInput}
                    onChange={(e) => setKeyIdInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Redirect URL (Callback)
                  </label>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Skal registreres i Enable Banking
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={redirectUrlInput}
                    onChange={(e) => setRedirectUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(redirectUrlInput);
                      setCopiedRedirectUrl(true);
                      setTimeout(() => setCopiedRedirectUrl(false), 3000);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors shrink-0"
                  >
                    {copiedRedirectUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedRedirectUrl ? "Kopieret!" : "Kopiér URL"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Kopiér denne URL og indsæt den under <strong>&quot;Redirect URLs&quot;</strong> i Enable Banking kontrolpanelet for din applikation.
                </p>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingCreds}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  {savingCreds ? "Gemmer..." : credSaved ? "Gemt i .env!" : "Gem API Nøgler & URL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNTS MANAGEMENT */}
      {activeTab === "accounts" && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Dine Bankkonti</h3>
              <p className="text-xs text-slate-400">Tilpas visningsnavne eller skjul specifikke konti fra overblikket</p>
            </div>
            <span className="text-xs font-medium text-slate-500">{accounts.length} konti fundet</span>
          </div>

          {accounts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Landmark className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-sm text-slate-600">Ingen bankkonti forbundet endnu</p>
              <p className="text-xs mt-1">Gå til fanen &apos;Bank & API Forbindelse&apos; for at forbinde Nordea via MitID.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {accounts.map((acc) => (
                <div key={acc.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                      {acc.currency}
                    </div>
                    <div>
                      {editingAccountId === acc.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editAccountName}
                            onChange={(e) => setEditAccountName(e.target.value)}
                            className="px-2 py-1 text-sm border border-slate-300 rounded font-medium"
                            placeholder="Nyt visningsnavn"
                          />
                          <button
                            onClick={() => handleSaveAccountCustomName(acc.id)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-semibold"
                          >
                            Gem
                          </button>
                          <button
                            onClick={() => setEditingAccountId(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                          >
                            Annuller
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {acc.customName || acc.name}
                          </h4>
                          <button
                            onClick={() => {
                              setEditingAccountId(acc.id);
                              setEditAccountName(acc.customName || acc.name);
                            }}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title="Omdøb konto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-slate-400 font-mono">
                        {acc.iban || acc.accountNumber || "Ingen IBAN"} • {acc._count?.transactions || 0} poster
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {acc.balance.toLocaleString("da-DK", { minimumFractionDigits: 2 })} {acc.currency}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleAccountHidden(acc)}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        acc.isHidden
                          ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                      title={acc.isHidden ? "Kontoen er skjult i overblik" : "Kontoen vises i overblik"}
                    >
                      {acc.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{acc.isHidden ? "Skjult" : "Aktiv"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CATEGORIES MANAGEMENT */}
      {activeTab === "categories" && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Kategoristyring</h3>
              <p className="text-xs text-slate-400">Opret, redigér farver og tilpas dine forbrugskategorier</p>
            </div>
            <span className="text-xs font-medium text-slate-500">{categories.length} kategorier</span>
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleCreateCategory} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Opret Ny Kategori</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kategorinavn</label>
                <input
                  type="text"
                  required
                  placeholder="f.eks. Børn & Skole, Hobby"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Farve</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-10 h-9 p-0.5 rounded border border-slate-300 cursor-pointer bg-white"
                  />
                  <span className="text-xs font-mono text-slate-500">{newCatColor}</span>
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="catIsIncCheck"
                    checked={newCatIsIncome}
                    onChange={(e) => setNewCatIsIncome(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <label htmlFor="catIsIncCheck" className="text-xs font-medium text-slate-700">
                    Er Indtægt
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tilføj Kategori</span>
                </button>
              </div>
            </div>
          </form>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{cat.name}</h4>
                    <span className="text-[11px] text-slate-400">
                      {cat.isIncome ? "Indtægt" : "Udgift"} • {cat._count?.transactions || 0} poster
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded"
                  title="Slet kategori"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RULES MANAGEMENT */}
      {activeTab === "rules" && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Klassificeringsregler</h3>
              <p className="text-xs text-slate-400">Regler eksekveres i prioriteret rækkefølge mod posteringstekst</p>
            </div>
            <button
              onClick={handleRerunRules}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Gen-klassificér alle poster</span>
            </button>
          </div>

          {/* Add Rule Form */}
          <form onSubmit={handleCreateRule} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Opret Ny Regel</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mønster / Søgetekst</label>
                <input
                  type="text"
                  required
                  placeholder="f.eks. Matas, McDonald's"
                  value={rulePattern}
                  onChange={(e) => setRulePattern(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kategori</label>
                <select
                  value={ruleCatId}
                  onChange={(e) => setRuleCatId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prioritet</label>
                <input
                  type="number"
                  value={rulePriority}
                  onChange={(e) => setRulePriority(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="ruleSubCheck"
                    checked={ruleIsSub}
                    onChange={(e) => setRuleIsSub(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <label htmlFor="ruleSubCheck" className="text-xs font-medium text-slate-700">
                    Er Abonnement
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tilføj</span>
                </button>
              </div>
            </div>
          </form>

          {/* Rules Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Mønster</th>
                  <th className="py-2.5 px-3">Tildelt Kategori</th>
                  <th className="py-2.5 px-3 text-center">Abonnement</th>
                  <th className="py-2.5 px-3 text-center">Prioritet</th>
                  <th className="py-2.5 px-3 text-right">Handling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono text-xs">
                      {rule.pattern}
                    </td>
                    <td className="py-2.5 px-3">
                      {rule.category && (
                        <span
                          className="inline-block text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${rule.category.color}15`, color: rule.category.color }}
                        >
                          {rule.category.name}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {rule.isSubscription ? (
                        <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium">Ja</span>
                      ) : (
                        <span className="text-xs text-slate-400">Nej</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-500">
                      {rule.priority}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Slet regel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SUBSCRIPTION & NOTIFICATION PREFERENCES */}
      {activeTab === "subs" && (
        <form onSubmit={handleSavePreferences} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">Abonnements- & Notifikationsparametre</h3>
            <p className="text-xs text-slate-400">Styr intervaldetektion og varslingstider</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Interval Tolerance (Dage)
              </label>
              <p className="text-xs text-slate-400 mb-2">
                Hvor mange dages afvigelse fra 30/90/365 dage der accepteres som et fast abonnement (standard: 5 dage).
              </p>
              <input
                type="number"
                value={preferences.subDaysThreshold}
                onChange={(e) => setPreferences({ ...preferences, subDaysThreshold: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Beløbs Variance Tolerance (%)
              </label>
              <p className="text-xs text-slate-400 mb-2">
                Maksimal procentvis afvigelse i beløb for udenlandske subscriptions med valutaveksling (standard: 15%).
              </p>
              <input
                type="number"
                value={preferences.subAmountVariance}
                onChange={(e) => setPreferences({ ...preferences, subAmountVariance: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Varsel for PSD2 Samtykkeudløb (Dage)
              </label>
              <p className="text-xs text-slate-400 mb-2">
                Advar i god tid før 180 dages MitID-samtykket udløber (standard: 14 dage).
              </p>
              <input
                type="number"
                value={preferences.consentAlertDays}
                onChange={(e) => setPreferences({ ...preferences, consentAlertDays: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Standard Bank
              </label>
              <p className="text-xs text-slate-400 mb-2">
                Standard banknavn ved MitID autentificering.
              </p>
              <select
                value={preferences.primaryBank}
                onChange={(e) => setPreferences({ ...preferences, primaryBank: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Nordea">Nordea Danmark</option>
                <option value="Danske Bank">Danske Bank</option>
                <option value="Jyske Bank">Jyske Bank</option>
                <option value="Nykredit">Nykredit</option>
                <option value="Sydbank">Sydbank</option>
                <option value="Arbejdernes Landsbank">Arbejdernes Landsbank</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Standard Synkroniseringshistorik
              </label>
              <p className="text-xs text-slate-400 mb-2">
                Hvor lang en historik der hentes ved et standard klik på synkronisér-knappen.
              </p>
              <select
                value={preferences.syncHistoryDays || "180"}
                onChange={(e) => setPreferences({ ...preferences, syncHistoryDays: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="30">Seneste 30 dage (Hurtig)</option>
                <option value="90">Seneste 90 dage (3 måneder - Standard)</option>
                <option value="180">Seneste 180 dage (6 måneder)</option>
                <option value="365">Seneste 1 år (12 måneder)</option>
                <option value="535">Maksimal historik (540 dage / 18 måneder - Nordea Maksimum)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              Gem Parametre
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: DATA EXPORT & RESET */}
      {activeTab === "data" && (
        <div className="space-y-6">
          {/* Export card */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Eksportér Dine Bankdata</h3>
              <p className="text-xs text-slate-400">Download dine posteringer og opsætning til regneark eller backup</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="/api/settings/export?format=csv"
                download
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 flex items-center gap-3 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600">Download Excel / CSV</h4>
                  <p className="text-xs text-slate-400">Kompatibel med Excel, Numbers & Google Sheets</p>
                </div>
              </a>

              <a
                href="/api/settings/export?format=json"
                download
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 flex items-center gap-3 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600">Download Fuld JSON Backup</h4>
                  <p className="text-xs text-slate-400">Indeholder konti, regler, kategorier og poster</p>
                </div>
              </a>
            </div>
          </div>

          {/* Reset / Danger Zone */}
          <div className="p-6 bg-white rounded-2xl border border-rose-200 shadow-sm space-y-4">
            <div className="pb-4 border-b border-rose-100">
              <h3 className="font-bold text-rose-900 text-base">Nulstilling & Dataadministration</h3>
              <p className="text-xs text-rose-500">Handlinger herunder sletter data fra den lokale database</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-rose-50/40 border border-rose-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Slet alle transaktioner</h4>
                <p className="text-xs text-slate-500">Fjerner alle synkroniserede posteringer og abonnementer. Konti og regler bevares.</p>
              </div>
              <button
                onClick={handleClearTransactions}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-white border border-rose-300 hover:bg-rose-50 rounded-lg shrink-0 transition-colors"
              >
                Slet Transaktioner
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-rose-50/80 border border-rose-200">
              <div>
                <h4 className="font-bold text-rose-900 text-sm">Fuld Nulstilling (Fabriksindstilling)</h4>
                <p className="text-xs text-rose-600">Sletter alle konti, transaktioner, samtykker og genindlæser standardopsætningen.</p>
              </div>
              <button
                onClick={handleClearAll}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shrink-0 transition-colors shadow-sm"
              >
                Nulstil Alt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
