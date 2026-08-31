"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Repeat, 
  PlusCircle, 
  Check, 
  SlidersHorizontal,
  CreditCard,
  Layers
} from "lucide-react";
import { SyncButton } from "../components/SyncButton";

function TransactionsContent() {
  const searchParams = useSearchParams();
  const initialAccountId = searchParams.get("accountId") || "";

  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(initialAccountId);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [onlySubscriptions, setOnlySubscriptions] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Sync if URL search param changes
  useEffect(() => {
    const accId = searchParams.get("accountId");
    if (accId !== null) {
      setSelectedAccount(accId);
    }
  }, [searchParams]);

  // Rule creation modal state
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [rulePattern, setRulePattern] = useState("");
  const [ruleCategoryId, setRuleCategoryId] = useState("");
  const [ruleIsSub, setRuleIsSub] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedAccount) params.set("accountId", selectedAccount);
      if (selectedCategory) params.set("categoryId", selectedCategory);
      if (onlySubscriptions) params.set("isSubscription", "true");

      const [txRes, accRes] = await Promise.all([
        fetch(`/api/transactions?${params.toString()}`),
        fetch("/api/accounts"),
      ]);

      const txData = await txRes.json();
      const accData = await accRes.json();

      setTransactions(txData.transactions || []);
      setCategories(txData.categories || []);
      setAccounts(Array.isArray(accData) ? accData : []);
      // Clear selections on data refresh/filter changes
      setSelectedIds(new Set());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedAccount, selectedCategory, onlySubscriptions]);

  // Multi-select handlers
  const isAllSelected = transactions.length > 0 && selectedIds.size === transactions.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCategoryChange = async (txId: string, newCategoryId: string) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: txId, categoryId: newCategoryId }),
      });
      if (res.ok) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === txId
              ? { ...t, categoryId: newCategoryId, category: categories.find((c) => c.id === newCategoryId) }
              : t
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk category assignment
  const handleBulkCategoryChange = async (newCategoryId: string) => {
    if (selectedIds.size === 0) return;
    try {
      setBulkProcessing(true);
      const res = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          categoryId: newCategoryId,
        }),
      });

      if (res.ok) {
        setTransactions((prev) =>
          prev.map((t) =>
            selectedIds.has(t.id)
              ? { ...t, categoryId: newCategoryId, category: categories.find((c) => c.id === newCategoryId) }
              : t
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBulkProcessing(false);
    }
  };

  // Bulk subscription toggle
  const handleBulkToggleSubscription = async (isSub: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      setBulkProcessing(true);
      const res = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          isSubscription: isSub,
        }),
      });

      if (res.ok) {
        setTransactions((prev) =>
          prev.map((t) => (selectedIds.has(t.id) ? { ...t, isSubscription: isSub } : t))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleToggleSubscription = async (txId: string, current: boolean) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: txId, isSubscription: !current }),
      });
      if (res.ok) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === txId ? { ...t, isSubscription: !current } : t))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openCreateRule = (tx: any) => {
    setRulePattern(tx.text.trim());
    setRuleCategoryId(tx.categoryId || (categories[0]?.id || ""));
    setRuleIsSub(tx.isSubscription || false);
    setRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pattern: rulePattern,
          categoryId: ruleCategoryId,
          isSubscription: ruleIsSub,
          matchType: "contains",
          priority: 20,
        }),
      });
      if (res.ok) {
        setRuleModalOpen(false);
        // re-run sync/classification
        await fetch("/api/sync", { method: "POST" });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kontobevægelser</h1>
          <p className="text-sm text-slate-500">Søg, filtrér og tilpas klassificering for dine posteringer</p>
        </div>
        <SyncButton onSyncComplete={loadData} />
      </div>

      {/* Interactive Account Filter Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Vælg Konto for at Filtrere ({accounts.length} Konti)
          </span>
          {selectedAccount && (
            <button
              onClick={() => setSelectedAccount("")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
            >
              Nulstil filter (Vis alle konti)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* All Accounts Card */}
          <button
            type="button"
            onClick={() => setSelectedAccount("")}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between ${
              !selectedAccount
                ? "bg-blue-50/80 border-blue-500 shadow-xs ring-2 ring-blue-500/20"
                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                !selectedAccount ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className={`text-sm font-bold block leading-tight ${
                  !selectedAccount ? "text-blue-950" : "text-slate-800"
                }`}>
                  Alle Bankkonti
                </span>
                <span className="text-[11px] text-slate-400">Samlet overblik</span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              !selectedAccount ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {accounts.reduce((sum, a) => sum + (a._count?.transactions || 0), 0)} poster
            </span>
          </button>

          {/* Individual Account Cards */}
          {accounts.map((acc) => {
            const isSelected = selectedAccount === acc.id;
            const txCount = acc._count?.transactions ?? 0;

            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => setSelectedAccount(isSelected ? "" : acc.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "bg-blue-50/80 border-blue-500 shadow-xs ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-sm font-bold block leading-tight ${
                        isSelected ? "text-blue-950" : "text-slate-800"
                      }`}>
                        {acc.customName || acc.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {acc.iban ? `${acc.iban.slice(0, 4)}••••${acc.iban.slice(-4)}` : (acc.accountNumber || "Nordea")}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                    isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}>
                    {txCount} {txCount === 1 ? "post" : "poster"}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Saldo</span>
                  <span className="text-sm font-bold text-slate-900">{formatDKK(acc.balance)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Søg i tekst, modpart..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Account filter */}
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
        >
          <option value="">Alle Konti ({accounts.reduce((sum, a) => sum + (a._count?.transactions || 0), 0)})</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.customName || acc.name} ({acc._count?.transactions || 0} poster)
            </option>
          ))}
        </select>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
        >
          <option value="">Alle Kategorier</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Subscription toggle */}
        <button
          onClick={() => setOnlySubscriptions(!onlySubscriptions)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border font-medium transition-colors ${
            onlySubscriptions
              ? "bg-purple-50 text-purple-700 border-purple-300"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>Kun Faste Abonnementer</span>
        </button>
      </div>

      {/* Transactions Table */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Posteringer ({transactions.length})
            </h3>
            <p className="text-xs text-slate-400">
              {selectedAccount 
                ? `Viser kun poster for: ${accounts.find(a => a.id === selectedAccount)?.customName || accounts.find(a => a.id === selectedAccount)?.name || "Valgt konto"}`
                : "Viser posteringer på tværs af alle dine Nordea konti"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500 font-medium">Ingen posteringer matcher dit filter.</p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedAccount("");
                setSelectedCategory("");
                setOnlySubscriptions(false);
              }}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Nulstil alle filtre
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                      title={isAllSelected ? "Fravælg alle" : "Vælg alle synlige"}
                    />
                  </th>
                  <th className="py-3 px-4">Dato</th>
                  <th className="py-3 px-4">Beskrivelse / Modpart</th>
                  <th className="py-3 px-4">Konto</th>
                  <th className="py-3 px-4">Hurtig Kategori</th>
                  <th className="py-3 px-4 text-center">Abonnement</th>
                  <th className="py-3 px-4 text-right">Beløb</th>
                  <th className="py-3 px-4 text-right">Opret Regel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isSelected = selectedIds.has(tx.id);
                  const isPos = tx.amount > 0;
                  const dateStr = new Date(tx.date).toLocaleDateString("da-DK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={tx.id}
                      className={`transition-colors ${
                        isSelected ? "bg-blue-50/80 hover:bg-blue-50" : "hover:bg-slate-50/70"
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(tx.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-mono text-slate-500">
                        {dateStr}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 truncate">{tx.text}</span>
                          {tx.status === "pending" && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-2.5 h-2.5" /> Reserveret
                            </span>
                          )}
                        </div>
                        {tx.counterparty && tx.counterparty !== tx.text && (
                          <span className="text-xs text-slate-400 block truncate">{tx.counterparty}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                          {tx.account?.customName || tx.account?.name || "Konto"}
                        </span>
                      </td>

                      {/* Fast Category Switcher */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-blue-400 rounded-lg px-2 py-1 shadow-2xs transition-colors">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: tx.category?.color || "#94a3b8" }}
                          />
                          <select
                            value={tx.categoryId || ""}
                            onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                            className="text-xs bg-transparent border-none focus:outline-none font-medium text-slate-700 cursor-pointer pr-1"
                          >
                            <option value="">Ingen Kategori</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleSubscription(tx.id, tx.isSubscription)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            tx.isSubscription
                              ? "bg-purple-50 text-purple-600 border-purple-200"
                              : "text-slate-300 hover:text-slate-500 hover:bg-slate-100 border-transparent"
                          }`}
                          title="Slå abonnementsmærke til/fra"
                        >
                          <Repeat className="w-4 h-4" />
                        </button>
                      </td>

                      <td className={`py-3.5 px-4 text-right whitespace-nowrap font-bold ${
                        isPos ? "text-emerald-600" : "text-slate-900"
                      }`}>
                        {isPos ? "+" : ""}{formatDKK(tx.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openCreateRule(tx)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Ny regel</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Multi-Select Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[92%] sm:w-auto bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700 px-5 py-3 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-xs">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {selectedIds.size === 1 ? "1 postering valgt" : `${selectedIds.size} posteringer valgt`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Bulk Category Assign */}
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Tildel Kategori:</span>
              <select
                disabled={bulkProcessing}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkCategoryChange(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="bg-transparent text-xs text-blue-400 font-bold border-none focus:outline-none cursor-pointer pr-1"
              >
                <option value="" disabled className="bg-slate-900 text-white">Vælg fælles kategori...</option>
                <option value="" className="bg-slate-900 text-slate-400">Ryd kategori (Ingen)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk Subscription Actions */}
            <button
              type="button"
              disabled={bulkProcessing}
              onClick={() => handleBulkToggleSubscription(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-600/30 text-purple-200 hover:bg-purple-600/50 border border-purple-500/40 transition-colors flex items-center gap-1"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Marker Abonnement</span>
            </button>

            <button
              type="button"
              disabled={bulkProcessing}
              onClick={() => handleBulkToggleSubscription(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Fjern Abonnement
            </button>

            {/* Clear selection */}
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors underline"
            >
              Fravælg alle
            </button>
          </div>
        </div>
      )}

      {/* Rule Creation Modal */}
      {ruleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Opret Automatisk Regel</h3>
                <p className="text-xs text-slate-400">Klassificér fremtidige ens posteringer</p>
              </div>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Mønster / Tekst i postering
                </label>
                <input
                  type="text"
                  required
                  value={rulePattern}
                  onChange={(e) => setRulePattern(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Tildel Kategori
                </label>
                <select
                  value={ruleCategoryId}
                  onChange={(e) => setRuleCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ruleSub"
                  checked={ruleIsSub}
                  onChange={(e) => setRuleIsSub(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <label htmlFor="ruleSub" className="text-sm font-medium text-slate-700">
                  Marker automatisk som fast abonnement
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annullér
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  Gem Regel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="py-12 flex justify-center items-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}
