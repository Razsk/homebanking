"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Repeat, 
  ShieldCheck, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";
import Link from "next/link";
import { SyncButton } from "./components/SyncButton";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, accountsRes, txRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/accounts"),
        fetch("/api/transactions?limit=6"),
      ]);

      const analyticsData = await analyticsRes.json();
      const accountsData = await accountsRes.json();
      const txData = await txRes.json();

      setData(analyticsData);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setRecentTxs(txData.transactions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDKK = (amount: number) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finansielt Overblik</h1>
          <p className="text-sm text-slate-500">Live dataforbindelse til Nordea Danmark</p>
        </div>
        <div className="flex items-center gap-3">
          {data?.consent && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>PSD2 Samtykke gyldigt ({data.consent.daysRemaining} dage tilbage)</span>
            </div>
          )}
          <SyncButton onSyncComplete={loadData} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Balance */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Samlet Saldo</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-slate-900">{formatDKK(data?.totalBalance || 0)}</h2>
            <p className="text-xs text-slate-400 mt-1">{accounts.length} aktive Nordea konti</p>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Månedens Indtægt</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-emerald-600">+{formatDKK(data?.monthlyIncome || 0)}</h2>
            <p className="text-xs text-slate-400 mt-1">Løn & primære indbetalinger</p>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Månedens Udgifter</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-rose-600">-{formatDKK(data?.monthlyExpense || 0)}</h2>
            <p className="text-xs text-slate-400 mt-1">Netto overskud: {formatDKK(data?.netCashflow || 0)}</p>
          </div>
        </div>

        {/* Subscriptions Burn Rate */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Faste Abonnementer</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Repeat className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-purple-700">{formatDKK(data?.monthlySubTotal || 0)}<span className="text-xs font-normal text-slate-400">/md</span></h2>
            <p className="text-xs text-slate-400 mt-1">{data?.subscriptionsCount || 0} aktive abonnementer fundet</p>
          </div>
        </div>
      </div>

      {/* Account Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Dine Bankkonti hos Nordea</h3>
            <p className="text-xs text-slate-500">Klik på et kort for kun at se transaktioner for denne konto</p>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Se alle poster <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const txCount = acc._count?.transactions ?? 0;
            return (
              <Link
                key={acc.id}
                href={`/transactions?accountId=${encodeURIComponent(acc.id)}`}
                className="group p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-sm block leading-tight group-hover:text-blue-600 transition-colors">
                        {acc.customName || acc.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {acc.iban ? `${acc.iban.slice(0, 4)}••••${acc.iban.slice(-4)}` : (acc.accountNumber || "Nordea")}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors shrink-0">
                    {txCount} {txCount === 1 ? "post" : "poster"}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Bogfærdt Saldo</span>
                    <span className="text-xl font-extrabold text-slate-900">{formatDKK(acc.balance)}</span>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    Vis poster →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Cashflow Bar Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Cashflow Historik</h3>
              <p className="text-xs text-slate-400">Indtægter vs. udgifter de seneste 6 måneder</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyTimeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  formatter={(val: number) => [formatDKK(val), ""]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
                />
                <Bar dataKey="income" name="Indtægt" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Udgift" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Donut Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Udgiftsfordeling</h3>
              <p className="text-xs text-slate-400">Forbrug fordelt på kategorier denne måned</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {data?.categoryBreakdown?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {data.categoryBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [formatDKK(val), "Udgift"]} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400">Ingen udgiftsdata i denne periode.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Seneste Kontobevægelser</h3>
            <p className="text-xs text-slate-400">Automatisk kategoriseret jf. dine regler</p>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Se alle poster <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentTxs.map((tx) => {
            const isPos = tx.amount > 0;
            const dateStr = new Date(tx.date).toLocaleDateString("da-DK", { day: "numeric", month: "short" });

            return (
              <div key={tx.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isPos ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"}`}>
                    {isPos ? <ArrowDownRight className="w-5 h-5 text-emerald-600" /> : <ArrowUpRight className="w-5 h-5 text-slate-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 leading-none">{tx.text}</p>
                      {tx.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-2.5 h-2.5" /> Reserveret
                        </span>
                      )}
                      {tx.isSubscription && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          <Repeat className="w-2.5 h-2.5" /> Fast
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {dateStr} • {tx.account?.name || "Konto"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-semibold text-sm ${isPos ? "text-emerald-600" : "text-slate-900"}`}>
                    {isPos ? "+" : ""}{formatDKK(tx.amount)}
                  </span>
                  {tx.category && (
                    <div className="mt-0.5">
                      <span 
                        className="inline-block text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${tx.category.color}15`, color: tx.category.color }}
                      >
                        {tx.category.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
