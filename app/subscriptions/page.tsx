"use client";

import { useEffect, useState, useMemo } from "react";
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
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieIcon,
  LayoutGrid,
  Disc,
  Filter,
  Printer,
  Check,
  CheckSquare,
  Square,
  FileText,
  X
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart,
  Pie,
  Treemap,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  CartesianGrid,
  Legend
} from "recharts";
import { SyncButton } from "../components/SyncButton";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [yearlyTotal, setYearlyTotal] = useState(0);
  const [savedAnnualTotal, setSavedAnnualTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [priceIncreaseCount, setPriceIncreaseCount] = useState(0);
  const [priceDecreaseCount, setPriceDecreaseCount] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Chart state
  const [chartView, setChartView] = useState<"horizontalBar" | "pie" | "treemap" | "radial">("horizontalBar");
  const [chartPeriod, setChartPeriod] = useState<"monthly" | "yearly">("monthly");
  const [chartStatus, setChartStatus] = useState<"active" | "all">("active");

  // Sorting & Filter states
  const [sortBy, setSortBy] = useState<"category" | "yearlyDesc" | "yearlyAsc" | "dueDateAsc" | "dueDateDesc" | "nameAsc">("yearlyDesc");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [priceFilter, setPriceFilter] = useState<"all" | "increase" | "decrease">("all");

  // Add Subscription Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [subName, setSubName] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [subInterval, setSubInterval] = useState("monthly");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [subNextDate, setSubNextDate] = useState("");

  // Marking / Selection & Print state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [printModalOpen, setPrintModalOpen] = useState(false);

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
      setSavedAnnualTotal(subData.savedAnnualTotal || 0);
      setActiveCount(subData.activeCount || 0);
      setInactiveCount(subData.inactiveCount || 0);
      setPriceIncreaseCount(subData.priceIncreaseCount || 0);
      setPriceDecreaseCount(subData.priceDecreaseCount || 0);
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

  const getMonthlyAmount = (sub: any): number => {
    const amt = sub.amount || 0;
    switch (sub.interval) {
      case "weekly": return amt * (52 / 12);
      case "monthly": return amt * 1;
      case "quarterly": return amt / 3;
      case "yearly": return amt / 12;
      default: return amt * 1;
    }
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

  // Category Bar Chart data aggregation
  const categoryChartData = useMemo(() => {
    const subsToInclude = subscriptions.filter((s) => {
      if (chartStatus === "active") return s.status === "active";
      return true;
    });

    const groupMap: { [catId: string]: {
      categoryId: string;
      categoryName: string;
      color: string;
      monthlyTotal: number;
      yearlyTotal: number;
      count: number;
      services: { name: string; amount: number; interval: string; monthlyAmount: number; yearlyAmount: number; status: string }[];
    } } = {};

    let totalMonthly = 0;
    let totalYearly = 0;

    for (const sub of subsToInclude) {
      const catId = sub.categoryId || "uncategorized";
      const catObj = sub.category || categories.find((c) => c.id === catId);
      const catName = catObj?.name || "Uden Kategori";
      const catColor = catObj?.color || "#94a3b8";

      const mAmount = getMonthlyAmount(sub);
      const yAmount = getAnnualAmount(sub);

      totalMonthly += mAmount;
      totalYearly += yAmount;

      if (!groupMap[catId]) {
        groupMap[catId] = {
          categoryId: catId,
          categoryName: catName,
          color: catColor,
          monthlyTotal: 0,
          yearlyTotal: 0,
          count: 0,
          services: [],
        };
      }

      groupMap[catId].monthlyTotal += mAmount;
      groupMap[catId].yearlyTotal += yAmount;
      groupMap[catId].count += 1;
      groupMap[catId].services.push({
        name: sub.name,
        amount: sub.amount,
        interval: sub.interval,
        monthlyAmount: mAmount,
        yearlyAmount: yAmount,
        status: sub.status,
      });
    }

    const items = Object.values(groupMap).map((item) => {
      item.services.sort((a, b) => b.monthlyAmount - a.monthlyAmount);

      const totalVal = chartPeriod === "monthly" ? item.monthlyTotal : item.yearlyTotal;
      const grandTotal = chartPeriod === "monthly" ? totalMonthly : totalYearly;
      const share = grandTotal > 0 ? (totalVal / grandTotal) * 100 : 0;

      return {
        ...item,
        value: Math.round(totalVal * 100) / 100,
        share: Math.round(share * 10) / 10,
        displayTotal: formatDKK(totalVal),
        monthlyDisplay: formatDKK(item.monthlyTotal),
        yearlyDisplay: formatDKK(item.yearlyTotal),
      };
    });

    return items.sort((a, b) => b.value - a.value);
  }, [subscriptions, categories, chartPeriod, chartStatus]);

  // Rich Custom Tooltip Component for Category Bar Chart
  const CustomCategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md max-w-xs sm:max-w-sm text-xs z-50 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-700/80">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/20"
                style={{ backgroundColor: data.color }}
              />
              <span className="font-bold text-sm text-white truncate">{data.categoryName}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0">
              {data.share}% af samlet
            </span>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-2 my-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Månedlig udgift</span>
              <span className="text-xs font-bold text-slate-100">{data.monthlyDisplay}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Forventet årlig</span>
              <span className="text-xs font-bold text-indigo-300">{data.yearlyDisplay}</span>
            </div>
          </div>

          {/* Services Breakdown List */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
              <span>Tjenester ({data.count} {data.count === 1 ? 'abonnement' : 'abonnementer'})</span>
              <span>Pris / interval</span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {data.services.map((srv: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-800/50 hover:bg-slate-800/80 px-2 py-1 rounded-lg transition-colors">
                  <div className="flex items-center gap-1.5 truncate mr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span className="text-slate-200 truncate font-medium">{srv.name}</span>
                    {srv.status === "inactive" && (
                      <span className="text-[9px] text-rose-300 bg-rose-950/70 px-1 py-0.2 rounded border border-rose-800/40 shrink-0">Opsagt</span>
                    )}
                  </div>
                  <span className="text-slate-300 font-mono font-semibold whitespace-nowrap">
                    {formatDKK(srv.amount)} <span className="text-[10px] text-slate-400 font-normal">/{srv.interval === "monthly" ? "md" : srv.interval === "yearly" ? "år" : srv.interval === "weekly" ? "uge" : "kvartal"}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Click hint */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
            <span>💡 Klik for at filtrere listen nedenfor</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Radial bar chart data (outer to inner ring)
  const radialChartData = useMemo(() => {
    return [...categoryChartData]
      .sort((a, b) => a.value - b.value)
      .map((item) => ({
        ...item,
        name: item.categoryName,
        fill: item.color,
      }));
  }, [categoryChartData]);

  // Radial bar domain max
  const radialDomainMax = useMemo(() => {
    const total = chartPeriod === "monthly" ? monthlyTotal : yearlyTotal;
    return total > 0 ? total : 100;
  }, [monthlyTotal, yearlyTotal, chartPeriod]);

  // Treemap custom content renderer with crisp, clear text
  const CustomizedTreemapContent = (props: any) => {
    const { x, y, width, height, color, categoryName, displayTotal, share, categoryId } = props;
    const isSelected = categoryFilter === categoryId;

    if (!width || !height || width < 15 || height < 15) return null;

    const canShowBoth = width > 70 && height > 38;
    const canShowName = width > 40 && height > 20;
    const maxChars = Math.max(4, Math.floor(width / 7.5));

    return (
      <g
        onClick={() => {
          if (categoryId) {
            const targetId = categoryId === "uncategorized" ? "" : categoryId;
            setCategoryFilter(categoryFilter === targetId ? "" : targetId);
          }
        }}
        className="cursor-pointer"
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={6}
          ry={6}
          style={{
            fill: color || "#6366f1",
            stroke: isSelected ? "#0f172a" : "#ffffff",
            strokeWidth: isSelected ? 3 : 1.5,
            opacity: categoryFilter && !isSelected ? 0.35 : 0.95,
          }}
          className="transition-all hover:opacity-100"
        />
        {canShowName && (
          <text
            x={x + 8}
            y={canShowBoth ? y + 17 : y + Math.floor(height / 2) + 4}
            fill="#ffffff"
            fontSize={width > 120 ? 12 : 11}
            fontWeight="600"
            stroke="none"
            style={{ stroke: "none", fill: "#ffffff", userSelect: "none", pointerEvents: "none" }}
            className="select-none pointer-events-none"
          >
            {categoryName && categoryName.length > maxChars
              ? `${categoryName.slice(0, maxChars - 1)}…`
              : categoryName}
          </text>
        )}
        {canShowBoth && (
          <text
            x={x + 8}
            y={y + 32}
            fill="#ffffff"
            fontSize={10}
            fontWeight="500"
            stroke="none"
            style={{ stroke: "none", fill: "rgba(255,255,255,0.92)", userSelect: "none", pointerEvents: "none" }}
            className="select-none pointer-events-none font-mono"
          >
            {displayTotal} ({share}%)
          </text>
        )}
      </g>
    );
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
      if (statusFilter === "active" && sub.status !== "active") {
        return false;
      }
      if (statusFilter === "inactive" && sub.status === "active") {
        return false;
      }
      if (priceFilter === "increase" && !sub.priceChange?.isIncrease) {
        return false;
      }
      if (priceFilter === "decrease" && (!sub.priceChange?.hasChanged || sub.priceChange?.isIncrease)) {
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

  // Selection helpers & logic
  const toggleSelectSub = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    filteredAndSorted.length > 0 &&
    filteredAndSorted.every((s) => selectedIds.includes(s.id));

  const isSomeSelected =
    filteredAndSorted.some((s) => selectedIds.includes(s.id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const visibleIds = new Set(filteredAndSorted.map((s) => s.id));
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      const combined = new Set([...selectedIds, ...filteredAndSorted.map((s) => s.id)]);
      setSelectedIds(Array.from(combined));
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const selectedSubscriptions = useMemo(() => {
    if (selectedIds.length === 0) return [];
    return subscriptions.filter((s) => selectedIds.includes(s.id));
  }, [subscriptions, selectedIds]);

  const selectedMonthlyTotal = useMemo(() => {
    return selectedSubscriptions.reduce((acc, sub) => acc + getMonthlyAmount(sub), 0);
  }, [selectedSubscriptions]);

  const selectedYearlyTotal = useMemo(() => {
    return selectedSubscriptions.reduce((acc, sub) => acc + getAnnualAmount(sub), 0);
  }, [selectedSubscriptions]);

  // Subscriptions to display in printable report (selected if any, otherwise all filtered)
  const subscriptionsToPrint = useMemo(() => {
    if (selectedSubscriptions.length > 0) return selectedSubscriptions;
    return filteredAndSorted;
  }, [selectedSubscriptions, filteredAndSorted]);

  const printMonthlyTotal = useMemo(() => {
    return subscriptionsToPrint.reduce((acc, sub) => acc + getMonthlyAmount(sub), 0);
  }, [subscriptionsToPrint]);

  const printYearlyTotal = useMemo(() => {
    return subscriptionsToPrint.reduce((acc, sub) => acc + getAnnualAmount(sub), 0);
  }, [subscriptionsToPrint]);

  const printActiveCount = useMemo(() => {
    return subscriptionsToPrint.filter((s) => s.status === "active").length;
  }, [subscriptionsToPrint]);

  const printInactiveCount = useMemo(() => {
    return subscriptionsToPrint.filter((s) => s.status !== "active").length;
  }, [subscriptionsToPrint]);

  const printCategoryBreakdown = useMemo(() => {
    const map: { [name: string]: { name: string; color: string; count: number; monthly: number; yearly: number } } = {};
    for (const sub of subscriptionsToPrint) {
      const catName = sub.category?.name || "Uden Kategori";
      const catColor = sub.category?.color || "#64748b";
      if (!map[catName]) {
        map[catName] = { name: catName, color: catColor, count: 0, monthly: 0, yearly: 0 };
      }
      map[catName].count += 1;
      map[catName].monthly += getMonthlyAmount(sub);
      map[catName].yearly += getAnnualAmount(sub);
    }
    return Object.values(map).sort((a, b) => b.yearly - a.yearly);
  }, [subscriptionsToPrint]);

  return (
    <div className={`space-y-8 ${printModalOpen ? "print:hidden" : ""}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Abonnementer & Faste Udgifter</h1>
          <p className="text-sm text-slate-500">Automatisk detekteret ud fra mønstre og faste intervaller i dine kontobevægelser</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPrintModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
            title="Åbn printervenlig rapport over markerede abonnementer"
          >
            <Printer className="w-4 h-4 text-purple-600" />
            <span>
              {selectedIds.length > 0
                ? `Print markerede (${selectedIds.length})`
                : "Printervenlig visning"}
            </span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Tilføj Manuelt</span>
          </button>
          <SyncButton onSyncComplete={loadData} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div 
          onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
          className={`p-5 bg-white rounded-2xl border shadow-sm cursor-pointer transition-all ${
            statusFilter === "active" ? "border-emerald-400 ring-2 ring-emerald-200 bg-emerald-50/20" : "border-slate-200/80 hover:border-emerald-300"
          }`}
          title="Klik for kun at se aktive abonnementer"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Aktive Abonnementer</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{activeCount} stk</h2>
              {inactiveCount > 0 && (
                <span className="text-xs font-semibold text-slate-500">({inactiveCount} opsagte)</span>
              )}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              {inactiveCount > 0 ? `Du sparer ${formatDKK(savedAnnualTotal)}/år på opsagte` : `${subscriptions.filter((s) => s.detectedAuto).length} fundet automatisk`}
            </p>
          </div>
        </div>

        <div 
          onClick={() => setPriceFilter(priceFilter === "increase" ? "all" : "increase")}
          className={`p-5 bg-white rounded-2xl border shadow-sm cursor-pointer transition-all ${
            priceFilter === "increase" ? "border-rose-400 ring-2 ring-rose-200 bg-rose-50/20" : "border-slate-200/80 hover:border-rose-300"
          }`}
          title="Klik for at filtrere efter abonnementer med prisstigninger"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Prisændringer</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold text-rose-600">+{priceIncreaseCount}</h2>
              <span className="text-xs font-semibold text-slate-400">stigninger / {priceDecreaseCount} fald</span>
            </div>
            <p className="text-xs text-rose-500 font-medium mt-1">
              {priceFilter === "increase" ? "Viser kun stigninger (aktiv)" : "Klik for at se stigninger"}
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown Charts */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                {chartView === "horizontalBar" && <BarChart3 className="w-4 h-4" />}
                {chartView === "pie" && <PieIcon className="w-4 h-4" />}
                {chartView === "treemap" && <LayoutGrid className="w-4 h-4" />}
                {chartView === "radial" && <Disc className="w-4 h-4" />}
              </div>
              <h3 className="font-bold text-slate-900 text-base">Abonnementsudgifter fordelt på Kategorier</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Få overblik over hvilke kategorier der fylder mest i dine faste månedlige og årlige træk
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Chart Type Toggles */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/90 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartView("horizontalBar")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  chartView === "horizontalBar"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Vandret søjlediagram"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Vandret Bar</span>
              </button>
              <button
                type="button"
                onClick={() => setChartView("pie")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  chartView === "pie"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Cirkeldiagram (Pie chart)"
              >
                <PieIcon className="w-3.5 h-3.5" />
                <span>Pie Chart</span>
              </button>
              <button
                type="button"
                onClick={() => setChartView("treemap")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  chartView === "treemap"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Treemap (Områdekort)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tree Map</span>
              </button>
              <button
                type="button"
                onClick={() => setChartView("radial")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  chartView === "radial"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Radial Bar Chart"
              >
                <Disc className="w-3.5 h-3.5" />
                <span>Radial Bar</span>
              </button>
            </div>

            {/* Active vs All Toggle */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartStatus("active")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  chartStatus === "active" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Kun Aktive
              </button>
              <button
                type="button"
                onClick={() => setChartStatus("all")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  chartStatus === "all" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Alle (inkl. Opsagte)
              </button>
            </div>

            {/* Monthly vs Yearly Toggle */}
            <div className="inline-flex items-center rounded-lg border border-purple-200 bg-purple-50/60 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartPeriod("monthly")}
                className={`px-3 py-1 rounded-md transition-all ${
                  chartPeriod === "monthly" ? "bg-purple-600 text-white shadow-2xs font-bold" : "text-purple-700 hover:bg-purple-100"
                }`}
              >
                Månedlig
              </button>
              <button
                type="button"
                onClick={() => setChartPeriod("yearly")}
                className={`px-3 py-1 rounded-md transition-all ${
                  chartPeriod === "yearly" ? "bg-purple-600 text-white shadow-2xs font-bold" : "text-purple-700 hover:bg-purple-100"
                }`}
              >
                Årlig
              </button>
            </div>
          </div>
        </div>

        {categoryChartData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Ingen abonnementer fundet til at vise diagram.
          </div>
        ) : (
          <div>
            {/* View 1: Horizontal Bar Chart */}
            {chartView === "horizontalBar" && (
              <div style={{ height: Math.max(300, categoryChartData.length * 38) }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={categoryChartData}
                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      fontSize={11}
                      stroke="#94a3b8"
                      tickFormatter={(val) => `${Math.round(val).toLocaleString("da-DK")} kr`}
                    />
                    <YAxis
                      type="category"
                      dataKey="categoryName"
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      fontSize={12}
                      stroke="#475569"
                      width={140}
                      tick={(props: any) => {
                        const { x, y, payload } = props;
                        const name = payload.value || "";
                        const isSelected = categoryFilter && categoryChartData.find((c) => c.categoryName === name)?.categoryId === categoryFilter;
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text
                              x={-6}
                              y={4}
                              textAnchor="end"
                              fill={isSelected ? "#2563eb" : "#475569"}
                              fontWeight={isSelected ? "bold" : "500"}
                              fontSize={11}
                              className="cursor-pointer"
                            >
                              {name.length > 18 ? `${name.slice(0, 16)}...` : name}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <Tooltip
                      content={<CustomCategoryTooltip />}
                      cursor={{ fill: "rgba(241, 245, 249, 0.6)", radius: 6 }}
                    />
                    <Bar
                      dataKey="value"
                      name={chartPeriod === "monthly" ? "Månedlig udgift" : "Årlig udgift"}
                      radius={[0, 6, 6, 0]}
                      maxBarSize={26}
                      onClick={(entry: any) => {
                        if (entry && entry.categoryId) {
                          const targetId = entry.categoryId === "uncategorized" ? "" : entry.categoryId;
                          setCategoryFilter(categoryFilter === targetId ? "" : targetId);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {categoryChartData.map((entry, index) => {
                        const isSelected = categoryFilter === entry.categoryId;
                        return (
                          <Cell
                            key={`cell-hbar-${index}`}
                            fill={entry.color}
                            opacity={categoryFilter && !isSelected ? 0.35 : 1}
                            stroke={isSelected ? "#1e293b" : "transparent"}
                            strokeWidth={isSelected ? 2 : 0}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* View 2: Pie / Donut Chart */}
            {chartView === "pie" && (
              <div className="h-80 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomCategoryTooltip />} />
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={3}
                      onClick={(entry: any) => {
                        if (entry && entry.categoryId) {
                          const targetId = entry.categoryId === "uncategorized" ? "" : entry.categoryId;
                          setCategoryFilter(categoryFilter === targetId ? "" : targetId);
                        }
                      }}
                      className="cursor-pointer"
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, categoryName }) => {
                        if (percent < 0.05) return null;
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 1.38;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#475569"
                            textAnchor={x > cx ? "start" : "end"}
                            dominantBaseline="central"
                            fontSize={11}
                            fontWeight="600"
                          >
                            {categoryName} ({(percent * 100).toFixed(0)}%)
                          </text>
                        );
                      }}
                      labelLine={false}
                    >
                      {categoryChartData.map((entry, index) => {
                        const isSelected = categoryFilter === entry.categoryId;
                        return (
                          <Cell
                            key={`cell-pie-${index}`}
                            fill={entry.color}
                            opacity={categoryFilter && !isSelected ? 0.35 : 1}
                            stroke={isSelected ? "#0f172a" : "#ffffff"}
                            strokeWidth={isSelected ? 3 : 2}
                          />
                        );
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Donut center summary */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] text-slate-400 font-medium">Samlet {chartPeriod === "monthly" ? "md." : "år"}</span>
                  <span className="text-base font-bold text-slate-900">
                    {formatDKK(chartPeriod === "monthly" ? monthlyTotal : yearlyTotal)}
                  </span>
                </div>
              </div>
            )}

            {/* View 3: Treemap */}
            {chartView === "treemap" && (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="categoryName"
                    content={<CustomizedTreemapContent />}
                  >
                    <Tooltip content={<CustomCategoryTooltip />} />
                  </Treemap>
                </ResponsiveContainer>
              </div>
            )}

            {/* View 4: Radial Bar Chart */}
            {chartView === "radial" && (
              <div style={{ height: 360 }} className="w-full relative min-h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="20%"
                    outerRadius="95%"
                    barSize={14}
                    data={radialChartData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, radialDomainMax]}
                      angleAxisId={0}
                      tick={false}
                    />
                    <Tooltip content={<CustomCategoryTooltip />} />
                    <RadialBar
                      background={{ fill: "#f1f5f9" }}
                      dataKey="value"
                      cornerRadius={6}
                      onClick={(entry: any) => {
                        if (entry && entry.categoryId) {
                          const targetId = entry.categoryId === "uncategorized" ? "" : entry.categoryId;
                          setCategoryFilter(categoryFilter === targetId ? "" : targetId);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {radialChartData.map((entry, index) => {
                        const isSelected = categoryFilter === entry.categoryId;
                        return (
                          <Cell
                            key={`cell-radial-${index}`}
                            fill={entry.color}
                            opacity={categoryFilter && !isSelected ? 0.35 : 1}
                            stroke={isSelected ? "#0f172a" : "transparent"}
                            strokeWidth={isSelected ? 2 : 0}
                          />
                        );
                      })}
                    </RadialBar>
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-medium">Samlet {chartPeriod === "monthly" ? "md." : "år"}</span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatDKK(chartPeriod === "monthly" ? monthlyTotal : yearlyTotal)}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">{categoryChartData.length} kategorier</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend / Category Pills summary under chart */}
        {categoryChartData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kategorier:</span>
              {categoryChartData.map((cat) => {
                const isSelected = categoryFilter === cat.categoryId;
                return (
                  <button
                    key={cat.categoryId}
                    type="button"
                    onClick={() => {
                      const targetId = cat.categoryId === "uncategorized" ? "" : cat.categoryId;
                      setCategoryFilter(categoryFilter === targetId ? "" : targetId);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs font-bold"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.categoryName}</span>
                    <span className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-400"} font-mono`}>
                      ({cat.displayTotal})
                    </span>
                  </button>
                );
              })}
            </div>

            {categoryFilter && (
              <button
                type="button"
                onClick={() => setCategoryFilter("")}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline cursor-pointer"
              >
                Nulstil kategorifilter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sorting & Filter Control Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={toggleSelectAll}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                isAllSelected
                  ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                  : isSomeSelected
                  ? "bg-purple-50 text-purple-700 border-purple-300"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
              title={isAllSelected ? "Fravælg alle i listen" : "Vælg alle synlige abonnementer"}
            >
              {isAllSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-white" />
              ) : isSomeSelected ? (
                <Check className="w-3.5 h-3.5 text-purple-600" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{isAllSelected ? "Fravælg alle" : isSomeSelected ? `Vælg alle (${filteredAndSorted.length})` : "Vælg alle"}</span>
            </button>

            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Registrerede Tjenester ({filteredAndSorted.length})
            </h3>

            {selectedIds.length > 0 && (
              <span className="text-xs bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 text-purple-700" />
                <span>{selectedIds.length} valgt</span>
              </span>
            )}

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

        {/* Search, Category, Status & Price Change Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
          <input
            type="text"
            placeholder="Søg efter tjeneste eller kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[180px]"
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

          {/* Status Filter Toggles (Active / Inactive) */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === "all" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Alle ({subscriptions.length})
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                statusFilter === "active" ? "bg-emerald-600 text-white shadow-2xs font-bold" : "text-emerald-700 hover:bg-emerald-50"
              }`}
              title="Vis kun aktive abonnementer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aktive ({activeCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === "inactive" ? "all" : "inactive")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                statusFilter === "inactive" ? "bg-rose-700 text-white shadow-2xs font-bold" : "text-rose-700 hover:bg-rose-50"
              }`}
              title="Vis opsagte/inaktive abonnementer hvor betalinger er stoppet"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Opsagte ({inactiveCount})</span>
            </button>
          </div>

          {/* Quick Price Change Toggles */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setPriceFilter(priceFilter === "increase" ? "all" : "increase")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                priceFilter === "increase" ? "bg-rose-600 text-white shadow-2xs font-bold" : "text-rose-600 hover:bg-rose-50"
              }`}
              title="Vis kun abonnementer med identificerede prisstigninger"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Prisstigninger ({priceIncreaseCount})</span>
            </button>
            <button
              onClick={() => setPriceFilter(priceFilter === "decrease" ? "all" : "decrease")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                priceFilter === "decrease" ? "bg-emerald-600 text-white shadow-2xs font-bold" : "text-emerald-600 hover:bg-emerald-50"
              }`}
              title="Vis kun abonnementer med prisfald"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Prisfald ({priceDecreaseCount})</span>
            </button>
          </div>

          {(searchQuery || categoryFilter || statusFilter !== "all" || priceFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("");
                setStatusFilter("all");
                setPriceFilter("all");
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline ml-1"
            >
              Nulstil filtre
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

              const isSelected = selectedIds.includes(sub.id);

              return (
                <div
                  key={sub.id}
                  className={`p-5 bg-white rounded-2xl border shadow-sm transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-purple-500 ring-2 ring-purple-200 bg-purple-50/15 shadow-md"
                      : "border-slate-200 hover:border-purple-300 hover:shadow-md"
                  }`}
                >
                  <div>
                    {/* Top card header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectSub(sub.id);
                            }}
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                              isSelected
                                ? "bg-purple-600 border-purple-600 text-white shadow-2xs"
                                : "border-slate-300 bg-white hover:border-purple-400 text-transparent"
                            }`}
                            title={isSelected ? "Fravælg abonnement" : "Markér abonnement"}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
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

                      {/* Price Change Detection Indicator with Start Date */}
                      {sub.priceChange?.hasChanged && (
                        <div
                          className={`mt-2.5 rounded-lg text-xs font-semibold p-2 space-y-1.5 ${
                            sub.priceChange.isIncrease
                              ? "bg-rose-100/70 text-rose-900 border border-rose-200"
                              : "bg-emerald-100/70 text-emerald-900 border border-emerald-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold">
                              {sub.priceChange.isIncrease ? (
                                <TrendingUp className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              ) : (
                                <TrendingDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              )}
                              <span>
                                {sub.priceChange.isIncrease ? "Prisstigning:" : "Prisfald:"}{" "}
                                {sub.priceChange.isIncrease ? "+" : ""}
                                {formatDKK(sub.priceChange.diff)} ({sub.priceChange.isIncrease ? "+" : ""}
                                {sub.priceChange.percentage}%)
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-600 font-mono">
                              {formatDKK(sub.priceChange.previousAmount)} ➔ {formatDKK(sub.priceChange.currentAmount)}
                            </span>
                          </div>

                          {sub.priceChange.effectiveDate && (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-600 font-normal">
                              <span>Gældende fra:</span>
                              <span className="font-semibold text-slate-800 font-mono text-[10px]">
                                {new Intl.DateTimeFormat("da-DK", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }).format(new Date(sub.priceChange.effectiveDate))}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Dates & Due Countdown or Inactive Savings */}
                    {sub.status !== "active" ? (
                      <div className="mt-4 pt-3 border-t border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Sidst betalt:</span>
                          <span className="font-medium text-slate-700 font-mono text-[11px]">{lastDateFormatted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Abonnementsstatus:</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            Opsagt / Stoppet
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-emerald-700 font-medium">
                          <span>Årlig besparelse:</span>
                          <span className="font-bold font-mono text-[11px]">+{formatDKK(annualAmount)}/år</span>
                        </div>
                      </div>
                    ) : (
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
                    )}
                  </div>

                  {/* Footer status / action */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
                          sub.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700 border border-rose-200/60 font-semibold"
                        }`}
                      >
                        {sub.status === "active" ? "Aktivt" : "Opsagt / Inaktiv"}
                      </span>

                      <button
                        onClick={() => handleStatusChange(sub.id, sub.status === "active" ? "inactive" : "active")}
                        className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors underline"
                      >
                        {sub.status === "active" ? "Markér som opsagt" : "Genaktiver"}
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

      {/* Floating Selection Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-md flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {selectedIds.length === 1 ? "1 abonnement valgt" : `${selectedIds.length} abonnementer valgt`}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 px-3 py-1 bg-slate-800 rounded-lg text-xs font-mono border border-slate-700">
            <span className="text-slate-400">Månedlig:</span>
            <span className="text-white font-bold">{formatDKK(selectedMonthlyTotal)}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Årlig:</span>
            <span className="text-purple-300 font-bold">{formatDKK(selectedYearlyTotal)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Printervenlig visning</span>
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Fravælg alle
            </button>
          </div>
        </div>
      )}

      {/* Printer-Friendly Report Preview Modal */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-3 sm:p-6 print:p-0 print:static print:bg-white print:overflow-visible">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col my-auto print:shadow-none print:border-none print:max-w-none print:w-full print:m-0 print:rounded-none">
            {/* Modal Screen Header (Hidden when printing) */}
            <div className="p-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Printervenlig Abonnementsrapport</h3>
                  <p className="text-xs text-slate-500">
                    {selectedIds.length > 0
                      ? `${subscriptionsToPrint.length} markerede abonnementer`
                      : `Alle ${subscriptionsToPrint.length} synlige abonnementer`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Udskriv / Gem som PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                  title="Luk visning"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* If 0 items were marked, show informational banner in screen preview */}
            {selectedIds.length === 0 && (
              <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between print:hidden">
                <span>
                  💡 <strong>Tip:</strong> Du har ikke markeret specifikke abonnementer endnu, så rapporten viser alle {filteredAndSorted.length} abonnementer fra det aktuelle filter. Du kan lukke vinduet og sætte flueben ved de ønskede abonnementer.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    toggleSelectAll();
                  }}
                  className="text-amber-900 font-bold underline ml-2 shrink-0 cursor-pointer"
                >
                  Markér alle
                </button>
              </div>
            )}

            {/* The Actual Printable Report Sheet */}
            <div id="printable-subscription-report" className="p-6 sm:p-10 print:p-0 text-slate-900 bg-white">
              {/* Report Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg tracking-tight uppercase text-slate-900">Nordea Homebanking</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                      Open Banking AISP
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mt-1">Abonnementsoversigt</h1>
                  <p className="text-xs text-slate-600">
                    Oversigt over faste tilbagevendende udgifter og abonnementsaftaler
                  </p>
                </div>
                <div className="text-right text-xs text-slate-600 space-y-0.5">
                  <p><span className="font-semibold text-slate-800">Dato:</span> {new Intl.DateTimeFormat("da-DK", { dateStyle: "long", timeStyle: "short" }).format(new Date())}</p>
                  <p><span className="font-semibold text-slate-800">Abonnementer:</span> {subscriptionsToPrint.length} stk.</p>
                  <p><span className="font-semibold text-slate-800">Udvælgelse:</span> {selectedIds.length > 0 ? "Markerede abonnementer" : "Fuldt overblik"}</p>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-4 gap-3 my-6">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 print:bg-white print:border-slate-300">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Månedlig Udgift</span>
                  <span className="text-lg font-bold text-slate-900 font-mono block mt-0.5">{formatDKK(printMonthlyTotal)}</span>
                  <span className="text-[10px] text-slate-500">Gns. {subscriptionsToPrint.length > 0 ? formatDKK(printMonthlyTotal / subscriptionsToPrint.length) : "0 kr."}/stk</span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 print:bg-white print:border-slate-300">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Forventet Årlig Udgift</span>
                  <span className="text-lg font-bold text-purple-700 font-mono block mt-0.5">{formatDKK(printYearlyTotal)}</span>
                  <span className="text-[10px] text-slate-500">{printActiveCount} aktive aftaler</span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 print:bg-white print:border-slate-300">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Aktive Tjenester</span>
                  <span className="text-lg font-bold text-emerald-700 block mt-0.5">{printActiveCount}</span>
                  <span className="text-[10px] text-slate-500">Løbende træk</span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 print:bg-white print:border-slate-300">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Opsagte / Inaktive</span>
                  <span className="text-lg font-bold text-rose-700 block mt-0.5">{printInactiveCount}</span>
                  <span className="text-[10px] text-slate-500">Historiske / stoppede</span>
                </div>
              </div>

              {/* Category Breakdown Table */}
              {printCategoryBreakdown.length > 0 && (
                <div className="mb-6 print-break-inside-avoid">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Kategorifordeling ({printCategoryBreakdown.length} kategorier)
                  </h3>
                  <table className="w-full text-xs text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="py-2 px-3 font-bold">Kategori</th>
                        <th className="py-2 px-3 font-bold text-center">Antal</th>
                        <th className="py-2 px-3 font-bold text-right">Månedlig omk.</th>
                        <th className="py-2 px-3 font-bold text-right">Årlig omk.</th>
                        <th className="py-2 px-3 font-bold text-right">Andel %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {printCategoryBreakdown.map((cat) => {
                        const pct = printYearlyTotal > 0 ? ((cat.yearly / printYearlyTotal) * 100).toFixed(1) : "0";
                        return (
                          <tr key={cat.name} className="hover:bg-slate-50/50">
                            <td className="py-1.5 px-3 font-medium flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                              <span>{cat.name}</span>
                            </td>
                            <td className="py-1.5 px-3 text-center text-slate-600">{cat.count}</td>
                            <td className="py-1.5 px-3 text-right font-mono">{formatDKK(cat.monthly)}</td>
                            <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-900">{formatDKK(cat.yearly)}</td>
                            <td className="py-1.5 px-3 text-right font-mono text-slate-600">{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Detailed Subscriptions Table */}
              <div className="mb-6 print-break-inside-avoid">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Detaljeret Abonnementsfortegnelse ({subscriptionsToPrint.length})
                </h3>
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-300">
                      <th className="py-2 px-2.5 font-bold w-8 text-center">#</th>
                      <th className="py-2 px-3 font-bold">Tjeneste / Udbyder</th>
                      <th className="py-2 px-3 font-bold">Kategori</th>
                      <th className="py-2 px-2.5 font-bold">Interval</th>
                      <th className="py-2 px-3 font-bold text-right">Trækbeløb</th>
                      <th className="py-2 px-3 font-bold text-right">Månedligt</th>
                      <th className="py-2 px-3 font-bold text-right">Årligt</th>
                      <th className="py-2 px-3 font-bold">Næste forfald</th>
                      <th className="py-2 px-2.5 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {subscriptionsToPrint.map((sub, idx) => {
                      const mAmount = getMonthlyAmount(sub);
                      const yAmount = getAnnualAmount(sub);
                      const nextDate = sub.nextPaymentDate
                        ? new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", year: "numeric" }).format(new Date(sub.nextPaymentDate))
                        : "Ikke fastsat";
                      return (
                        <tr key={sub.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                          <td className="py-2 px-2.5 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            <div>{sub.name}</div>
                            {sub.priceChange?.hasChanged && (
                              <div className="text-[10px] text-rose-600 font-normal">
                                Prisstigning: +{formatDKK(sub.priceChange.diff)} (+{sub.priceChange.percentage}%)
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-700">{sub.category?.name || "Uden Kategori"}</td>
                          <td className="py-2 px-2.5 text-slate-600 capitalize">{getIntervalLabel(sub.interval)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatDKK(sub.amount)}</td>
                          <td className="py-2 px-3 text-right font-mono font-medium">{formatDKK(mAmount)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-purple-900">{formatDKK(yAmount)}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{nextDate}</td>
                          <td className="py-2 px-2.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                                sub.status === "active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {sub.status === "active" ? "Aktiv" : "Opsagt"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                      <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
                        Samlet Total:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatDKK(printMonthlyTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-900">
                        {formatDKK(printYearlyTotal)}
                      </td>
                      <td colSpan={2} className="py-2.5 px-3 text-slate-500 font-normal text-[10px]">
                        {subscriptionsToPrint.length} poster
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Report Footer */}
              <div className="mt-8 pt-4 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
                <span>Homebanking Open Banking AISP • Personlig Finansoversigt</span>
                <span>Fortroligt personligt dokument</span>
                <span>Genereret {new Date().toLocaleDateString("da-DK")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
