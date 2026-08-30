"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Repeat, 
  PlusCircle, 
  Check, 
  SlidersHorizontal 
} from "lucide-react";
import { SyncButton } from "../components/SyncButton";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [onlySubscriptions, setOnlySubscriptions] = useState(false);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedAccount, selectedCategory, onlySubscriptions]);

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
          <option value="">Alle Konti</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
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
          <span>Kun Abonnementer</span>
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Dato</th>
                <th className="py-3 px-4">Beskrivelse / Modpart</th>
                <th className="py-3 px-4">Konto</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Abonnement</th>
                <th className="py-3 px-4 text-right">Beløb</th>
                <th className="py-3 px-4 text-center">Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Ingen kontobevægelser matcher dine filtre.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isPos = tx.amount > 0;
                  const dateStr = new Date(tx.date).toLocaleDateString("da-DK", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap text-slate-500">
                        {dateStr}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{tx.text}</span>
                          {tx.status === "pending" && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-2.5 h-2.5" /> Reserveret
                            </span>
                          )}
                        </div>
                        {tx.counterparty && tx.counterparty !== tx.text && (
                          <p className="text-xs text-slate-400 mt-0.5">{tx.counterparty}</p>
                        )}
                      </td>

                      {/* Account */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {tx.account?.name || "Nordea"}
                      </td>

                      {/* Category select */}
                      <td className="py-3.5 px-4">
                        <select
                          value={tx.categoryId || ""}
                          onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                          className="text-xs font-medium px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          style={{
                            color: tx.category?.color || "#475569",
                          }}
                        >
                          <option value="">Ukategoriseret</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Is Subscription Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleSubscription(tx.id, tx.isSubscription)}
                          title={tx.isSubscription ? "Fjern abonnementsmærkat" : "Marker som abonnement"}
                          className={`p-1 rounded transition-colors ${
                            tx.isSubscription
                              ? "bg-purple-100 text-purple-700"
                              : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          <Repeat className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Amount */}
                      <td className={`py-3.5 px-4 text-right font-semibold whitespace-nowrap ${isPos ? "text-emerald-600" : "text-slate-900"}`}>
                        {isPos ? "+" : ""}{formatDKK(tx.amount)}
                      </td>

                      {/* Action: Create Rule */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => openCreateRule(tx)}
                          title="Opret automatisk regel ud fra denne postering"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Rule Modal */}
      {ruleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Opret Klassificeringsregel</h3>
            <p className="text-xs text-slate-500 mb-4">
              Fremtidige posteringer, der indeholder dette mønster, vil automatisk blive tildelt kategorien.
            </p>

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mønster / Tekst</label>
                <input
                  type="text"
                  required
                  value={rulePattern}
                  onChange={(e) => setRulePattern(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Kategori</label>
                <select
                  value={ruleCategoryId}
                  onChange={(e) => setRuleCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
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
