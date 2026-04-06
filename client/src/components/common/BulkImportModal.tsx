import { useState, useCallback, useRef } from "react";
import { getAppImportConfigs, type ImportConfig } from "../../lib/importConfig";
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
          {step === "mapping" && (
            <p className="text-sm text-gray-500">Mapping step — coming next.</p>
          )}
          {step === "preview" && (
            <p className="text-sm text-gray-500">Preview step — coming next.</p>
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
              disabled={!selectedConfig}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
