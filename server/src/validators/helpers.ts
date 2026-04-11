import { z } from "zod";

/**
 * Shared Zod helpers that treat empty/whitespace-only strings as "not provided" (undefined).
 * This is essential for CSV bulk imports where blank cells arrive as "" instead of undefined.
 */

/** Matches "" and transforms it to undefined */
export const emptyToUndefined = z.literal("").transform(() => undefined);

/** Optional string — "" becomes undefined, non-empty must be at least 1 char */
export const optionalString = z.string().min(1).optional().or(emptyToUndefined);

/** Optional email — "" becomes undefined, non-empty must be valid email */
export const optionalEmail = z.string().email().optional().or(emptyToUndefined);

/** Optional UUID — "" becomes undefined, non-empty must be valid UUID */
export const optionalUuid = z.string().uuid().optional().or(emptyToUndefined);

/** Optional nullable UUID — "" becomes undefined, also accepts null */
export const optionalNullableUuid = z.string().uuid().optional().nullable().or(emptyToUndefined);
