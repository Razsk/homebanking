"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2 } from "lucide-react";

export function SyncButton({ onSyncComplete }: { onSyncComplete?: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSynced(true);
        if (onSyncComplete) onSyncComplete();
        setTimeout(() => setSynced(false), 3000);
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
    <button
      onClick={handleSync}
      disabled={syncing}
      className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all active:scale-95"
    >
      <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
      <span>{syncing ? "Henter data..." : synced ? "Opdateret!" : "Synkronisér Nordea"}</span>
      {synced && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
    </button>
  );
}
