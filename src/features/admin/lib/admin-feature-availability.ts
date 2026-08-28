/**
 * Soft-gate admin surfaces that the V3 backend still lacks.
 * Listing, search, CSV export, group contributions, per-user contribution
 * reports, and per-group batch reports are all available.
 */
export const ADMIN_FEATURE_AVAILABILITY = {
  batchTaskListing: true,
  batchTaskSearch: true,
  groupContributions: true,
} as const
