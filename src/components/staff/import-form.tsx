"use client";

import { useState, useRef } from "react";

interface ImportSummary {
  total: number;
  filed: number;
  failed: number;
  skipped: number;
  details: { external_filing_id: string; status: string; reason?: string }[];
}

export function ImportForm() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("File must contain a JSON array");

      const res = await fetch("/api/cis/import-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Import failed (HTTP ${res.status})`);
      }

      setSummary(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
      // Reset file input so same file can be re-uploaded
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="inline-flex items-center gap-2">
        <label
          className={`inline-flex items-center gap-2 h-10 px-4 rounded-md border font-medium text-sm cursor-pointer transition-colors ${
            loading
              ? "border-slate-200 text-slate-300 cursor-default"
              : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
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
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {loading ? "Importing…" : "Import CIS Results"}
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
        </label>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
      {summary && (
        <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-md px-3 py-2">
          <span className="font-medium">{summary.total}</span> processed:{" "}
          <span className="text-green-600 dark:text-green-400 font-medium">{summary.filed} filed</span>
          {summary.failed > 0 && (
            <> · <span className="text-red-500 font-medium">{summary.failed} failed</span></>
          )}
          {summary.skipped > 0 && (
            <> · <span className="text-amber-500 font-medium">{summary.skipped} skipped</span></>
          )}
          {summary.details
            .filter((d) => d.reason)
            .map((d, i) => (
              <div key={i} className="text-slate-400 mt-1">
                {d.external_filing_id.slice(0, 12)}… — {d.reason}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
