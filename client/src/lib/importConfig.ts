export interface ImportField {
  key: string;
  label: string;
  type: "string" | "number" | "email" | "date" | "enum" | "uuid";
  required: boolean;
  enumValues?: string[];
  description?: string;
}

export interface ImportConfig {
  entityKey: string;
  entityLabel: string;
  apiPath: string;
  templatePath: string;
  fields: ImportField[];
  example: Record<string, any>;
}

/**
 * All import configurations keyed by "{appSlug}/{entity}".
 * Used by the BulkImportModal to know what fields to expect, validate, and send.
 */
export const IMPORT_CONFIGS: Record<string, ImportConfig> = {
  // ─── Finance ───
  "finance/category": {
    entityKey: "category",
    entityLabel: "Finance Category",
    apiPath: "/apps/finance/bulk-import",
    templatePath: "/apps/finance/import-template?entity=category",
    fields: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "type", label: "Type", type: "enum", required: true, enumValues: ["INCOME", "EXPENSE"] },
    ],
    example: { name: "Donations", type: "INCOME" },
  },
  "finance/transaction": {
    entityKey: "transaction",
    entityLabel: "Transaction",
    apiPath: "/apps/finance/bulk-import",
    templatePath: "/apps/finance/import-template?entity=transaction",
    fields: [
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "type", label: "Type", type: "enum", required: true, enumValues: ["INCOME", "EXPENSE"] },
      { key: "categoryId", label: "Category ID", type: "uuid", required: false, description: "Either categoryId or categoryName is required" },
      { key: "categoryName", label: "Category Name", type: "string", required: false, description: "Will resolve to categoryId" },
      { key: "description", label: "Description", type: "string", required: false },
      { key: "date", label: "Date", type: "date", required: true, description: "YYYY-MM-DD format" },
    ],
    example: { amount: 5000, type: "INCOME", categoryName: "Donations", description: "Monthly donation", date: "2025-03-15" },
  },

  // ─── CRM ───
  "crm/contact": {
    entityKey: "contact",
    entityLabel: "Contact",
    apiPath: "/apps/crm/bulk-import",
    templatePath: "/apps/crm/import-template?entity=contact",
    fields: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "email", label: "Email", type: "email", required: false },
      { key: "phone", label: "Phone", type: "string", required: false },
      { key: "company", label: "Company", type: "string", required: false },
      { key: "tags", label: "Tags", type: "string", required: false, description: "Comma-separated list" },
      { key: "notes", label: "Notes", type: "string", required: false },
    ],
    example: { name: "Rahul Sharma", email: "rahul@example.com", phone: "9876543210", company: "TechCorp", tags: "sponsor,corporate", notes: "Met at gala" },
  },
  "crm/deal": {
    entityKey: "deal",
    entityLabel: "Deal",
    apiPath: "/apps/crm/bulk-import",
    templatePath: "/apps/crm/import-template?entity=deal",
    fields: [
      { key: "title", label: "Title", type: "string", required: true },
      { key: "value", label: "Value", type: "number", required: false },
      { key: "stage", label: "Stage", type: "enum", required: false, enumValues: ["LEAD", "CONTACTED", "PROPOSAL", "CLOSED"], description: "Defaults to LEAD" },
      { key: "contactId", label: "Contact ID", type: "uuid", required: false, description: "Either contactId or contactName" },
      { key: "contactName", label: "Contact Name", type: "string", required: false, description: "Will resolve to contactId" },
    ],
    example: { title: "Annual Sponsorship", value: 50000, stage: "LEAD", contactName: "Rahul Sharma" },
  },
  "crm/activity": {
    entityKey: "activity",
    entityLabel: "Activity",
    apiPath: "/apps/crm/bulk-import",
    templatePath: "/apps/crm/import-template?entity=activity",
    fields: [
      { key: "contactId", label: "Contact ID", type: "uuid", required: false, description: "Either contactId or contactName" },
      { key: "contactName", label: "Contact Name", type: "string", required: false, description: "Will resolve to contactId" },
      { key: "type", label: "Type", type: "enum", required: false, enumValues: ["CALL", "EMAIL", "NOTE", "MEETING"] },
      { key: "content", label: "Content", type: "string", required: true },
    ],
    example: { contactName: "Rahul Sharma", type: "CALL", content: "Discussed sponsorship plans" },
  },

  // ─── Task Board ───
  "task-board/board": {
    entityKey: "board",
    entityLabel: "Board",
    apiPath: "/apps/task-board/bulk-import",
    templatePath: "/apps/task-board/import-template?entity=board",
    fields: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "description", label: "Description", type: "string", required: false },
    ],
    example: { name: "Sprint 1", description: "First sprint tasks" },
  },
  "task-board/task": {
    entityKey: "task",
    entityLabel: "Task",
    apiPath: "/apps/task-board/bulk-import",
    templatePath: "/apps/task-board/import-template?entity=task",
    fields: [
      { key: "title", label: "Title", type: "string", required: true },
      { key: "description", label: "Description", type: "string", required: false },
      { key: "priority", label: "Priority", type: "enum", required: false, enumValues: ["LOW", "MEDIUM", "HIGH"], description: "Defaults to MEDIUM" },
      { key: "dueDate", label: "Due Date", type: "date", required: false, description: "YYYY-MM-DD format" },
      { key: "boardId", label: "Board ID", type: "uuid", required: false, description: "Either boardId or boardName" },
      { key: "boardName", label: "Board Name", type: "string", required: false, description: "Will resolve to boardId" },
    ],
    example: { title: "Design landing page", priority: "HIGH", dueDate: "2025-04-01", boardName: "Sprint 1" },
  },

  // ─── Student Tracker ───
  "student-tracker/student": {
    entityKey: "student",
    entityLabel: "Student",
    apiPath: "/apps/student-tracker/bulk-import",
    templatePath: "/apps/student-tracker/import-template?entity=student",
    fields: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "age", label: "Age", type: "number", required: true },
      { key: "guardianName", label: "Guardian Name", type: "string", required: true },
      { key: "guardianPhone", label: "Guardian Phone", type: "string", required: false },
      { key: "batch", label: "Batch", type: "string", required: true },
      { key: "location", label: "Location", type: "enum", required: false, enumValues: ["DIT", "MALSI"] },
    ],
    example: { name: "Ankit Kumar", age: 12, guardianName: "Rajesh Kumar", guardianPhone: "9876543210", batch: "2025-A", location: "DIT" },
  },

  // ─── Needs Registry ───
  "needs-registry/request": {
    entityKey: "request",
    entityLabel: "Need Request",
    apiPath: "/apps/needs-registry/bulk-import",
    templatePath: "/apps/needs-registry/import-template?entity=request",
    fields: [
      { key: "childName", label: "Child Name", type: "string", required: true },
      { key: "category", label: "Category", type: "enum", required: true, enumValues: ["SANITATION", "HEALTH", "SUPPLIES", "OTHER"] },
      { key: "description", label: "Description", type: "string", required: true },
    ],
    example: { childName: "Priya", category: "SUPPLIES", description: "Needs school bag and notebooks" },
  },

  // ─── People Directory ───
  "people-directory/employee": {
    entityKey: "employee",
    entityLabel: "Employee",
    apiPath: "/apps/people-directory/bulk-import",
    templatePath: "/apps/people-directory/import-template?entity=employee",
    fields: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "email", label: "Email", type: "email", required: false },
      { key: "phone", label: "Phone", type: "string", required: false },
      { key: "department", label: "Department", type: "string", required: true },
      { key: "designation", label: "Designation", type: "string", required: true },
      { key: "joinDate", label: "Join Date", type: "date", required: true, description: "YYYY-MM-DD format" },
    ],
    example: { name: "Priya Singh", email: "priya@koshish.org", phone: "9876543210", department: "COE", designation: "Teacher", joinDate: "2025-01-15" },
  },

  // ─── Attendance ───
  "attendance/leave": {
    entityKey: "leave",
    entityLabel: "Leave Request",
    apiPath: "/apps/attendance/bulk-import",
    templatePath: "/apps/attendance/import-template?entity=leave",
    fields: [
      { key: "employeeId", label: "Employee ID", type: "uuid", required: false, description: "Either employeeId or employeeName" },
      { key: "employeeName", label: "Employee Name", type: "string", required: false, description: "Will resolve to employeeId" },
      { key: "startDate", label: "Start Date", type: "date", required: true, description: "YYYY-MM-DD format" },
      { key: "endDate", label: "End Date", type: "date", required: true, description: "YYYY-MM-DD format" },
      { key: "reason", label: "Reason", type: "string", required: true },
    ],
    example: { employeeName: "Priya Singh", startDate: "2025-03-20", endDate: "2025-03-22", reason: "Family function" },
  },

  // ─── Ideation ───
  "ideation/idea": {
    entityKey: "idea",
    entityLabel: "Idea",
    apiPath: "/apps/ideation/bulk-import",
    templatePath: "/apps/ideation/import-template?entity=idea",
    fields: [
      { key: "title", label: "Title", type: "string", required: true },
      { key: "description", label: "Description", type: "string", required: true },
    ],
    example: { title: "Community garden initiative", description: "Set up a garden for sustainability" },
  },

  // ─── Content Calendar ───
  "content-calendar/post": {
    entityKey: "post",
    entityLabel: "Content Post",
    apiPath: "/apps/content-calendar/bulk-import",
    templatePath: "/apps/content-calendar/import-template?entity=post",
    fields: [
      { key: "title", label: "Title", type: "string", required: true },
      { key: "content", label: "Content", type: "string", required: false },
      { key: "platform", label: "Platform", type: "enum", required: true, enumValues: ["INSTAGRAM", "FACEBOOK", "TWITTER", "OTHER"] },
      { key: "scheduledDate", label: "Scheduled Date", type: "date", required: true, description: "YYYY-MM-DD format" },
      { key: "status", label: "Status", type: "enum", required: false, enumValues: ["DRAFT", "SCHEDULED", "PUBLISHED"], description: "Defaults to DRAFT" },
    ],
    example: { title: "World Environment Day", content: "Join us for a tree-planting drive!", platform: "INSTAGRAM", scheduledDate: "2025-06-05", status: "SCHEDULED" },
  },

  // ─── Event Manager ───
  "event-manager/event": {
    entityKey: "event",
    entityLabel: "Event",
    apiPath: "/apps/event-manager/bulk-import",
    templatePath: "/apps/event-manager/import-template?entity=event",
    fields: [
      { key: "title", label: "Title", type: "string", required: true },
      { key: "description", label: "Description", type: "string", required: false },
      { key: "date", label: "Date", type: "date", required: true, description: "YYYY-MM-DD format" },
      { key: "location", label: "Location", type: "string", required: false },
      { key: "budget", label: "Budget", type: "number", required: false },
    ],
    example: { title: "Annual Day Celebration", description: "Cultural performances", date: "2025-12-15", location: "Community Hall", budget: 25000 },
  },

  // ─── Workshop Tracker ───
  "workshop-tracker/workshop": {
    entityKey: "workshop",
    entityLabel: "Workshop",
    apiPath: "/apps/workshop-tracker/bulk-import",
    templatePath: "/apps/workshop-tracker/import-template?entity=workshop",
    fields: [
      { key: "title", label: "Title", type: "string", required: true },
      { key: "description", label: "Description", type: "string", required: false },
      { key: "date", label: "Date", type: "date", required: true, description: "YYYY-MM-DD format" },
      { key: "instructor", label: "Instructor", type: "string", required: true },
      { key: "materialsNeeded", label: "Materials Needed", type: "string", required: false },
      { key: "maxParticipants", label: "Max Participants", type: "number", required: false },
    ],
    example: { title: "Art & Craft Workshop", description: "Paper craft basics", date: "2025-04-10", instructor: "Meera Patel", materialsNeeded: "Coloured paper, scissors, glue", maxParticipants: 30 },
  },

  // ─── Donor Management ───
  "donor-mgmt/donor": {
    entityKey: "donor",
    entityLabel: "Donor",
    apiPath: "/apps/donor-mgmt/bulk-import",
    templatePath: "/apps/donor-mgmt/import-template?entity=donor",
    fields: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "email", label: "Email", type: "email", required: false },
      { key: "phone", label: "Phone", type: "string", required: false },
      { key: "type", label: "Type", type: "enum", required: true, enumValues: ["INDIVIDUAL", "CORPORATE"] },
      { key: "notes", label: "Notes", type: "string", required: false },
    ],
    example: { name: "Ratan Tata Foundation", email: "grants@tata.org", phone: "0221234567", type: "CORPORATE", notes: "Annual CSR partner" },
  },
  "donor-mgmt/donation": {
    entityKey: "donation",
    entityLabel: "Donation",
    apiPath: "/apps/donor-mgmt/bulk-import",
    templatePath: "/apps/donor-mgmt/import-template?entity=donation",
    fields: [
      { key: "donorId", label: "Donor ID", type: "uuid", required: false, description: "Either donorId or donorName" },
      { key: "donorName", label: "Donor Name", type: "string", required: false, description: "Will resolve to donorId" },
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "date", label: "Date", type: "date", required: true, description: "YYYY-MM-DD format" },
      { key: "purpose", label: "Purpose", type: "string", required: false },
      { key: "receiptNo", label: "Receipt No.", type: "string", required: false },
    ],
    example: { donorName: "Ratan Tata Foundation", amount: 100000, date: "2025-03-01", purpose: "Annual CSR grant", receiptNo: "RCT-2025-001" },
  },
};

/**
 * Get import configs for a given app slug.
 * Returns all entity configs available for that app.
 */
export function getAppImportConfigs(appSlug: string): ImportConfig[] {
  return Object.entries(IMPORT_CONFIGS)
    .filter(([key]) => key.startsWith(appSlug + "/"))
    .map(([, config]) => config);
}
