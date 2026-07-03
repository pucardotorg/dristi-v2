"use client";

import { useState, useRef } from "react";
import { Download, Upload, Info } from "lucide-react";
import { useFilingStore } from "@/src/stores/filing-store";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { FilingData } from "@/src/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type SignMode = "esign" | "upload";
type SignerStatus = "pending" | "signed";

interface Signer {
  id: string;
  name: string;
  group: "complainant" | "advocate";
  status: SignerStatus;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SignerStatus }) {
  if (status === "signed") {
    return (
      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        Signed
      </span>
    );
  }
  return (
    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      Pending
    </span>
  );
}

// ── Left signer panel ─────────────────────────────────────────────────────────

function SignerPanel({ signers }: { signers: Signer[] }) {
  const complainants = signers.filter((s) => s.group === "complainant");
  const advocates = signers.filter((s) => s.group === "advocate");

  return (
    <div className="w-52 shrink-0 flex flex-col gap-5">
      {/* Info box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40 p-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-bold leading-none">i</span>
          </div>
          <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            <p className="font-semibold mb-0.5">You are filing a case</p>
            <p>
              Under{" "}
              <span className="underline underline-offset-2 cursor-pointer">
                S-138, Negotiable Instruments Act
              </span>{" "}
              in the 24X7 ON COURT
            </p>
          </div>
        </div>
      </div>

      {/* Complainant Signature */}
      {complainants.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Complainant Signature
          </h3>
          <div className="space-y-2.5">
            {complainants.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                  {i + 2}. {s.name}
                </span>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advocate Signature */}
      {advocates.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Advocate Signature
          </h3>
          <div className="space-y-2.5">
            {advocates.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                  {i + 2}. {s.name}
                </span>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Document preview ──────────────────────────────────────────────────────────

function DocumentPreview({ data }: { data: FilingData }) {
  const firstComplainant = Object.values(data.complainants ?? {})[0];
  const firstAccused = Object.values(data.accused ?? {})[0];
  const firstCheque = Object.values(data.cheques ?? {})[0];

  const complainantName =
    firstComplainant?.complainantType === "Entity"
      ? (firstComplainant.entityName || "Complainant")
      : (firstComplainant?.repName || "Complainant");

  const accusedName =
    firstAccused?.accusedType === "Entity"
      ? (firstAccused.companyName || "Accused")
      : (firstAccused?.fullName || "Accused");

  return (
    <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 overflow-y-auto">
      <div className="p-10 min-h-[420px] font-serif text-slate-800 dark:text-slate-200">
        <h2 className="text-xl font-bold text-center mb-10 leading-snug">
          Complaint under Section 138 of the Negotiable Instruments Act, 1881
        </h2>

        <div className="space-y-3 text-sm leading-relaxed">
          <p>IN THE COURT OF [Court Name]</p>

          <p className="mt-2">
            {complainantName} vs {accusedName}
          </p>

          <p>Complaint No. _____ of {new Date().getFullYear()}</p>

          <p className="mt-6">Between</p>
          <p className="pl-4">{complainantName} &nbsp; … Complainant</p>

          <p className="mt-4">And</p>
          <p className="pl-4">{accusedName} &nbsp; … Accused</p>

          {firstCheque && (
            <div className="mt-8 space-y-1">
              <p className="font-semibold">Cheque Details</p>
              <p>Cheque No: {firstCheque.number || "___"}</p>
              <p>Amount: ₹{firstCheque.amount || "___"}</p>
              <p>Date: {firstCheque.date || "___"}</p>
              <p>Bank: {firstCheque.bank || "___"}</p>
              {firstCheque.returnDate && (
                <p>Return Date: {firstCheque.returnDate}</p>
              )}
            </div>
          )}

          <p className="mt-8 text-xs text-slate-400">
            This document requires signatures from all complainants and their
            advocate(s) before submission to court.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Choose Mode dialog ────────────────────────────────────────────────────────

function ChooseModeDialog({
  open,
  onChoose,
}: {
  open: boolean;
  onChoose: (mode: SignMode) => void;
}) {
  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Choose Mode of Signing</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            All parties must use the same mode of signing.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            If E-Sign is selected, all parties must sign using their{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              Aadhar-linked mobile number.
            </strong>
          </p>
          <button
            type="button"
            className="text-sm text-teal underline underline-offset-2 hover:text-teal/80 transition-colors"
          >
            Download Submission
          </button>
        </div>

        <DialogFooter className="-mx-4 -mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onChoose("upload")}
          >
            Upload Signed Copy
          </Button>
          <Button
            type="button"
            variant="teal"
            onClick={() => onChoose("esign")}
          >
            E-Sign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Upload Signed dialog ──────────────────────────────────────────────────────

function UploadSignedDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = "";
  };

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit(selectedFile);
      setSelectedFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent showCloseButton className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Upload Signed Complaint</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <AlertDescription className="space-y-2">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Please Note
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Please ensure you have collected the signatures of all parties
                (
                <strong className="text-slate-800 dark:text-slate-200">
                  All complainants and an advocate for each complainant must
                  sign the case
                </strong>
                ).
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You can upload a file signed physically or with a{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  Digital Signature Certificate (DSC)
                </strong>
                .
              </p>
            </AlertDescription>
          </Alert>

          {/* Drag-drop area */}
          <div
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors ${
              dragOver
                ? "border-teal bg-teal/5"
                : "border-slate-300 hover:border-teal/50 dark:border-slate-600"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-10 w-10 text-slate-400" />
            {selectedFile ? (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {selectedFile.name}
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Drag and drop your file or{" "}
                <span className="text-teal underline underline-offset-2">
                  Browse in my files
                </span>
              </p>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".jpg,.png,.jpeg,.pdf"
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload .jpg, .png, .jpeg or .pdf. Maximum upload size of 5MB
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Want to download unsigned document?{" "}
              <button
                type="button"
                className="text-teal underline underline-offset-2 hover:text-teal/80 transition-colors"
              >
                Click here
              </button>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="teal"
            disabled={!selectedFile}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function SignPage() {
  const data = useFilingStore((s) => s.data);
  const setData = useFilingStore((s) => s.setData);

  // Start with the mode picker dialog open; once confirmed the main layout shows
  const [chosenMode, setChosenMode] = useState<SignMode | null>(
    data.sign?.consent && data.sign?.mode ? (data.sign.mode as SignMode) : null
  );
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const complainantEntries = Object.entries(data.complainants ?? {});
  const advocateEntries = Object.entries(data.advocates ?? {});

  const signers: Signer[] = [
    ...complainantEntries.map(([id, c], i) => ({
      id: `c-${id}`,
      name:
        c.complainantType === "Entity"
          ? (c.entityName || `Complainant ${i + 1}`)
          : (c.repName || `Complainant ${i + 1}`),
      group: "complainant" as const,
      status: "pending" as SignerStatus,
    })),
    ...advocateEntries.map(([id, av], i) => ({
      id: `av-${id}`,
      name: av.name || `Advocate ${i + 1}`,
      group: "advocate" as const,
      status: "pending" as SignerStatus,
    })),
  ];

  const handleModeChosen = (mode: SignMode) => {
    setChosenMode(mode);
    setData({ sign: { ...data.sign, mode, consent: true } });
    if (mode === "upload") {
      setUploadDialogOpen(true);
    }
  };

  const handleUploadSubmit = (file: File) => {
    setUploadedFile(file.name);
    setUploadDialogOpen(false);
  };

  return (
    <div>
      {/* Mode chooser — shown until user picks a mode */}
      <ChooseModeDialog
        open={chosenMode === null}
        onChoose={handleModeChosen}
      />

      {/* Upload dialog */}
      <UploadSignedDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSubmit={handleUploadSubmit}
      />

      {/* Main content — shown after mode is confirmed */}
      {chosenMode !== null && (
        <div className="flex gap-6 min-h-0">
          {/* Left: signer status */}
          <SignerPanel signers={signers} />

          {/* Center: document preview */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Sign the Complaint
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  You are filing a Criminal Case under S-138, Negotiable
                  Instruments Act
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 shrink-0">
                <Download className="w-3.5 h-3.5" />
                Download Case PDF
              </Button>
            </div>

            <DocumentPreview data={data} />
          </div>

          {/* Right: add signature */}
          <div className="w-44 shrink-0">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Add Signature
            </h3>

            {chosenMode === "upload" ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="teal"
                  className="w-full"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <Upload className="w-3.5 h-3.5 mr-2" />
                  Upload Signed Copy
                </Button>
                {uploadedFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 break-words">
                    ✓ {uploadedFile}
                  </p>
                )}
              </div>
            ) : (
              <Button type="button" variant="teal" className="w-full">
                E-Sign
              </Button>
            )}

            <button
              type="button"
              onClick={() => {
                setChosenMode(null);
                setData({ sign: { ...data.sign, consent: false } });
              }}
              className="mt-4 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors"
            >
              Change signing mode
            </button>
          </div>
        </div>
      )}

      {/* Placeholder while dialog is open */}
      {chosenMode === null && (
        <div className="flex items-center justify-center min-h-[320px] text-sm text-slate-400 dark:text-slate-500">
          Choose a signing mode to continue.
        </div>
      )}
    </div>
  );
}
