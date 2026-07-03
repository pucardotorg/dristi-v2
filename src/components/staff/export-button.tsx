"use client";

import { useState } from "react";

export function ExportButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cis/daily-export");
      if (!res.ok) throw new Error(`Export failed (HTTP ${res.status})`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        setError("No cases ready for CIS export.");
        return;
      }

      // Build filename with today's date
      const today = new Date().toISOString().slice(0, 10);
      const filename = `cis-daily-filings-${today}.json`;

      // Trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleExport}
        disabled={loading}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-teal text-white border border-teal font-medium text-sm cursor-pointer hover:bg-teal-dark disabled:opacity-40 disabled:cursor-default transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {loading ? "Exporting…" : "Download Today’s CIS Batch"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
