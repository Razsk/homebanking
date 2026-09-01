"use client";

import { useEffect } from "react";

export default function GlobalError({
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
          name: error.name || "GlobalError",
          message: error.message || "Global rendering error occurred in Root Layout",
          stack: error.stack,
          source: "client",
          route: window.location.pathname,
          metadata: { digest: error.digest, type: "global_error_boundary" },
        }),
      }).catch(() => {});
    }
  }, [error]);

  return (
    <html lang="da">
      <body className="bg-slate-50 text-slate-900 flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-rose-200 shadow-lg space-y-4">
          <div className="flex items-center gap-3 text-rose-600">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-lg font-bold">Der opstod en kritisk fejl</h2>
          </div>
          <p className="text-sm text-slate-600">
            {error.message || "Siden kunne ikke indlæses på grund af en serverfejl."}
          </p>
          {error.digest && (
            <div className="text-xs font-mono bg-slate-100 p-2 rounded text-slate-500">
              Digest: {error.digest}
            </div>
          )}
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition"
          >
            Prøv igen
          </button>
        </div>
      </body>
    </html>
  );
}
