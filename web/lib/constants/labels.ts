/**
 * CenterType display labels.
 * CenterType remains an enum on the backend (rarely changes).
 * Specialization labels are now fetched from /api/specializations.
 */
export const TYPE_LABELS: Record<string, string> = {
  CLINIC:                 "Clinic",
  HOSPITAL:               "Hospital",
  PRIVATE_PRACTICE:       "Private Practice",
  DIAGNOSTIC_CENTER:      "Diagnostic Center",
  REHABILITATION_CENTER:  "Rehabilitation Center",
};
