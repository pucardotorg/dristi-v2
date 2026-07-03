"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Copy, Info, Printer } from "lucide-react";
import { useFilingStore } from "@/src/stores/filing-store";
import { PageTitle } from "@/components/ui/page-title";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";

// ── Types ─────────────────────────────────────────────────────────────────────

type DeliveryChannel = "RPAD" | "Speed Post" | "Hand Delivery";

interface ProcessConfig {
  channel: DeliveryChannel;
  addresses: string[];
}

interface AccusedProcessConfig {
  notice: ProcessConfig;
  summons: ProcessConfig;
  warrants: ProcessConfig;
}

interface AccusedAddress {
  label: string;
  value: string;
}

// ── Fee constants ─────────────────────────────────────────────────────────────

const COURT_FEES = [
  { label: "Legal Benefit Fee", amount: 25 },
  { label: "Advocate Clerk Welfare Fund", amount: 25 },
  { label: "Complaint Fee", amount: 25 },
  { label: "Advocate Welfare Fund", amount: 25 },
  { label: "Court Fee - Delay Notice", amount: 1 },
  { label: "Application Fees (Delay Condonation)", amount: 25, optional: true },
];

/** Per-accused base rate for each process type (charged only if channel ≠ Hand Delivery) */
const PROCESS_RATE: Record<string, number> = {
  summons: 49,
  warrants: 50,
};

const COURT_FEE_TOTAL = COURT_FEES.reduce((s, f) => s + f.amount, 0);

// ── Compute process fees from configs ─────────────────────────────────────────

interface ProcessFeeLineItem {
  label: string;
  amount: number;
}

function computeProcessFees(
  configs: Record<string, AccusedProcessConfig>,
  accusedNames: Record<string, string>
): { items: ProcessFeeLineItem[]; total: number } {
  const items: ProcessFeeLineItem[] = [];
  let total = 0;

  const accusedIds = Object.keys(configs);
  const multiAccused = accusedIds.length > 1;

  for (const accusedId of accusedIds) {
    const cfg = configs[accusedId];
    const name = accusedNames[accusedId] ?? accusedId;

    for (const [processKey, rate] of Object.entries(PROCESS_RATE)) {
      const proc = cfg[processKey as keyof AccusedProcessConfig];
      if (!proc) continue;

      // Hand Delivery → no process fee
      if (proc.channel === "Hand Delivery") continue;

      // No addresses selected → no fee
      const addrCount = proc.addresses.length;
      if (addrCount === 0) continue;

      const amount = rate * addrCount;
      const suffix = multiAccused ? ` — ${name}` : "";
      items.push({
        label: `Process fees for ${processKey}${suffix}`,
        amount,
      });
      total += amount;
    }
  }

  return { items, total };
}

// ── Address multi-select dropdown ─────────────────────────────────────────────

function AddressSelect({
  addresses,
  selected,
  onToggle,
  placeholder = "Select Address",
}: {
  addresses: AccusedAddress[];
  selected: string[];
  onToggle: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? addresses.find((a) => a.value === selected[0])?.label ?? placeholder
      : `${selected.length} addresses selected`;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400 ml-2" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-[220px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1">
          {addresses.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">No addresses added</p>
          ) : (
            addresses.map((addr) => (
              <label
                key={addr.value}
                className="flex items-start gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(addr.value)}
                  onChange={() => onToggle(addr.value)}
                  className="mt-0.5 w-4 h-4 accent-teal cursor-pointer"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                  {addr.label}
                </span>
              </label>
            ))
          )}
          <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1 px-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-teal hover:text-teal/80 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Process row ───────────────────────────────────────────────────────────────

function ProcessRow({
  label,
  optional,
  config,
  addresses,
  onChange,
}: {
  label: string;
  optional?: boolean;
  config: ProcessConfig;
  addresses: AccusedAddress[];
  onChange: (patch: Partial<ProcessConfig>) => void;
}) {
  const toggleAddress = (val: string) => {
    const next = config.addresses.includes(val)
      ? config.addresses.filter((a) => a !== val)
      : [...config.addresses, val];
    onChange({ addresses: next });
  };

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <td className="py-2.5 pr-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
        {label}
        {optional && (
          <span className="ml-1 text-xs text-slate-400">(optional)</span>
        )}
      </td>
      <td className="py-2.5 pr-3 w-[200px]">
        <NativeSelect
          value={config.channel}
          onChange={(v) => onChange({ channel: v as DeliveryChannel })}
          options={["RPAD", "Speed Post", "Hand Delivery"]}
        />
      </td>
      <td className="py-2.5 w-[280px]">
        <AddressSelect
          addresses={addresses}
          selected={config.addresses}
          onToggle={toggleAddress}
        />
      </td>
    </tr>
  );
}

// ── Select Process & Address dialog ──────────────────────────────────────────

function SelectProcessDialog({
  open,
  onSave,
  onSkip,
}: {
  open: boolean;
  onSave: (configs: Record<string, AccusedProcessConfig>) => void;
  onSkip: () => void;
}) {
  const data = useFilingStore((s) => s.data);
  const accusedEntries = Object.entries(data.accused ?? {});

  const defaultConfig = (): AccusedProcessConfig => ({
    notice: { channel: "RPAD", addresses: [] },
    summons: { channel: "RPAD", addresses: [] },
    warrants: { channel: "RPAD", addresses: [] },
  });

  const [configs, setConfigs] = useState<Record<string, AccusedProcessConfig>>(
    () =>
      Object.fromEntries(
        accusedEntries.map(([id]) => [id, defaultConfig()])
      )
  );

  const patch = (
    accusedId: string,
    process: keyof AccusedProcessConfig,
    delta: Partial<ProcessConfig>
  ) => {
    setConfigs((prev) => ({
      ...prev,
      [accusedId]: {
        ...prev[accusedId],
        [process]: { ...prev[accusedId][process], ...delta },
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onSkip(); }}>
      <DialogContent showCloseButton className="sm:max-w-4xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Process &amp; Address</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-1">
          {accusedEntries.map(([id, accused], ai) => {
            const name =
              accused.accusedType === "Entity"
                ? accused.companyName || `Accused ${ai + 1}`
                : accused.fullName || `Accused ${ai + 1}`;

            const addresses: AccusedAddress[] = (accused.addresses ?? []).map(
              (addr, i) => ({
                value: `${i}`,
                label: [addr.address, addr.district, addr.pincode]
                  .filter(Boolean)
                  .join(", "),
              })
            );

            const cfg = configs[id] ?? defaultConfig();

            return (
              <div key={id}>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                  {name}
                </h3>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="pb-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                        Process
                      </th>
                      <th className="pb-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 w-[200px]">
                        Delivery Channel
                      </th>
                      <th className="pb-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 w-[280px]">
                        Select Address
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <ProcessRow
                      label="Notice"
                      config={cfg.notice}
                      addresses={addresses}
                      onChange={(d) => patch(id, "notice", d)}
                    />
                    <ProcessRow
                      label="Summons"
                      optional
                      config={cfg.summons}
                      addresses={addresses}
                      onChange={(d) => patch(id, "summons", d)}
                    />
                    <ProcessRow
                      label="Warrants"
                      optional
                      config={cfg.warrants}
                      addresses={addresses}
                      onChange={(d) => patch(id, "warrants", d)}
                    />
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="teal" onClick={() => onSave(configs)}>
            Save &amp; Next
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Fee line row ──────────────────────────────────────────────────────────────

function FeeRow({
  label,
  amount,
  optional,
}: {
  label: string;
  amount: number;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-slate-600 dark:text-slate-400">
        {label}
        {optional && <span className="text-slate-400">*</span>}
      </span>
      <span className="text-sm text-slate-700 dark:text-slate-300 tabular-nums">
        Rs {amount.toFixed(2)}
      </span>
    </div>
  );
}

// ── Fee breakdown card ────────────────────────────────────────────────────────

function FeeBreakdown({
  processFeeItems,
  processFeeTotal,
  onPayOnline,
  onPayLater,
  onChangeProcess,
}: {
  processFeeItems: ProcessFeeLineItem[];
  processFeeTotal: number;
  onPayOnline: () => void;
  onPayLater: () => void;
  onChangeProcess: () => void;
}) {
  const [courtOpen, setCourtOpen] = useState(true);
  const grandTotal = COURT_FEE_TOTAL + processFeeTotal;

  return (
    <div className="max-w-md w-full">
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Pay Court Fees
          </h2>
        </div>

        <div className="p-4 space-y-4">
          {/* Info banner */}
          <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-3 py-2.5">
            <div className="mt-0.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold leading-none">i</span>
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              <span className="font-semibold">Important information</span>
              <br />
              To view the payment details — please click on{" "}
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={() => setCourtOpen((v) => !v)}
              >
                ({courtOpen ? "^" : "v"})
              </button>{" "}
              to see complete Gateway breakup.
            </p>
          </div>

          {/* Court fees accordion header */}
          <div>
            <button
              type="button"
              className="flex w-full items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1"
              onClick={() => setCourtOpen((v) => !v)}
            >
              <span className="flex items-center gap-2">
                Court Fees
                {courtOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Pending
                </span>
              </span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                Rs {grandTotal}
              </span>
            </button>

            {courtOpen && (
              <div className="divide-y divide-slate-50 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 pt-1">
                {COURT_FEES.map((fee) => (
                  <FeeRow
                    key={fee.label}
                    label={fee.label}
                    amount={fee.amount}
                    optional={fee.optional}
                  />
                ))}
                {processFeeItems.map((fee) => (
                  <FeeRow
                    key={fee.label}
                    label={fee.label}
                    amount={fee.amount}
                    optional
                  />
                ))}
                {processFeeItems.length === 0 && (
                  <div className="py-1.5 text-xs text-slate-400 italic">
                    No process fees — all channels set to Hand Delivery
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pay Online */}
          <Button type="button" variant="teal" className="w-full" onClick={onPayOnline}>
            Pay Online
          </Button>

          {/* Process fees note */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="font-semibold">* Pay Process fees later</span>
              <br /><br />
              To avoid delay, upfront process fees payment for notice, summons,
              and warrant is encouraged. However, it is not mandatory.
              <br /><br />
              Process fees have been calculated for all addresses of the accused
              and for RPAD. Use this option to change the selection or pay later.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onPayLater}
            >
              Pay process fees later
            </Button>
          </div>

          {/* Go Back to change process selection */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <Button
              type="button"
              variant="ghost"
              className="w-full text-slate-600 dark:text-slate-400"
              onClick={onChangeProcess}
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Payment success dialog ────────────────────────────────────────────────────

function PaymentSuccessDialog({
  open,
  filingNumber,
  onGoHome,
  onPrint,
  onMakePayment,
}: {
  open: boolean;
  filingNumber: string;
  onGoHome: () => void;
  onPrint: () => void;
  onMakePayment: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(filingNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="sm:max-w-md w-full p-0 overflow-hidden">
        {/* Success banner */}
        <div className="bg-[#007e7e] px-6 py-6 text-center text-white">
          <p className="text-base font-semibold leading-snug mb-4">
            Your case file is complete. The case file shall be sent for review
            only post completion of payment
          </p>
          <div className="flex items-center justify-center">
            <div className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Case file number */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-4 py-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Case File Number
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {filingNumber}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-teal hover:text-teal/80 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 py-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onGoHome}
          >
            Go to Home
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-1.5"
            onClick={onPrint}
          >
            <Printer className="w-4 h-4" />
            Print Case File
          </Button>
          <Button
            type="button"
            variant="teal"
            className="flex-1"
            onClick={onMakePayment}
          >
            Make Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function PayPage() {
  const filingNumber = useFilingStore((s) => s.filingNumber);
  const data = useFilingStore((s) => s.data);
  const setData = useFilingStore((s) => s.setData);

  const [processDialogDone, setProcessDialogDone] = useState(false);
  const [processConfigs, setProcessConfigs] = useState<Record<string, AccusedProcessConfig>>({});
  const [successOpen, setSuccessOpen] = useState(false);

  // Build accused name map for fee labels
  const accusedNames = useMemo(() => {
    const names: Record<string, string> = {};
    const entries = Object.entries(data.accused ?? {});
    entries.forEach(([id, accused], i) => {
      names[id] =
        accused.accusedType === "Entity"
          ? accused.companyName || `Accused ${i + 1}`
          : accused.fullName || `Accused ${i + 1}`;
    });
    return names;
  }, [data.accused]);

  // Compute dynamic process fees
  const { items: processFeeItems, total: processFeeTotal } = useMemo(
    () => computeProcessFees(processConfigs, accusedNames),
    [processConfigs, accusedNames]
  );

  const handleProcessSave = (configs: Record<string, AccusedProcessConfig>) => {
    setProcessConfigs(configs);
    setProcessDialogDone(true);
  };

  const handleChangeProcess = () => {
    setProcessDialogDone(false);
  };

  const handlePayOnline = () => {
    setSuccessOpen(true);
  };

  const handlePayLater = () => {
    setSuccessOpen(true);
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleMakePayment = () => {
    const method = "upi";
    setData({ payment: { method } });
    window.location.href = "/";
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <PageTitle title="Pay Fees" />

      {/* Select Process & Address — shown until user confirms */}
      <SelectProcessDialog
        open={!processDialogDone}
        onSave={handleProcessSave}
        onSkip={() => setProcessDialogDone(true)}
      />

      {/* Success dialog */}
      <PaymentSuccessDialog
        open={successOpen}
        filingNumber={filingNumber ?? "KL-001198-2026"}
        onGoHome={handleGoHome}
        onPrint={handlePrint}
        onMakePayment={handleMakePayment}
      />

      {/* Main content — fee breakdown */}
      {processDialogDone && !successOpen && (
        <div className="flex justify-center pt-2">
          <FeeBreakdown
            processFeeItems={processFeeItems}
            processFeeTotal={processFeeTotal}
            onPayOnline={handlePayOnline}
            onPayLater={handlePayLater}
            onChangeProcess={handleChangeProcess}
          />
        </div>
      )}

      {/* Placeholder while dialog is open */}
      {!processDialogDone && (
        <div className="flex items-center justify-center min-h-[320px] text-sm text-slate-400 dark:text-slate-500">
          Configure process and address to continue.
        </div>
      )}
    </div>
  );
}
