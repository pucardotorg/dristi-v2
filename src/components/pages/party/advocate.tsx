"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useFilingStore } from "@/src/stores/filing-store";
import { useSession } from "@/lib/auth-client";
import { Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { NumStepper } from "@/components/ui/num-stepper";
import { PageTitle } from "@/components/ui/page-title";
import { MultiSelect } from "@/components/ui/multi-select";

import type { Advocate } from "@/src/types";

interface SearchResult {
  barNumber: string;
  name: string;
  mobile: string;
  status: string;
}

// ── Typeahead search input ───────────────────────────────────────────────────

function AdvocateSearchInput({
  value,
  onChange,
  onSelect,
  placeholder,
  tenantId,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (r: SearchResult) => void;
  placeholder?: string;
  tenantId: string;
}) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef(false);

  useEffect(() => {
    if (!typedRef.current) return;
    typedRef.current = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/advocate/search?q=${encodeURIComponent(value)}&tenantId=${encodeURIComponent(tenantId)}`
        );
        const json = (await res.json()) as { advocates: SearchResult[] };
        setResults(json.advocates ?? []);
        setOpen((json.advocates ?? []).length > 0);
      } catch {
        setResults([]);
        setOpen(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, tenantId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={(e) => {
          typedRef.current = true;
          onChange(e.target.value);
        }}
        placeholder={placeholder}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-background shadow-md overflow-hidden">
          {results.map((r) => (
            <button
              key={r.barNumber}
              type="button"
              className="flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800"
              onMouseDown={(e) => {
                e.preventDefault();
                if (debounceRef.current) clearTimeout(debounceRef.current);
                onSelect(r);
                setOpen(false);
                setResults([]);
              }}
            >
              <span className="font-medium truncate pr-2">{r.name}</span>
              <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
                {r.barNumber}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdvocatePage() {
  const data = useFilingStore((s) => s.data);
  const updateAdvocate = useFilingStore((s) => s.updateAdvocate);
  const addAdvocate = useFilingStore((s) => s.addAdvocate);
  const removeAdvocate = useFilingStore((s) => s.removeAdvocate);

  const { data: session } = useSession();
  const tenantId =
    (session?.user as { tenant_id?: string } | null)?.tenant_id ?? "kl";

  const advocateIds = Object.keys(data.advocates);
  const complainantIds = Object.keys(data.complainants);

  const u = useCallback(
    (id: string, k: keyof Advocate, v: string | string[]) => {
      updateAdvocate(id, { [k]: v });
    },
    [updateAdvocate]
  );

  const handleSelect = useCallback(
    (id: string, r: SearchResult) => {
      updateAdvocate(id, { barNumber: r.barNumber, name: r.name, phone: r.mobile });
    },
    [updateAdvocate]
  );

  const handleRemove = (id: string) => {
    if (advocateIds.length <= 1) return;
    removeAdvocate(id);
  };

  const complainantOptions = complainantIds.map((id, i) => {
    const c = data.complainants[id];
    return {
      value: id,
      label: c?.repName || c?.entityName || `Complainant ${i + 1}`,
    };
  });

  return (
    <div>
      <PageTitle title="Advocate details">
        <NumStepper
          label="Number of advocates present on the Vakalatnama"
          value={advocateIds.length}
          onChange={(n) => {
            const current = advocateIds.length;
            if (n > current) addAdvocate();
            else if (n < current && current > 1) {
              removeAdvocate(advocateIds[advocateIds.length - 1]);
            }
          }}
        />
      </PageTitle>

      <Alert className="mb-5">
        <AlertDescription>
          Note: You will only be able to add advocates who have registered
          themselves on the court portal. You can also provide case access to
          other advocates later once they register on the court portal.
        </AlertDescription>
      </Alert>

      {advocateIds.map((id, idx) => {
        const av: Advocate = data.advocates[id] ?? {
          barNumber: "",
          name: "",
          phone: "",
          email: "",
          vakalat: "",
          advocateFor: [],
        };

        return (
          <div
            key={id}
            className="rounded-lg border border-slate-200 dark:border-slate-700 mb-6"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Advocate {idx + 1}
              </span>
              {advocateIds.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemove(id)}
                  aria-label={`Remove Advocate ${idx + 1}`}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>

            <div className="field-stack p-4">
              <FormField label="Advocate for:">
                <MultiSelect
                  value={av.advocateFor}
                  onChange={(v) => u(id, "advocateFor", v)}
                  options={complainantOptions}
                  allLabel="All Complainants"
                />
              </FormField>

              <FormField label="BAR Registration" required>
                <AdvocateSearchInput
                  value={av.barNumber}
                  onChange={(v) => u(id, "barNumber", v)}
                  onSelect={(r) => handleSelect(id, r)}
                  placeholder="e.g. IN/001"
                  tenantId={tenantId}
                />
              </FormField>

              <FormField label="Full Name" required>
                <AdvocateSearchInput
                  value={av.name}
                  onChange={(v) => u(id, "name", v)}
                  onSelect={(r) => handleSelect(id, r)}
                  placeholder="Search by name"
                  tenantId={tenantId}
                />
              </FormField>
            </div>
          </div>
        );
      })}
    </div>
  );
}
