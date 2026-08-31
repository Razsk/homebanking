"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  Sparkles,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { SyncButton } from "../components/SyncButton";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [yearlyTotal, setYearlyTotal] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sorting & Filter states
  const [sortBy, setSortBy] = useState<"category" | "yearlyDesc" | "yearlyAsc" | "dueDateAsc" | "dueDateDesc" | "nameAsc">("yearlyDesc");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

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
        fetch("/api/categories"),
      ]);

      const subData = subRes.ok ? await subRes.json().catch(() => ({})) : {};
      const catData = catRes.ok ? await catRes.json().catch(() => ([])) : [];

      setSubscriptions(Array.isArray(subData.subscriptions) ? subData.subscriptions : []);
      setMonthlyTotal(subData.monthlyTotal || 0);
      setYearlyTotal(subData.yearlyTotal || 0);
      setCategories(Array.isArray(catData) ? catData : []);
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
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCategoryChange = async (subId: string, newCategoryId: string) => {
    try {
      const res = await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subId, categoryId: newCategoryId }),
      });
      if (res.ok) {
        setSubscriptions((prev) =>
          prev.map((s) =>
            s.id === subId
              ? { ...s, categoryId: newCategoryId, category: categories.find((c) => c.id === newCategoryId) }
              : s
          )
        );
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

  const getAnnualAmount = (sub: any): number => {
    const amt = sub.amount || 0;
    switch (sub.interval) {
      case "weekly": return amt * 52;
      case "monthly": return amt * 12;
      case "quarterly": return amt * 4;
      case "yearly": return amt * 1;
      default: return amt * 12;
    }
  };

  const getDaysUntil = (dateStr: string) => {
    if (!dateStr) return { label: "Ukendt", isSoon: false, isOverdue: false };
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: "Forfaldet", isSoon: true, isOverdue: true };
    if (diff === 0) return { label: "I dag", isSoon: true, isOverdue: false };
    if (diff === 1) return { label: "I morgen", isSoon: true, isOverdue: false };
    if (diff <= 7) return { label: `Om ${diff} dage`, isSoon: true, isOverdue: false };
    return { label: `Om ${diff} dage`, isSoon: false, isOverdue: false };
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

  // Filter & Sort computation
  const filteredAndSorted = subscriptions
    .filter((sub) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = sub.name?.toLowerCase().includes(q);
        const matchesCat = sub.category?.name?.toLowerCase().includes(q);
        if (!matchesName && !matchesCat) return false;
      }
      if (categoryFilter && sub.categoryId !== categoryFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "category") {
        const catA = a.category?.name || "Uden Kategori";
        const catB = b.category?.name || "Uden Kategori";
        return catA.localeCompare(catB, "da-DK");
      }
      if (sortBy === "yearlyDesc") {
        return getAnnualAmount(b) - getAnnualAmount(a);
      }
      if (sortBy === "yearlyAsc") {
        return getAnnualAmount(a) - getAnnualAmount(b);
      }
      if (sortBy === "dueDateAsc") {
        const dateA = new Date(a.nextPaymentDate || "2099-01-01").getTime();
        const dateB = new Date(b.nextPaymentDate || "2099-01-01").getTime();
        return dateA - dateB;
      }
      if (sortBy === "dueDateDesc") {
        const dateA = new Date(a.nextPaymentDate || "1970-01-01").getTime();
        const dateB = new Date(b.nextPaymentDate || "1970-01-01").getTime();
        return dateB - dateA;
      }
      if (sortBy === "nameAsc") {
        return (a.name || "").localeCompare(b.name || "", "da-DK");
      }
      return 0;
    });

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

      {/* Sorting & Filter Control Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Registrerede Tjenester ({filteredAndSorted.length})
            </h3>
            <span className="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Auto-analyse
            </span>
          </div>

          {/* Sorterings-knapper / Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Sorter efter:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="yearlyDesc">💰 Udgift pr. år (Højeste først)</option>
              <option value="yearlyAsc">📉 Udgift pr. år (Laveste først)</option>
              <option value="dueDateAsc">⏰ Næste forfaldsdato (Snarest først)</option>
              <option value="dueDateDesc">📅 Næste forfaldsdato (Senest først)</option>
              <option value="category">📂 Kategori (A - Å)</option>
              <option value="nameAsc">🔤 Navn (A - Å)</option>
            </select>
          </div>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <input
            type="text"
            placeholder="Søg efter tjeneste eller kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[200px]"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
          >
            <option value="">Alle Kategorier ({subscriptions.length})</option>
            {categories.map((c) => {
              const count = subscriptions.filter((s) => s.categoryId === c.id).length;
              return (
                <option key={c.id} value={c.id}>
                  {c.name} ({count})
                </option>
              );
            })}
          </select>

          {(searchQuery || categoryFilter) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("");
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline"
            >
              Ryd filtre
            </button>
          )}
        </div>
      </div>

      {/* Subscriptions Grid */}
      <div>
        {loading ? (
          <div className="py-16 flex justify-center items-center">
            <div className="animate-spin w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-sm font-semibold text-slate-700">Ingen abonnementer matcher dit filter.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("");
                setSortBy("yearlyDesc");
              }}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Nulstil sortering og filtre
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAndSorted.map((sub) => {
              const daysUntil = getDaysUntil(sub.nextPaymentDate);
              const annualAmount = getAnnualAmount(sub);
              const nextDateFormatted = sub.nextPaymentDate
                ? new Date(sub.nextPaymentDate).toLocaleDateString("da-DK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Ikke fastsat";
              const lastDateFormatted = sub.lastPaymentDate
                ? new Date(sub.lastPaymentDate).toLocaleDateString("da-DK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Ukendt";

              return (
                <div
                  key={sub.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top card header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base truncate" title={sub.name}>
                            {sub.name}
                          </h4>
                          {sub.detectedAuto && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.5 rounded shrink-0" title="Automatisk fundet af algoritmen">
                              Auto
                            </span>
                          )}
                        </div>

                        {/* Quick Category Selector */}
                        <div className="mt-1.5 inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5 transition-colors">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub.category?.color || "#94a3b8" }}
                          />
                          <select
                            value={sub.categoryId || ""}
                            onChange={(e) => handleCategoryChange(sub.id, e.target.value)}
                            className="text-[11px] font-semibold bg-transparent border-none focus:outline-none text-slate-700 cursor-pointer pr-1"
                            title="Skift kategori for dette abonnement"
                          >
                            <option value="">Ingen Kategori</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200/60 rounded-lg">
                          {getIntervalLabel(sub.interval)}
                        </span>
                        
                        {/* Connected Transactions Badge */}
                        <Link
                          href={`/transactions?search=${encodeURIComponent(sub.searchQuery || sub.name)}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border border-slate-200 hover:border-purple-300 px-2 py-0.5 rounded-full transition-all shadow-2xs group"
                          title={`Klik for at se alle ${sub.transactionCount ?? 0} posteringer knyttet til dette abonnement`}
                        >
                          <Layers className="w-3 h-3 text-slate-400 group-hover:text-purple-600" />
                          <span>{sub.transactionCount ?? 0} {sub.transactionCount === 1 ? "post" : "poster"}</span>
                        </Link>
                      </div>
                    </div>

                    {/* Price & Annual Cost Breakdown */}
                    <div className="mt-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-xl font-extrabold text-slate-900">{formatDKK(sub.amount)}</span>
                          <span className="text-xs text-slate-500 ml-1">/ {sub.interval === "yearly" ? "år" : "md"}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Årlig Udgift
                          </span>
                          <span className="text-sm font-bold text-purple-700 font-mono">
                            {formatDKK(annualAmount)}/år
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dates & Due Countdown */}
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Sidst betalt:</span>
                        <span className="font-medium text-slate-700 font-mono text-[11px]">{lastDateFormatted}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Næste forfald:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 font-mono text-[11px]">{nextDateFormatted}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              daysUntil.isOverdue
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : daysUntil.isSoon
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {daysUntil.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer status / action */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
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
                        className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors underline"
                      >
                        {sub.status === "active" ? "Pause" : "Genaktiver"}
                      </button>
                    </div>

                    <Link
                      href={`/transactions?search=${encodeURIComponent(sub.searchQuery || sub.name)}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group transition-colors"
                      title="Se alle poster for dette abonnement i transaktionsoversigten"
                    >
                      <span>Se poster</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
