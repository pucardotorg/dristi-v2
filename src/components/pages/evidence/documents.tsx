"use client";

import { useRef, useState, useEffect } from "react";
import { Upload, Trash2, Plus, CheckCircle2, XCircle, Info } from "lucide-react";
import { useFilingStore } from "@/src/stores/filing-store";
import { PageTitle } from "@/components/ui/page-title";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DocUpload } from "@/src/types";

// ── Upload dialog ─────────────────────────────────────────────────────────────

function UploadDialog({
  open,
  documentName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  documentName: string;
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit(selectedFile);
      setSelectedFile(null);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent showCloseButton className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Upload {documentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
            If you upload multiple documents here, the system will combine them into a single file.
          </div>

          <div
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 transition-colors ${
              dragOver
                ? "border-teal bg-teal/5"
                : "border-slate-300 hover:border-teal/50 dark:border-slate-600"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-10 w-10 text-slate-400" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Drag and drop your file or{" "}
              <span className="text-teal underline underline-offset-2">Browse in my files</span>
            </p>
            {selectedFile && (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {selectedFile.name}
              </p>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".jpg,.png,.jpeg,.pdf"
              onChange={handleFileChange}
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload .jpg, .png, .jpeg or .pdf. Maximum upload size of 5MB
          </p>
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

// ── File preview dialog ───────────────────────────────────────────────────────

function FilePreviewDialog({
  open,
  fileName,
  blobUrl,
  onGoBack,
  onRemove,
}: {
  open: boolean;
  fileName: string;
  blobUrl: string | null;
  onGoBack: () => void;
  onRemove: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onGoBack()}>
      <DialogContent
        showCloseButton
        className="flex max-h-[90vh] max-w-3xl w-full flex-col gap-0 p-0"
      >
        <DialogHeader className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle className="truncate text-base font-normal text-slate-900 dark:text-slate-100">
            {fileName}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto bg-white dark:bg-slate-900">
          {blobUrl ? (
            <iframe
              src={blobUrl}
              title={fileName}
              className="w-full h-full min-h-[420px] border-0"
            />
          ) : (
            <div className="flex min-h-[420px] items-center justify-center text-sm text-slate-400">
              Preview unavailable
            </div>
          )}
        </div>

        <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" onClick={onRemove}>
            Remove
          </Button>
          <Button variant="teal" onClick={onGoBack}>
            Go Back
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Document row ──────────────────────────────────────────────────────────────

interface DocRowProps {
  slNo: number;
  name: string;
  fileName: string | undefined;
  nativelyDigital: boolean;
  quality: "good" | "bad" | undefined;
  isExtra?: boolean;
  onUpload: (fileName: string) => void;
  onToggleDigital: (val: boolean) => void;
  onSetQuality: (q: "good" | "bad") => void;
  onClear: () => void;
  onRemoveRow?: () => void;
}

function DocRow({
  slNo,
  name,
  fileName,
  nativelyDigital,
  quality,
  isExtra = false,
  onUpload,
  onToggleDigital,
  onSetQuality,
  onClear,
  onRemoveRow,
}: DocRowProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSubmit = (file: File) => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    const url = URL.createObjectURL(file);
    setBlobUrl(url);
    onUpload(file.name);
    setUploadDialogOpen(false);
    setPreviewOpen(true);
  };

  const handleRemove = () => {
    if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); }
    setPreviewOpen(false);
    onClear();
  };

  const hasFile = !!fileName;

  return (
    <>
      <TableRow>
        <TableCell className="text-slate-500">{slNo}</TableCell>
        <TableCell className="font-medium text-slate-700 dark:text-slate-300">
          {isExtra ? (
            <div className="flex items-center gap-2">
              {name}
              <button
                type="button"
                onClick={onRemoveRow}
                className="text-slate-300 hover:text-red-500 transition-colors"
                title="Remove row"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : name}
        </TableCell>
        <TableCell>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-slate-600"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </Button>
        </TableCell>
        <TableCell className="text-center">
          <input
            type="checkbox"
            checked={nativelyDigital}
            onChange={(e) => onToggleDigital(e.target.checked)}
            className="w-4 h-4 accent-teal cursor-pointer"
          />
        </TableCell>
        <TableCell>
          {hasFile ? (
            <button
              type="button"
              className="text-sm text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 text-left"
              onClick={() => blobUrl && setPreviewOpen(true)}
            >
              {fileName}
            </button>
          ) : (
            <span className="text-sm text-slate-400">No file chosen</span>
          )}
        </TableCell>
        <TableCell>
          {hasFile && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Mark as Good Quality"
                onClick={() => onSetQuality("good")}
                className={`p-0.5 rounded transition-colors ${quality === "good" ? "text-green-500" : "text-slate-300 hover:text-green-400"}`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Mark as Bad Quality"
                onClick={() => onSetQuality("bad")}
                className={`p-0.5 rounded transition-colors ${quality === "bad" ? "text-red-500" : "text-slate-300 hover:text-red-400"}`}
              >
                <XCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Remove file"
                onClick={handleRemove}
                className="p-0.5 rounded text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </TableCell>
      </TableRow>

      <UploadDialog
        open={uploadDialogOpen}
        documentName={name}
        onClose={() => setUploadDialogOpen(false)}
        onSubmit={handleFileSubmit}
      />

      <FilePreviewDialog
        open={previewOpen}
        fileName={fileName ?? ""}
        blobUrl={blobUrl}
        onGoBack={() => setPreviewOpen(false)}
        onRemove={handleRemove}
      />
    </>
  );
}

// ── Add row inline ────────────────────────────────────────────────────────────

function AddExtraRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const commit = () => {
    const trimmed = name.trim();
    if (trimmed) { onAdd(trimmed); setName(""); }
    setAdding(false);
  };

  if (adding) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Document name"
              className="max-w-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setAdding(false);
              }}
            />
            <Button type="button" size="sm" variant="teal" onClick={commit}>
              Add
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell colSpan={6}>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm font-medium text-teal hover:text-teal/80 transition-colors"
          onClick={() => setAdding(true)}
        >
          <Plus className="w-4 h-4" />
          Add other documents
        </button>
      </TableCell>
    </TableRow>
  );
}

// ── Document section ──────────────────────────────────────────────────────────

interface SectionRow { key: string; name: string; }

interface ExtraDocEntry {
  name: string;
  fileName: string;
  nativelyDigital: boolean;
  quality?: "good" | "bad";
}

interface DocSectionProps {
  title: string;
  rows: SectionRow[];
  extras: ExtraDocEntry[];
  uploads: { [key: string]: DocUpload };
  showNativelyDigitalLabel?: boolean;
  showQualityLegend?: boolean;
  onUpload: (key: string, fileName: string) => void;
  onToggleDigital: (key: string, val: boolean) => void;
  onSetQuality: (key: string, q: "good" | "bad") => void;
  onClear: (key: string) => void;
  onAddExtra: (name: string) => void;
  onUpdateExtras: (next: ExtraDocEntry[]) => void;
  onRemoveExtra: (index: number) => void;
}

function DocSection({
  title,
  rows,
  extras,
  uploads,
  showNativelyDigitalLabel = false,
  showQualityLegend = false,
  onUpload,
  onToggleDigital,
  onSetQuality,
  onClear,
  onAddExtra,
  onUpdateExtras,
  onRemoveExtra,
}: DocSectionProps) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
        {showQualityLegend && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 border border-red-200 rounded px-2 py-0.5">
              <XCircle className="w-3 h-3" /> Bad Quality
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 border border-green-200 rounded px-2 py-0.5">
              <CheckCircle2 className="w-3 h-3" /> Good Quality
            </span>
          </div>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Sl.No</TableHead>
              <TableHead>Document Name</TableHead>
              <TableHead className="w-28">Action</TableHead>
              <TableHead className="w-40 text-center">
                {showNativelyDigitalLabel ? (
                  <span className="inline-flex items-center gap-1 justify-center">
                    Natively Digital
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                ) : null}
              </TableHead>
              <TableHead>File</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => {
              const up = uploads[row.key];
              return (
                <DocRow
                  key={row.key}
                  slNo={i + 1}
                  name={row.name}
                  fileName={up?.fileName || undefined}
                  nativelyDigital={up?.nativelyDigital ?? false}
                  quality={up?.quality}
                  onUpload={(f) => onUpload(row.key, f)}
                  onToggleDigital={(v) => onToggleDigital(row.key, v)}
                  onSetQuality={(q) => onSetQuality(row.key, q)}
                  onClear={() => onClear(row.key)}
                />
              );
            })}
            {extras.map((ex, i) => (
              <DocRow
                key={i}
                slNo={rows.length + i + 1}
                name={ex.name}
                fileName={ex.fileName || undefined}
                nativelyDigital={ex.nativelyDigital}
                quality={ex.quality}
                isExtra
                onUpload={(f) => onUpdateExtras(extras.map((e, idx) => idx === i ? { ...e, fileName: f } : e))}
                onToggleDigital={(v) => onUpdateExtras(extras.map((e, idx) => idx === i ? { ...e, nativelyDigital: v } : e))}
                onSetQuality={(q) => onUpdateExtras(extras.map((e, idx) => idx === i ? { ...e, quality: q } : e))}
                onClear={() => onUpdateExtras(extras.map((e, idx) => idx === i ? { ...e, fileName: "", quality: undefined } : e))}
                onRemoveRow={() => onRemoveExtra(i)}
              />
            ))}
            <AddExtraRow onAdd={onAddExtra} />
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function DocumentsPage() {
  const data = useFilingStore((s) => s.data);
  const updateDocUpload = useFilingStore((s) => s.updateDocUpload);
  const addExtraCaseDoc = useFilingStore((s) => s.addExtraCaseDoc);
  const removeExtraCaseDoc = useFilingStore((s) => s.removeExtraCaseDoc);
  const addExtraPartyDoc = useFilingStore((s) => s.addExtraPartyDoc);
  const removeExtraPartyDoc = useFilingStore((s) => s.removeExtraPartyDoc);
  const setData = useFilingStore((s) => s.setData);

  const docs = data.docs ?? { uploads: {}, extraCase: [], extraParty: {} };

  const chequeIds = Object.keys(data.cheques ?? {});
  const demandIds = Object.keys(data.demands ?? {});
  const complainantIds = Object.keys(data.complainants ?? {});

  const caseRows: SectionRow[] = [
    ...chequeIds.map((id, i) => ({ key: `cheque-${id}`, name: `Cheque ${i + 1}` })),
    { key: "cheque-return-memo", name: "Cheque return memo" },
    ...demandIds.map((id, i) => ({ key: `demand-${id}`, name: `Demand notice ${i + 1}` })),
    { key: "proof-dispatch", name: "Proof of dispatch (postal receipt)" },
    { key: "proof-delivery", name: "Proof of delivery (ID Card)" },
    { key: "reply-demand", name: "Reply to the demand notice" },
  ];

  const updDoc = (key: string, patch: Partial<DocUpload>) => updateDocUpload(key, patch);

  return (
    <div>
      <PageTitle title="List of documents" />

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-3xl">
        No need to upload the affidavits or delay condonation application here.
        Please make sure the document is uploaded the right way up and is easy to read
        (not sideways or upside down).
      </p>

      <Alert className="mb-6">
        <Info className="w-4 h-4 text-blue-500 shrink-0" />
        <AlertDescription>
          Check the box if you are attaching an original document that is digital in nature,
          and not a scanned copy of a physical document.
        </AlertDescription>
      </Alert>

      <DocSection
        title="Case details"
        rows={caseRows}
        extras={docs.extraCase}
        uploads={docs.uploads}
        showNativelyDigitalLabel={false}
        showQualityLegend={true}
        onUpload={(key, f) => updDoc(key, { fileName: f })}
        onToggleDigital={(key, v) => updDoc(key, { nativelyDigital: v })}
        onSetQuality={(key, q) => updDoc(key, { quality: q })}
        onClear={(key) => updDoc(key, { fileName: "", quality: undefined })}
        onAddExtra={addExtraCaseDoc}
        onUpdateExtras={(next) => setData({ docs: { ...docs, extraCase: next } })}
        onRemoveExtra={removeExtraCaseDoc}
      />

      {complainantIds.map((cId, ci) => {
        const partyRows: SectionRow[] = [
          { key: `party-${cId}-aadhar`, name: "Aadhar Card Complainant" },
          { key: `party-${cId}-poa`, name: "Power of Attorney" },
          { key: `party-${cId}-vakalat`, name: "Vakalatnama" },
        ];
        const partyExtras: ExtraDocEntry[] = docs.extraParty[cId] ?? [];

        return (
          <DocSection
            key={cId}
            title={`Party ${ci + 1} details`}
            rows={partyRows}
            extras={partyExtras}
            uploads={docs.uploads}
            showNativelyDigitalLabel={true}
            showQualityLegend={false}
            onUpload={(key, f) => updDoc(key, { fileName: f })}
            onToggleDigital={(key, v) => updDoc(key, { nativelyDigital: v })}
            onSetQuality={(key, q) => updDoc(key, { quality: q })}
            onClear={(key) => updDoc(key, { fileName: "", quality: undefined })}
            onAddExtra={(name) => addExtraPartyDoc(cId, name)}
            onUpdateExtras={(next) =>
              setData({ docs: { ...docs, extraParty: { ...docs.extraParty, [cId]: next } } })
            }
            onRemoveExtra={(i) => removeExtraPartyDoc(cId, i)}
          />
        );
      })}
    </div>
  );
}
