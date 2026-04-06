import { useState, useCallback } from "react";
import { getAppImportConfigs, type ImportConfig } from "../../lib/importConfig";

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

  // Derived
  const selectedConfig: ImportConfig | null =
    configs.length === 1
      ? configs[0]
      : configs.find((c) => `${appSlug}/${c.entityKey}` === selectedConfigKey) ?? null;

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const reset = useCallback(() => {
    setSelectedConfigKey("");
    setStep("upload");
  }, []);

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

          {/* Step content placeholder — will be filled in next commits */}
          {step === "upload" && selectedConfig && (
            <p className="text-sm text-gray-500">Upload step — coming next.</p>
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
            onClick={step === "upload" ? handleClose : () => setStep(STEPS[stepIndex - 1].key)}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {step === "upload" ? "Cancel" : "Back"}
          </button>
          {step !== "import" && selectedConfig && (
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
