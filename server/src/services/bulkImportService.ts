import { ZodSchema, ZodError } from "zod";

export interface BulkImportRowResult {
  row: number;
  status: "success" | "error";
  error?: string;
  data?: any;
}

export interface BulkImportResult {
  total: number;
  succeeded: number;
  failed: number;
  results: BulkImportRowResult[];
}

interface BulkImportParams {
  rows: Record<string, unknown>[];
  schema: ZodSchema;
  createFn: (validatedData: any, userId: string) => Promise<any>;
  userId: string;
  /** Optional pre-processing function to resolve foreign keys by name, etc. */
  resolveFn?: (row: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

export async function processBulkImport({
  rows,
  schema,
  createFn,
  userId,
  resolveFn,
}: BulkImportParams): Promise<BulkImportResult> {
  const results: BulkImportRowResult[] = [];
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 1;
    try {
      // Step 1: Resolve foreign keys if needed
      let row = rows[i];
      if (resolveFn) {
        row = await resolveFn(row);
      }

      // Step 2: Validate with Zod
      const validated = schema.parse(row);

      // Step 3: Create record
      const data = await createFn(validated, userId);
      results.push({ row: rowNum, status: "success", data });
      succeeded++;
    } catch (err: any) {
      failed++;
      let errorMessage = "Unknown error";

      if (err instanceof ZodError) {
        // Collect all field-level errors into a readable string
        errorMessage = err.issues
          .map((issue) => {
            const path = issue.path.join(".");
            return path ? `${path}: ${issue.message}` : issue.message;
          })
          .join("; ");
      } else if (err?.code === "P2002") {
        // Prisma unique constraint violation
        const fields = err.meta?.target?.join(", ") || "unknown field";
        errorMessage = `Duplicate entry — unique constraint failed on: ${fields}`;
      } else if (err?.code === "P2003") {
        // Prisma foreign key constraint violation
        errorMessage = `Referenced record not found (foreign key constraint failed)`;
      } else if (err?.code === "P2025") {
        errorMessage = `Referenced record not found`;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      results.push({ row: rowNum, status: "error", error: errorMessage });
    }
  }

  return {
    total: rows.length,
    succeeded,
    failed,
    results,
  };
}
