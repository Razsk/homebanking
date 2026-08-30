"use client";

import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Sliders, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Landmark, 
  CheckCircle2, 
  ExternalLink,
  Copy,
  Check,
  AlertCircle
} from "lucide-react";
import { SyncButton } from "../components/SyncButton";

export default function SettingsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [credStatus, setCredStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Credential Form
  const [appIdInput, setAppIdInput] = useState("");
  const [keyIdInput, setKeyIdInput] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);
  const [credSaved, setCredSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // New Rule Form State
  const [pattern, setPattern] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isSubscription, setIsSubscription] = useState(false);
  const [priority, setPriority] = useState("10");

  const [connecting, setConnecting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, rulesRes, credRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/rules"),
        fetch("/api/settings/credentials"),
      ]);

      const analyticsData = await analyticsRes.json();
      const rulesData = await rulesRes.json();
      const credData = await credRes.json();

      setAnalytics(analyticsData);
      setRules(rulesData.rules || []);
      setCategories(rulesData.categories || []);
      setCredStatus(credData);

      if (credData.keyId && !keyIdInput) setKeyIdInput(credData.keyId);
      if (rulesData.categories?.length > 0 && !categoryId) {
        setCategoryId(rulesData.categories[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingCreds(true);
      const res = await fetch("/api/settings/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: appIdInput, keyId: keyIdInput }),
      });
      if (res.ok) {
        setCredSaved(true);
        setTimeout(() => setCredSaved(false), 3000);
        loadData();
      } else {
        const err = await res.json();
        alert("Fejl: " + err.error);
      }
    } catch (e: any) {
      alert("Fejl ved gemning: " + e.message);
    } finally {
      setSavingCreds(false);
    }
  };

  const handleCopyPublicKey = () => {
    if (credStatus?.publicKey) {
      navigator.clipboard.writeText(credStatus.publicKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    }
  };

  const handleStartAuth = async () => {
    try {
      setConnecting(true);
      const res = await fetch("/api/auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName: "Nordea", country: "DK" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Fejl ved start af MitID godkendelse: " + (data.error || "Ukendt fejl"));
      }
    } catch (e: any) {
      alert("Fejl: " + e.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pattern.trim()) return;

    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pattern,
          categoryId,
          isSubscription,
          priority: parseInt(priority, 10),
        }),
      });

      if (res.ok) {
        setPattern("");
        setIsSubscription(false);
        await fetch("/api/sync", { method: "POST" });
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Er du sikker på, at du vil slette denne regel?")) return;
    try {
      const res = await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Forbindelse & Indstillinger</h1>
        <p className="text-sm text-slate-500">Live PSD2 Open Banking integration med Nordea Danmark</p>
      </div>

      {/* Enable Banking API Credentials Section */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Enable Banking API Nøgler</h3>
              <p className="text-xs text-slate-400">Asymmetrisk RS256 nøglepar og Application Credentials</p>
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

        {/* Public Key Display */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase">Din Offentlige RSA Nøgle (public.key)</span>
            <button
              onClick={handleCopyPublicKey}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md shadow-2xs transition-colors"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedKey ? "Kopieret!" : "Kopiér Nøgle"}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            Upload denne nøgle under din applikation i{" "}
            <a
              href="https://enablebanking.com"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 font-semibold inline-flex items-center gap-0.5 hover:underline"
            >
              Enable Banking Control Panel <ExternalLink className="w-3 h-3" />
            </a>{" "}
            for at modtage et <strong>Key ID</strong>.
          </p>
          <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto max-h-32">
            {credStatus?.publicKey || "Genererer nøgler..."}
          </pre>
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
                placeholder="f.eks. a1b2c3d4-e5f6-7890-..."
                value={appIdInput}
                onChange={(e) => setAppIdInput(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Key ID (kid)
              </label>
              <input
                type="text"
                required
                placeholder="f.eks. key-prod-01"
                value={keyIdInput}
                onChange={(e) => setKeyIdInput(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-400">
              Redirect URL: <code className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">{credStatus?.redirectUrl || "http://localhost:3000/api/auth/callback"}</code>
            </div>
            <button
              type="submit"
              disabled={savingCreds}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              {savingCreds ? "Gemmer..." : credSaved ? "Gemt i .env!" : "Gem API Nøgler"}
            </button>
          </div>
        </form>
      </div>

      {/* Nordea Connection Card */}
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
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Forbundet ({analytics.accountsCount} konti)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-500">
                    Ikke forbundet
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Direkte konto- og transaktionsadgang via MitID godkendelse
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

        {/* Consent Info Grid */}
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

      {/* Classification Rules Section */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Klassificeringsregler</h3>
            <p className="text-xs text-slate-500">Regler eksekveres i prioriteret rækkefølge mod posteringstekst</p>
          </div>
        </div>

        {/* Add New Rule Form */}
        <form onSubmit={handleCreateRule} className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Tilføj Ny Regel</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mønster / Tekst</label>
              <input
                type="text"
                required
                placeholder="f.eks. Matas, McDonald's"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="isSubCheck"
                  checked={isSubscription}
                  onChange={(e) => setIsSubscription(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <label htmlFor="isSubCheck" className="text-xs font-medium text-slate-700">
                  Er Abonnement
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tilføj Regel</span>
              </button>
            </div>
          </div>
        </form>

        {/* Existing Rules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Mønster</th>
                <th className="py-2.5 px-3">Tildelt Kategori</th>
                <th className="py-2.5 px-3 text-center">Er Abonnement</th>
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
    </div>
  );
}
