import * as XLSX from "xlsx";

export interface ParsedFile {
  headers: string[];
  rows: Record<string, string>[];
  sheetName: string;
}

/**
 * Parse a CSV or Excel file and return headers + rows as string records.
 * All values are returned as strings — type coercion happens during validation.
 */
export async function parseFile(file: File): Promise<ParsedFile> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array", raw: false, dateNF: "yyyy-mm-dd" });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("No sheets found in file");
  }

  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
    raw: false,
  });

  if (jsonData.length === 0) {
    throw new Error("File is empty or has no data rows");
  }

  // Extract headers from first row keys
  const headers = Object.keys(jsonData[0]);

  return {
    headers,
    rows: jsonData,
    sheetName,
  };
}

/**
 * Generate a CSV string from headers and example data for template download.
 */
export function generateTemplateCSV(
  fields: { key: string; label: string }[],
  example: Record<string, any>
): string {
  const headers = fields.map((f) => f.key);
  const exampleRow = headers.map((h) => {
    const val = example[h];
    if (val === undefined || val === null) return "";
    const str = String(val);
    // Escape values that contain commas or quotes
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  });

  return [headers.join(","), exampleRow.join(",")].join("\n");
}

/**
 * Trigger a file download in the browser.
 */
export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Accepted file extensions for import.
 */
export const ACCEPTED_FILE_TYPES = ".csv,.xlsx,.xls";

/**
 * Check if a file has an accepted extension.
 */
export function isAcceptedFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "csv" || ext === "xlsx" || ext === "xls";
}
