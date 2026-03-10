/**
 * Shared "active / inactive" badge classes used across admin pages
 * and entity tables (users, employees, students, apps).
 */
export function activeStatusBadge(isActive: boolean): string {
  return isActive
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700";
}

export function activeStatusLabel(isActive: boolean): string {
  return isActive ? "Active" : "Inactive";
}

/**
 * Common approval-flow status colors.
 * Reusable for attendance leaves, needs registry, or any PENDING/APPROVED/REJECTED flow.
 */
export const APPROVAL_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  FULFILLED: "bg-green-100 text-green-800",
};

/**
 * Attendance status colors shared between staff attendance and student tracker.
 */
export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-800",
  ABSENT: "bg-red-100 text-red-800",
  LEAVE: "bg-yellow-100 text-yellow-800",
  LATE: "bg-yellow-100 text-yellow-800",
};

/** App-type badge colors for the dashboard. */
export const APP_TYPE_COLORS: Record<string, string> = {
  FINANCE: "bg-emerald-100 text-emerald-700",
  CRM: "bg-blue-100 text-blue-700",
  MARKETING: "bg-orange-100 text-orange-700",
  IDEATION: "bg-purple-100 text-purple-700",
  TASK_BOARD: "bg-sky-100 text-sky-700",
  STUDENT_TRACKER: "bg-amber-100 text-amber-700",
  NEEDS_REGISTRY: "bg-rose-100 text-rose-700",
  HR: "bg-teal-100 text-teal-700",
  ATTENDANCE: "bg-teal-100 text-teal-700",
  CONTENT_CALENDAR: "bg-orange-100 text-orange-700",
  EVENT_MANAGER: "bg-pink-100 text-pink-700",
  WORKSHOP: "bg-indigo-100 text-indigo-700",
  DONOR_MGMT: "bg-cyan-100 text-cyan-700",
  CUSTOM: "bg-gray-100 text-gray-700",
};

/** Friendly display labels for app types. */
export const APP_TYPE_LABELS: Record<string, string> = {
  FINANCE: "Finance",
  CRM: "CRM",
  MARKETING: "Marketing",
  IDEATION: "Ideation",
  TASK_BOARD: "Tasks",
  STUDENT_TRACKER: "Pathshala",
  NEEDS_REGISTRY: "CDK",
  HR: "HR",
  ATTENDANCE: "HR",
  CONTENT_CALENDAR: "Marketing",
  EVENT_MANAGER: "PR",
  WORKSHOP: "Art & Craft",
  DONOR_MGMT: "Sales",
  CUSTOM: "Custom",
};

/** Finance transaction type colors. */
export const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  INCOME: "bg-green-100 text-green-700",
  EXPENSE: "bg-red-100 text-red-700",
};

/** Donor type badge colors. */
export const DONOR_TYPE_COLORS: Record<string, string> = {
  INDIVIDUAL: "bg-blue-100 text-blue-800",
  CORPORATE: "bg-purple-100 text-purple-800",
};
