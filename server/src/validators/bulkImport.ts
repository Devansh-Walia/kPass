import { z } from "zod";

export const bulkImportRequestSchema = z.object({
  entity: z.string().min(1),
  rows: z.array(z.record(z.unknown())).min(1).max(1000),
});
