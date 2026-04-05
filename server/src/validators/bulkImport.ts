import { z } from "zod";

export const bulkImportRequestSchema = z.object({
  entity: z.string().min(1),
  rows: z.array(z.record(z.string(), z.unknown())).min(1, "At least 1 row required").max(1000, "Maximum 1000 rows per import"),
});
