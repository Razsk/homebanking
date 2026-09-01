"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      fetch("/api/dev/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: error.name || "RenderError",
          message: error.message || "Error during page rendering",
          stack: error.stack,
          source: "client",
          route: typeof window !== "undefined" ? window.location.pathname : "/",
          metadata: { digest: error.digest, type: "route_error_boundary" },
        }),
      }).catch(() => {});
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Noget gik galt</h2>
      <p className="text-sm text-slate-600 max-w-md mb-6">
        {error.message || "Der opstod en uventet fejl ved indlæsning af siden."}
      </p>
      {error.digest && (
        <p className="text-xs font-mono text-slate-400 mb-6">
          Fejlkode: {error.digest}
        </p>
      )}
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition"
      >
        <RefreshCw className="w-4 h-4" />
        Genindlæs sektion
      </button>
    </div>
  );
}
