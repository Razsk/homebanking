"use client";

import { useEffect, useState } from "react";
import { 
  Repeat, 
  Plus, 
  Calendar, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle2, 
  PauseCircle, 
  XCircle,
  PlaySquare,
  Sparkles
} from "lucide-react";
import { SyncButton } from "../components/SyncButton";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [yearlyTotal, setYearlyTotal] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Subscription Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [subName, setSubName] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [subInterval, setSubInterval] = useState("monthly");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [subNextDate, setSubNextDate] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [subRes, catRes] = await Promise.all([
        fetch("/api/subscriptions"),
        fetch("/api/rules"),
      ]);

      const subData = await subRes.json();
      const catData = await catRes.json();

      setSubscriptions(subData.subscriptions || []);
      setMonthlyTotal(subData.monthlyTotal || 0);
      setYearlyTotal(subData.yearlyTotal || 0);
      setCategories(catData.categories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: subName,
          amount: subAmount,
          interval: subInterval,
          categoryId: subCategoryId || null,
          nextPaymentDate: subNextDate || undefined,
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        setSubName("");
        setSubAmount("");
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDKK = (amount: number) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getDaysUntil = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "Forfaldet";
    if (diff === 0) return "I dag";
    if (diff === 1) return "I morgen";
    return `Om ${diff} dage`;
  };

  const getIntervalLabel = (interval: string) => {
    switch (interval) {
      case "weekly": return "Ugentlig";
      case "monthly": return "Månedlig";
      case "quarterly": return "Kvartalsvis";
      case "yearly": return "Årlig";
      default: return "Månedlig";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Abonnementer & Faste Udgifter</h1>
          <p className="text-sm text-slate-500">Automatisk detekteret ud fra mønstre og faste intervaller i dine kontobevægelser</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Tilføj Manuelt</span>
          </button>
          <SyncButton onSyncComplete={loadData} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Månedlig Abonnementsudgift</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Repeat className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-slate-900">{formatDKK(monthlyTotal)}</h2>
            <p className="text-xs text-slate-400 mt-1">Gennemsnitligt fast træk pr. måned</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Forventet Årlig Udgift</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-slate-900">{formatDKK(yearlyTotal)}</h2>
            <p className="text-xs text-slate-400 mt-1">Samlet årlig abonnementsbyrde</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Aktive Abonnementer</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-slate-900">{subscriptions.filter((s) => s.status === "active").length} stk</h2>
            <p className="text-xs text-slate-400 mt-1">{subscriptions.filter((s) => s.detectedAuto).length} fundet automatisk af algoritmen</p>
          </div>
        </div>
      </div>

      {/* Subscriptions Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Registrerede Tjenester</h3>
          <div className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Frekvensanalyse aktiv</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subscriptions.map((sub) => {
            const daysUntilStr = getDaysUntil(sub.nextPaymentDate);
            const nextDateFormatted = new Date(sub.nextPaymentDate).toLocaleDateString("da-DK", {
              day: "numeric",
              month: "short",
            });
            const lastDateFormatted = new Date(sub.lastPaymentDate).toLocaleDateString("da-DK", {
              day: "numeric",
              month: "short",
            });

            return (
              <div
                key={sub.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{sub.name}</h4>
                        {sub.detectedAuto && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.5 rounded" title="Automatisk fundet">
                            Auto
                          </span>
                        )}
                      </div>
                      {sub.category && (
                        <span
                          className="inline-block text-[11px] px-2 py-0.5 rounded-full font-medium mt-1"
                          style={{ backgroundColor: `${sub.category.color}15`, color: sub.category.color }}
                        >
                          {sub.category.name}
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded-lg">
                      {getIntervalLabel(sub.interval)}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-slate-900">{formatDKK(sub.amount)}</span>
                    <span className="text-xs text-slate-400 font-normal ml-1">/ {sub.interval === "yearly" ? "år" : "md"}</span>
                  </div>

                  {/* Dates */}
                  <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span>Sidst betalt:</span>
                      <span className="font-medium text-slate-700">{lastDateFormatted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Næste forventede træk:</span>
                      <span className="font-semibold text-purple-700">{nextDateFormatted} ({daysUntilStr})</span>
                    </div>
                  </div>
                </div>

                {/* Footer status / action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
                      sub.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {sub.status === "active" ? "Aktivt" : "Sat på pause"}
                  </span>

                  <button
                    onClick={() => handleStatusChange(sub.id, sub.status === "active" ? "paused" : "active")}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {sub.status === "active" ? "Marker som pauset" : "Genaktiver"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Subscription Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Tilføj Nyt Abonnement</h3>
            <p className="text-xs text-slate-500 mb-4">
              Indtast detaljer for en fast tilbagevendende udgift.
            </p>

            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tjeneste / Navn</label>
                <input
                  type="text"
                  required
                  placeholder="f.eks. iCloud, Politiken, Viaplay"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Beløb (DKK)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="99.00"
                    value={subAmount}
                    onChange={(e) => setSubAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Interval</label>
                  <select
                    value={subInterval}
                    onChange={(e) => setSubInterval(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="weekly">Ugentlig</option>
                    <option value="monthly">Månedlig</option>
                    <option value="quarterly">Kvartalsvis</option>
                    <option value="yearly">Årlig</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Kategori</label>
                <select
                  value={subCategoryId}
                  onChange={(e) => setSubCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Vælg kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Næste Forfaldsdato</label>
                <input
                  type="date"
                  value={subNextDate}
                  onChange={(e) => setSubNextDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annullér
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  Gem Abonnement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
