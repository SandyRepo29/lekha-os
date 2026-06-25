"use client";

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from "react";
import { parseCSV, validateCSVHeaders } from "@/lib/utils/csv-parser";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  requiredColumns: string[];
  optionalColumns: string[];
  onImport: (rows: Record<string, string>[]) => Promise<{ success: number; errors: string[] }>;
  templateUrl?: string;
}

type Step = "upload" | "preview" | "confirm" | "result";

interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
  missing: string[];
}

export function ImportModal({
  open,
  onClose,
  entityType,
  requiredColumns,
  optionalColumns,
  onImport,
  templateUrl,
}: ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [parseError, setParseError] = useState("");

  const allColumns = [...requiredColumns, ...optionalColumns];

  function reset() {
    setStep("upload");
    setDragging(false);
    setFileName("");
    setParsed(null);
    setImporting(false);
    setResult(null);
    setParseError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  function processFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      setParseError("Only .csv files are supported.");
      return;
    }
    setParseError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const { headers, rows } = parseCSV(text);
        if (headers.length === 0) {
          setParseError("The file appears to be empty or could not be parsed.");
          return;
        }
        const { missing } = validateCSVHeaders(headers, requiredColumns);
        setFileName(file.name);
        setParsed({ headers, rows, missing });
        setStep("preview");
      } catch {
        setParseError("Failed to parse the CSV file. Please check the format and try again.");
      }
    };
    reader.readAsText(file);
  }

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  async function handleImport() {
    if (!parsed) return;
    const validRows = parsed.missing.length === 0 ? parsed.rows : [];
    setImporting(true);
    try {
      const res = await onImport(validRows);
      setResult(res);
      setStep("result");
    } catch {
      setResult({ success: 0, errors: ["An unexpected error occurred during import."] });
      setStep("result");
    } finally {
      setImporting(false);
    }
  }

  if (!open) return null;

  const previewRows = parsed ? parsed.rows.slice(0, 5) : [];
  const totalRows = parsed ? parsed.rows.length : 0;
  const hasErrors = parsed ? parsed.missing.length > 0 : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-ink)]">
              Import {entityType}
            </h2>
            <p className="mt-0.5 text-sm text-[var(--color-ink-dim)]">
              {step === "upload" && "Upload a CSV file to get started"}
              {step === "preview" && "Review your data before importing"}
              {step === "confirm" && "Confirm your import"}
              {step === "result" && "Import complete"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-[var(--color-ink-dim)] hover:bg-white/[0.06] hover:text-[var(--color-ink)] transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <StepIndicator current={step} />

        <div className="p-6">
          {step === "upload" && (
            <div className="space-y-5">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={[
                  "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                  dragging
                    ? "border-[var(--color-blue)] bg-[var(--color-blue)]/10"
                    : "border-[var(--color-line)] hover:border-[var(--color-blue)]/60 hover:bg-white/[0.02]",
                ].join(" ")}
              >
                <svg className="mb-3 h-10 w-10 text-[var(--color-ink-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  Drop your CSV file here, or{" "}
                  <span className="text-[var(--color-blue)]">click to browse</span>
                </p>
                <p className="mt-1 text-xs text-[var(--color-ink-dim)]">.csv files only</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {parseError && (
                <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
                  {parseError}
                </p>
              )}

              <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-dim)]">
                  Expected columns
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {requiredColumns.map((c) => (
                    <span
                      key={c}
                      className="rounded-md bg-[var(--color-blue)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-blue)]"
                    >
                      {c} *
                    </span>
                  ))}
                  {optionalColumns.map((c) => (
                    <span
                      key={c}
                      className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-[var(--color-ink-dim)]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-[var(--color-ink-dim)]">
                  <span className="text-[var(--color-blue)]">*</span> required columns
                </p>
              </div>

              {templateUrl && (
                <a
                  href={templateUrl}
                  download
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--color-blue)] hover:opacity-80 transition-opacity"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download CSV template
                </a>
              )}
            </div>
          )}

          {step === "preview" && parsed && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-[var(--color-blue)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[var(--color-ink)]">{fileName}</p>
                  <p className="text-xs text-[var(--color-ink-dim)]">{totalRows} row{totalRows !== 1 ? "s" : ""} detected</p>
                </div>
              </div>

              {hasErrors && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 space-y-1">
                  <p className="text-sm font-semibold text-red-400">Missing required columns</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {parsed.missing.map((c) => (
                      <span key={c} className="rounded-md bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-300">
                        {c}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-red-400/80 mt-1">
                    Please fix your CSV and re-upload to proceed.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-[var(--color-line)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-white/[0.04]">
                      <tr>
                        {allColumns
                          .filter((c) => parsed.headers.map((h) => h.toLowerCase()).includes(c.toLowerCase()))
                          .map((col) => (
                            <th
                              key={col}
                              className="px-3 py-2.5 text-left font-semibold text-[var(--color-ink-dim)] whitespace-nowrap"
                            >
                              {col}
                              {requiredColumns.includes(col) && (
                                <span className="ml-1 text-[var(--color-blue)]">*</span>
                              )}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-line)]">
                      {previewRows.map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          {allColumns
                            .filter((c) => parsed.headers.map((h) => h.toLowerCase()).includes(c.toLowerCase()))
                            .map((col) => {
                              const matchedHeader = parsed.headers.find(
                                (h) => h.toLowerCase() === col.toLowerCase()
                              );
                              return (
                                <td
                                  key={col}
                                  className="px-3 py-2 text-[var(--color-ink)] max-w-[160px] truncate"
                                >
                                  {matchedHeader ? row[matchedHeader] : ""}
                                </td>
                              );
                            })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalRows > 5 && (
                  <div className="border-t border-[var(--color-line)] px-4 py-2 text-xs text-[var(--color-ink-dim)]">
                    Showing 5 of {totalRows} rows
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={reset}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--color-ink-dim)] hover:bg-white/[0.06] hover:text-[var(--color-ink)] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("confirm")}
                  disabled={hasErrors}
                  className="rounded-xl px-4 py-2 text-sm font-medium bg-[var(--color-blue)] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === "confirm" && parsed && (
            <div className="space-y-5">
              <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.03] p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-blue)]/15">
                    <svg className="h-5 w-5 text-[var(--color-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--color-ink)]">Ready to import</p>
                    <p className="text-sm text-[var(--color-ink-dim)]">{fileName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/[0.04] px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-[var(--color-ink)]">{totalRows}</p>
                    <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">rows will be imported</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-[var(--color-ink)]">{parsed.headers.length}</p>
                    <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">columns detected</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-ink-dim)]">
                  This will create {totalRows} new {entityType}. This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep("preview")}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--color-ink-dim)] hover:bg-white/[0.06] hover:text-[var(--color-ink)] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-[var(--color-blue)] text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {importing && (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {importing ? "Importing&#8230;" : `Import ${totalRows} row${totalRows !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          )}

          {step === "result" && result && (
            <div className="space-y-5">
              {result.success > 0 && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex items-start gap-3">
                  <svg className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-emerald-400">
                      {result.success} {entityType} imported successfully
                    </p>
                    {result.errors.length > 0 && (
                      <p className="text-xs text-emerald-400/70 mt-0.5">
                        {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} were skipped due to errors.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {result.success === 0 && result.errors.length > 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3">
                  <svg className="h-5 w-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm font-semibold text-red-400">Import failed &#8212; no rows were imported.</p>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-dim)]">
                    Errors ({result.errors.length})
                  </p>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i} className="text-xs text-red-400 flex items-start gap-1.5">
                        <span className="shrink-0 mt-0.5">&#8212;</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={reset}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--color-ink-dim)] hover:bg-white/[0.06] hover:text-[var(--color-ink)] transition-colors"
                >
                  Import more
                </button>
                <button
                  onClick={handleClose}
                  className="rounded-xl px-4 py-2 text-sm font-medium bg-[var(--color-blue)] text-white hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "preview", label: "Preview" },
    { key: "confirm", label: "Confirm" },
  ];

  const order: Step[] = ["upload", "preview", "confirm", "result"];
  const currentIdx = order.indexOf(current);

  return (
    <div className="flex items-center gap-0 border-b border-[var(--color-line)] px-6 py-3">
      {steps.map((s, i) => {
        const stepIdx = order.indexOf(s.key);
        const done = currentIdx > stepIdx;
        const active = current === s.key;

        return (
          <div key={s.key} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  done
                    ? "bg-[var(--color-blue)] text-white"
                    : active
                    ? "border-2 border-[var(--color-blue)] text-[var(--color-blue)]"
                    : "border border-[var(--color-line)] text-[var(--color-ink-dim)]",
                ].join(" ")}
              >
                {done ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={[
                  "text-xs font-medium",
                  active ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]",
                ].join(" ")}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={[
                  "mx-3 h-px w-8 transition-colors",
                  done ? "bg-[var(--color-blue)]" : "bg-[var(--color-line)]",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
