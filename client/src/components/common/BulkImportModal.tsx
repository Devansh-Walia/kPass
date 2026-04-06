import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { getAppImportConfigs, type ImportConfig, type ImportField } from "../../lib/importConfig";
import {
  parseFile,
  generateTemplateCSV,
  downloadCSV,
  isAcceptedFile,
  ACCEPTED_FILE_TYPES,
  type ParsedFile,
} from "../../lib/csvParser";

type Step = "upload" | "mapping" | "preview" | "import";

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload File" },
  { key: "mapping", label: "Map Columns" },
  { key: "preview", label: "Preview" },
  { key: "import", label: "Import" },
];

const PREVIEW_LIMIT = 50;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCell(value: string, field: ImportField): string | null {
  const trimmed = value.trim();

  // Required check
  if (field.required && !trimmed) {
    return `${field.label} is required`;
  }

  // Empty optional fields are fine
  if (!trimmed) return null;

  switch (field.type) {
    case "number":
      if (isNaN(parseFloat(trimmed))) return "Must be a number";
      break;
    case "email":
      if (!EMAIL_RE.test(trimmed)) return "Invalid email format";
      break;
    case "date":
      if (isNaN(Date.parse(trimmed))) return "Invalid date";
      break;
    case "enum":
      if (field.enumValues && !field.enumValues.includes(trimmed)) {
        return `Must be one of: ${field.enumValues.join(", ")}`;
      }
      break;
    // uuid and string: no client-side validation beyond required
  }

  return null;
}

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  appSlug: string;
  onComplete?: () => void;
}

export function BulkImportModal({ open, onClose, appSlug, onComplete }: BulkImportModalProps) {
  const configs = getAppImportConfigs(appSlug);

  const [selectedConfigKey, setSelectedConfigKey] = useState<string>("");
  const [step, setStep] = useState<Step>("upload");

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Column mapping state
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});

  // Derived
  const selectedConfig: ImportConfig | null =
    configs.length === 1
      ? configs[0]
      : configs.find((c) => `${appSlug}/${c.entityKey}` === selectedConfigKey) ?? null;

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const reset = useCallback(() => {
    setSelectedConfigKey("");
    setStep("upload");
    setFile(null);
    setParsed(null);
    setUploadError("");
    setParsing(false);
    setDragging(false);
    setColumnMap({});
  }, []);

  const handleFile = async (f: File) => {
    setUploadError("");
    if (!isAcceptedFile(f)) {
      setUploadError("Unsupported file type. Please upload a .csv, .xlsx, or .xls file.");
      return;
    }
    setFile(f);
    setParsing(true);
    try {
      const result = await parseFile(f);
      setParsed(result);
      setStep("mapping");
    } catch (err: any) {
      setUploadError(err.message || "Failed to parse file.");
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleDownloadTemplate = () => {
    if (!selectedConfig) return;
    const csv = generateTemplateCSV(selectedConfig.fields, selectedConfig.example);
    downloadCSV(csv, `${selectedConfig.entityKey}_import_template.csv`);
  };

  // Auto-map columns when parsed headers + config become available
  useEffect(() => {
    if (!parsed || !selectedConfig) return;
    const map: Record<string, string> = {};
    for (const field of selectedConfig.fields) {
      // Exact key match (case-insensitive)
      const exactKey = parsed.headers.find(
        (h) => h.toLowerCase() === field.key.toLowerCase()
      );
      if (exactKey) {
        map[field.key] = exactKey;
        continue;
      }
      // Label match (case-insensitive)
      const labelMatch = parsed.headers.find(
        (h) => h.toLowerCase() === field.label.toLowerCase()
      );
      if (labelMatch) {
        map[field.key] = labelMatch;
      }
    }
    setColumnMap(map);
  }, [parsed, selectedConfig]);

  const unmappedRequiredFields: ImportField[] = selectedConfig
    ? selectedConfig.fields.filter((f) => f.required && !columnMap[f.key])
    : [];

  const mappingComplete = selectedConfig
    ? selectedConfig.fields.filter((f) => f.required).every((f) => columnMap[f.key])
    : false;

  // Transform parsed rows using the column mapping
  const mappedRows: Record<string, string>[] = useMemo(() => {
    if (!parsed || !selectedConfig) return [];
    return parsed.rows.map((row) => {
      const out: Record<string, string> = {};
      for (const field of selectedConfig.fields) {
        const csvHeader = columnMap[field.key];
        out[field.key] = csvHeader ? (row[csvHeader] ?? "").trim() : "";
      }
      return out;
    });
  }, [parsed, selectedConfig, columnMap]);

  // Validate all rows, return errors keyed by rowIndex -> fieldKey -> error message
  const validationErrors: Record<number, Record<string, string>> = useMemo(() => {
    if (!selectedConfig || mappedRows.length === 0) return {};
    const errors: Record<number, Record<string, string>> = {};
    mappedRows.forEach((row, i) => {
      for (const field of selectedConfig.fields) {
        const err = validateCell(row[field.key] ?? "", field);
        if (err) {
          if (!errors[i]) errors[i] = {};
          errors[i][field.key] = err;
        }
      }
    });
    return errors;
  }, [mappedRows, selectedConfig]);

  const errorRowCount = Object.keys(validationErrors).length;
  const validRowCount = mappedRows.length - errorRowCount;

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Bulk Import{selectedConfig ? ` — ${selectedConfig.entityLabel}` : ""}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex].label}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1 flex-1">
                <div
                  className={`h-2 flex-1 rounded-full ${
                    i <= stepIndex ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Entity selector (only if app has multiple entities) */}
          {step === "upload" && configs.length > 1 && !selectedConfig && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 font-medium">
                What would you like to import?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {configs.map((c) => {
                  const key = `${appSlug}/${c.entityKey}`;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedConfigKey(key)}
                      className="border border-gray-200 rounded-lg p-4 text-left hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{c.entityLabel}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {c.fields.length} fields &middot;{" "}
                        {c.fields.filter((f) => f.required).length} required
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Upload */}
          {step === "upload" && selectedConfig && (
            <div className="space-y-4">
              {/* Template download */}
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Need a template?</p>
                  <p className="text-xs text-gray-500">
                    Download a CSV with the correct headers and an example row.
                  </p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-300 rounded-md hover:bg-indigo-50"
                >
                  Download Template
                </button>
              </div>

              {/* Drag & drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
                  dragging
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
                {parsing ? (
                  <p className="text-sm text-gray-500">Parsing file...</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-700">
                      Drag & drop your file here, or click to browse
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Supports .csv, .xlsx, .xls
                    </p>
                  </>
                )}
              </div>

              {/* File selected indicator */}
              {file && !parsing && (
                <p className="text-sm text-gray-600">
                  Selected: <span className="font-medium">{file.name}</span>
                </p>
              )}

              {/* Error */}
              {uploadError && (
                <p className="text-sm text-red-600">{uploadError}</p>
              )}

              {/* Field reference */}
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Expected fields ({selectedConfig.fields.length})
                </summary>
                <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-3 py-2 text-left">Field</th>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">Required</th>
                        <th className="px-3 py-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedConfig.fields.map((f) => (
                        <tr key={f.key}>
                          <td className="px-3 py-1.5 font-medium text-gray-900">{f.key}</td>
                          <td className="px-3 py-1.5 text-gray-500">
                            {f.type}
                            {f.enumValues ? ` (${f.enumValues.join(", ")})` : ""}
                          </td>
                          <td className="px-3 py-1.5">
                            {f.required ? (
                              <span className="text-red-600 font-medium">Yes</span>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-gray-500">{f.description || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          )}
          {/* Step 2: Column Mapping */}
          {step === "mapping" && selectedConfig && parsed && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Map your file columns to the expected fields.
                  {parsed.rows.length > 0 && (
                    <span className="text-gray-500">
                      {" "}({parsed.rows.length} rows detected)
                    </span>
                  )}
                </p>
                {unmappedRequiredFields.length > 0 && (
                  <span className="text-xs text-amber-600 font-medium">
                    {unmappedRequiredFields.length} required field{unmappedRequiredFields.length > 1 ? "s" : ""} unmapped
                  </span>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Expected Field</th>
                      <th className="px-4 py-2.5 text-left">Your Column</th>
                      <th className="px-4 py-2.5 text-left">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedConfig.fields.map((field) => {
                      const mappedHeader = columnMap[field.key] || "";
                      const previewVal = mappedHeader && parsed.rows[0]
                        ? parsed.rows[0][mappedHeader] ?? ""
                        : "";
                      return (
                        <tr key={field.key} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5">
                            <span className="font-medium text-gray-900">{field.label}</span>
                            {field.required && (
                              <span className="text-red-500 ml-0.5">*</span>
                            )}
                            {field.description && (
                              <p className="text-xs text-gray-400 mt-0.5">{field.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <select
                              value={mappedHeader}
                              onChange={(e) =>
                                setColumnMap((prev) => ({
                                  ...prev,
                                  [field.key]: e.target.value,
                                }))
                              }
                              className={`w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                field.required && !mappedHeader
                                  ? "border-amber-400 bg-amber-50"
                                  : "border-gray-300"
                              }`}
                            >
                              <option value="">— skip —</option>
                              {parsed.headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500 truncate max-w-[200px]">
                            {previewVal || (
                              <span className="text-gray-300 italic">empty</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Step 3: Preview & Validate */}
          {step === "preview" && selectedConfig && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-700">
                  Showing {Math.min(mappedRows.length, PREVIEW_LIMIT)} of{" "}
                  {mappedRows.length} rows
                </p>
                <div className="flex gap-4">
                  <span className="text-green-600 font-medium">
                    {validRowCount} valid
                  </span>
                  {errorRowCount > 0 && (
                    <span className="text-red-600 font-medium">
                      {errorRowCount} with warnings
                    </span>
                  )}
                </div>
              </div>

              {errorRowCount > 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Rows with warnings will still be sent to the server. The server
                  performs its own validation and will report per-row errors.
                </p>
              )}

              {/* Preview table */}
              <div className="border border-gray-200 rounded-lg overflow-auto max-h-[45vh]">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600 uppercase sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-400">#</th>
                      {selectedConfig.fields.map((f) => (
                        <th key={f.key} className="px-3 py-2 text-left whitespace-nowrap">
                          {f.label}
                          {f.required && <span className="text-red-500 ml-0.5">*</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mappedRows.slice(0, PREVIEW_LIMIT).map((row, i) => {
                      const rowErrors = validationErrors[i];
                      return (
                        <tr
                          key={i}
                          className={rowErrors ? "bg-red-50/50" : "hover:bg-gray-50"}
                        >
                          <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                          {selectedConfig.fields.map((f) => {
                            const cellError = rowErrors?.[f.key];
                            return (
                              <td
                                key={f.key}
                                className={`px-3 py-1.5 max-w-[180px] truncate ${
                                  cellError
                                    ? "bg-red-100 text-red-800"
                                    : "text-gray-700"
                                }`}
                                title={cellError || row[f.key] || ""}
                              >
                                {row[f.key] || (
                                  <span className="text-gray-300 italic">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {step === "import" && (
            <p className="text-sm text-gray-500">Import step — coming next.</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-between">
          <button
            onClick={
              step === "upload"
                ? handleClose
                : () => {
                    if (step === "mapping") {
                      setFile(null);
                      setParsed(null);
                      setColumnMap({});
                    }
                    setStep(STEPS[stepIndex - 1].key);
                  }
            }
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {step === "upload" ? "Cancel" : "Back"}
          </button>
          {step !== "import" && step !== "upload" && selectedConfig && (
            <button
              onClick={() => setStep(STEPS[stepIndex + 1].key)}
              disabled={step === "mapping" && !mappingComplete}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {step === "preview"
                ? `Import ${mappedRows.length} row${mappedRows.length !== 1 ? "s" : ""}`
                : "Next"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
