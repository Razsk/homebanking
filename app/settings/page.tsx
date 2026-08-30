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
  Info
} from "lucide-react";
import { SyncButton } from "../components/SyncButton";

export default function SettingsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Rule Form State
  const [pattern, setPattern] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isSubscription, setIsSubscription] = useState(false);
  const [priority, setPriority] = useState("10");

  const [connecting, setConnecting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, rulesRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/rules"),
      ]);

      const analyticsData = await analyticsRes.json();
      const rulesData = await rulesRes.json();

      setAnalytics(analyticsData);
      setRules(rulesData.rules || []);
      setCategories(rulesData.categories || []);
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
        alert("Fejl ved start af godkendelse: " + (data.error || "Ukendt fejl"));
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
        // re-run sync/classify
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

  const handleReclassifyAll = async () => {
    try {
      await fetch("/api/sync", { method: "POST" });
      alert("Gen-klassificering fuldført!");
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Forbindelse & Klassificeringsregler</h1>
        <p className="text-sm text-slate-500">Konfigurér din Nordea Open Banking integration og automatiske regler</p>
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
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Forbundet
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregator: Enable Banking (Asymmetrisk RS256 JWT & MitID SCA)
              </p>
            </div>
          </div>

          <button
            onClick={handleStartAuth}
            disabled={connecting}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-white bg-[#0000a0] hover:bg-[#000088] shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{connecting ? "Åbner MitID..." : "Forny Samtykke (MitID)"}</span>
          </button>
        </div>

        {/* Consent Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs font-medium text-slate-500">Samtykkestatus</span>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Aktivt (Læseadgang til konti & transaktioner)</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs font-medium text-slate-500">Gyldighed (180 Dage Regel)</span>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {analytics?.consent?.daysRemaining || 180} dage tilbage
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs font-medium text-slate-500">Tilknyttede Konti</span>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {analytics?.accountsCount || 3} konti godkendt
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
          <button
            onClick={handleReclassifyAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Gen-klassificér alle poster</span>
          </button>
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
