/**
 * Single source of truth for SAGE Euphoria 2026 festival dates.
 */
export const FEST_DATES = ["28", "29", "30"] as const;
export const FEST_MONTH = "OCTOBER";
export const FEST_YEAR = "2026";

/** Formatted line for inline references, e.g., "28 · 29 · 30 OCTOBER 2026" */
export const FEST_DATES_LINE = `${FEST_DATES.join(" · ")} ${FEST_MONTH} ${FEST_YEAR}`;

/** Festival countdown start ISO string */
export const EUPHORIA_START_DATE = "2026-10-28T10:00:00+05:30";
