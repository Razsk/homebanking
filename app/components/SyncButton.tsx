"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, ChevronDown, Calendar, History } from "lucide-react";

export function SyncButton({ onSyncComplete }: { onSyncComplete?: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customDate, setCustomDate] = useState("");

  const maxPastDate = new Date(Date.now() - 535 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const handleSync = async (days?: number, dateFrom?: string) => {
    try {
      setSyncing(true);
      setMenuOpen(false);
      setShowCustomModal(false);

      const body: any = {};
      if (dateFrom) {
        body.dateFrom = dateFrom;
      } else if (days) {
        body.historyDays = days;
      }

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setSynced(true);
        if (onSyncComplete) onSyncComplete();
        setTimeout(() => setSynced(false), 3500);
      } else {
        alert("Synkroniseringsfejl: " + (data.error || "Ukendt fejl"));
      }
    } catch (e: any) {
      alert("Fejl ved synkronisering: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="relative inline-flex rounded-xl shadow-sm">
      {/* Primary Action Button */}
      <button
        onClick={() => handleSync()}
        disabled={syncing}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-l-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98]"
        title="Synkronisér med standard historik"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
        <span>{syncing ? "Henter data..." : synced ? "Opdateret!" : "Synkronisér Nordea"}</span>
        {synced && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
      </button>

      {/* Dropdown Toggle */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        disabled={syncing}
        className="inline-flex items-center px-2 py-2 text-xs font-semibold rounded-r-xl text-blue-100 bg-blue-700 hover:bg-blue-800 border-l border-blue-500/50 disabled:opacity-50 transition-colors"
        title="Vælg historikperiode for synkronisering"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
      </button>

      {/* History Menu */}
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-slate-800 text-xs animate-in fade-in zoom-in-95">
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Vælg Historikperiode</span>
            <History className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <button
            onClick={() => handleSync(30)}
            className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition-colors"
          >
            <div>
              <span className="font-medium text-slate-800">Seneste 30 dage</span>
              <span className="block text-[10px] text-slate-400">Hurtig opdatering</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">1 mdr</span>
          </button>

          <button
            onClick={() => handleSync(90)}
            className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition-colors"
          >
            <div>
              <span className="font-medium text-slate-800">Seneste 90 dage</span>
              <span className="block text-[10px] text-slate-400">PSD2 standardkvartal</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">3 mdr</span>
          </button>

          <button
            onClick={() => handleSync(180)}
            className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition-colors"
          >
            <div>
              <span className="font-medium text-slate-800">Seneste 180 dage</span>
              <span className="block text-[10px] text-slate-400">Halvårlig historik</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">6 mdr</span>
          </button>

          <button
            onClick={() => handleSync(365)}
            className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition-colors"
          >
            <div>
              <span className="font-medium text-slate-800">Seneste 1 år</span>
              <span className="block text-[10px] text-slate-400">365 dages transaktioner</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">12 mdr</span>
          </button>

          <button
            onClick={() => handleSync(535)}
            className="w-full text-left px-3 py-2 hover:bg-blue-50/70 border-t border-slate-100 flex items-center justify-between transition-colors"
          >
            <div>
              <span className="font-bold text-blue-700">Maksimal Historik (540 dage)</span>
              <span className="block text-[10px] text-slate-500">Maksimum tilladt af Nordea (~18 mdr)</span>
            </div>
            <span className="text-[10px] font-bold text-blue-600 font-mono">Maks</span>
          </button>

          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              onClick={() => {
                setMenuOpen(false);
                setShowCustomModal(true);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Vælg specifik startdato...</span>
            </button>
          </div>
        </div>
      )}

      {/* Custom Date Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Vælg Startdato for Historik</h3>
                <p className="text-[11px] text-slate-400">Nordea tillader op til 540 dage tilbage</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Hent transaktioner fra:</label>
              <input
                type="date"
                min={maxPastDate}
                max={new Date().toISOString().split("T")[0]}
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Tidligste mulige dato: <code className="font-mono text-slate-600">{maxPastDate}</code>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Annullér
              </button>
              <button
                type="button"
                disabled={!customDate}
                onClick={() => handleSync(undefined, customDate)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
              >
                Hent Historik
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
