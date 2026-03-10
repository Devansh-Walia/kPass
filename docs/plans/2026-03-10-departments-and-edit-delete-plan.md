# Departments + Edit/Delete Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add department-based app assignment and fill edit/delete gaps across all 12 app modules.

**Architecture:** New Department/DepartmentApp/UserDepartment models with auto-assignment on department toggle. Add `source` field to UserApp to distinguish manual vs department assignments. Add edit forms (reusing create forms) and admin-only delete endpoints across all apps. Shared ConfirmDialog component for delete confirmation.

**Tech Stack:** Prisma (migrations), Express routes/services, React (forms, modals), TailwindCSS

---

## Phase 1: Shared Components + Schema

### Task 1: ConfirmDialog Component

**Files:**
- Create: `client/src/components/common/ConfirmDialog.tsx`

**Step 1: Create the ConfirmDialog component**

```tsx
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd client && npx vite build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add client/src/components/common/ConfirmDialog.tsx
git commit -m "feat: add shared ConfirmDialog component"
```

### Task 2: Prisma Schema — Department Models + UserApp Source

**Files:**
- Modify: `server/prisma/schema.prisma`

**Step 1: Add Department, DepartmentApp, UserDepartment models and source field to UserApp**

Add after the `App` model:

```prisma
model Department {
  id          String           @id @default(uuid())
  name        String           @unique
  slug        String           @unique
  users       UserDepartment[]
  defaultApps DepartmentApp[]
  createdAt   DateTime         @default(now())
}

model DepartmentApp {
  departmentId String
  department   Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  appId        String
  app          App        @relation(fields: [appId], references: [id], onDelete: Cascade)
  @@id([departmentId, appId])
}

model UserDepartment {
  userId       String
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  departmentId String
  department   Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  assignedAt   DateTime   @default(now())
  @@id([userId, departmentId])
}
```

Add to existing `UserApp` model:

```prisma
  source       String   @default("manual") // "manual" | "department"
```

Add relations to `User` model:

```prisma
  departments    UserDepartment[]
```

Add relation to `App` model:

```prisma
  departments    DepartmentApp[]
```

**Step 2: Run migration**

Run: `cd server && npx prisma migrate dev --name add-departments`
Expected: Migration succeeds

**Step 3: Commit**

```bash
git add server/prisma/
git commit -m "feat: add Department models and UserApp source field"
```

### Task 3: Seed Departments

**Files:**
- Modify: `server/prisma/seed.ts`

**Step 1: Add department seeding after app seeding**

```typescript
  // Create departments with default app mappings
  const departments = [
    { name: "COE", slug: "coe", appSlugs: ["task-board"] },
    { name: "HR", slug: "hr", appSlugs: ["people-directory", "attendance"] },
    { name: "Pathshala", slug: "pathshala", appSlugs: ["student-tracker"] },
    { name: "CDK", slug: "cdk", appSlugs: ["needs-registry"] },
    { name: "Marketing", slug: "marketing", appSlugs: ["ideation", "content-calendar"] },
    { name: "PR", slug: "pr", appSlugs: ["event-manager"] },
    { name: "Art & Craft", slug: "art-craft", appSlugs: ["workshop-tracker"] },
    { name: "Sales", slug: "sales", appSlugs: ["donor-mgmt"] },
    { name: "Finance", slug: "finance-dept", appSlugs: ["finance"] },
  ];

  for (const dept of departments) {
    const department = await prisma.department.upsert({
      where: { slug: dept.slug },
      update: {},
      create: { name: dept.name, slug: dept.slug },
    });

    for (const appSlug of dept.appSlugs) {
      const app = await prisma.app.findUnique({ where: { slug: appSlug } });
      if (app) {
        await prisma.departmentApp.upsert({
          where: { departmentId_appId: { departmentId: department.id, appId: app.id } },
          update: {},
          create: { departmentId: department.id, appId: app.id },
        });
      }
    }
  }
```

**Step 2: Run seed**

Run: `cd server && npx tsx prisma/seed.ts`
Expected: "Seed complete"

**Step 3: Commit**

```bash
git add server/prisma/seed.ts
git commit -m "feat: seed departments with default app mappings"
```

## Phase 2: Department Backend

### Task 4: Department Service + Routes

**Files:**
- Create: `server/src/services/departmentService.ts`
- Create: `server/src/routes/departments.ts`
- Modify: `server/src/app.ts` (mount route)

**Step 1: Create department service**

```typescript
// server/src/services/departmentService.ts
import { prisma } from "../lib/prisma.js";

export const departmentService = {
  listAll: () =>
    prisma.department.findMany({
      include: { defaultApps: { include: { app: { select: { id: true, name: true, slug: true } } } } },
      orderBy: { name: "asc" },
    }),

  assignUser: async (userId: string, departmentId: string, assignedById: string) => {
    // Add user to department
    await prisma.userDepartment.create({
      data: { userId, departmentId },
    });

    // Get department's default apps
    const deptApps = await prisma.departmentApp.findMany({
      where: { departmentId },
      select: { appId: true },
    });

    // Auto-assign department apps
    if (deptApps.length > 0) {
      await prisma.userApp.createMany({
        data: deptApps.map(da => ({
          userId,
          appId: da.appId,
          assignedById,
          source: "department",
        })),
        skipDuplicates: true,
      });
    }
  },

  removeUser: async (userId: string, departmentId: string) => {
    // Get department's default apps
    const deptApps = await prisma.departmentApp.findMany({
      where: { departmentId },
      select: { appId: true },
    });

    // Remove department-sourced app assignments
    if (deptApps.length > 0) {
      await prisma.userApp.deleteMany({
        where: {
          userId,
          appId: { in: deptApps.map(da => da.appId) },
          source: "department",
        },
      });
    }

    // Remove user from department
    await prisma.userDepartment.delete({
      where: { userId_departmentId: { userId, departmentId } },
    });
  },
};
```

**Step 2: Create department routes**

```typescript
// server/src/routes/departments.ts
import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { departmentService } from "../services/departmentService.js";

const router = Router();
router.use(authenticate, requireAdmin);

// GET /api/departments — list all with default apps
router.get("/", async (_req, res) => {
  const departments = await departmentService.listAll();
  res.json({ data: departments });
});

// POST /api/users/:id/departments — assign user to department
router.post("/users/:id", async (req, res) => {
  const { departmentId } = req.body;
  await departmentService.assignUser(req.params.id, departmentId, req.user!.id);
  res.status(201).json({ data: { message: "Department assigned" } });
});

// DELETE /api/users/:id/departments/:deptId — remove user from department
router.delete("/users/:id/:deptId", async (req, res) => {
  await departmentService.removeUser(req.params.id, req.params.deptId);
  res.json({ data: { message: "Department removed" } });
});

export default router;
```

**Step 3: Mount in app.ts**

Add import and mount in `server/src/app.ts`:

```typescript
import departmentRoutes from "./routes/departments.js";
// Mount after existing routes:
app.use("/api/departments", departmentRoutes);
```

**Step 4: Update userService.getById to include departments**

In `server/src/services/userService.ts`, update the `getById` select to include:

```typescript
  getById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true,
        apps: { include: { app: true }, },
        departments: { include: { department: true } },
      },
    }),
```

**Step 5: Test manually**

Run: `cd server && npm run dev`
Then:
```bash
curl -s localhost:4001/api/departments -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```
Expected: List of 9 departments with their default apps

**Step 6: Commit**

```bash
git add server/src/services/departmentService.ts server/src/routes/departments.ts server/src/app.ts server/src/services/userService.ts
git commit -m "feat: add department service and routes"
```

## Phase 3: Department Frontend

### Task 5: Department API Client + UserDetail UI

**Files:**
- Create: `client/src/api/departments.ts`
- Modify: `client/src/pages/admin/UserDetail.tsx`

**Step 1: Create API client**

```typescript
// client/src/api/departments.ts
import { apiClient } from "./client";

export const departmentsApi = {
  list: () => apiClient.get("/departments").then(res => res.data.data),
  assignUser: (userId: string, departmentId: string) =>
    apiClient.post(`/departments/users/${userId}`, { departmentId }).then(res => res.data.data),
  removeUser: (userId: string, departmentId: string) =>
    apiClient.delete(`/departments/users/${userId}/${departmentId}`).then(res => res.data.data),
};
```

**Step 2: Update UserDetail.tsx**

Add departments section above "App Access" section. Add state:

```typescript
const [allDepts, setAllDepts] = useState<any[]>([]);
```

Add to useEffect:

```typescript
departmentsApi.list().then(setAllDepts);
```

Update UserDetailData interface to include:

```typescript
  departments: { department: { id: string; name: string; slug: string } }[];
```

Add new section before the "App Access" div:

```tsx
<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Departments</h3>
  <div className="flex flex-wrap gap-2">
    {allDepts.map(dept => {
      const isAssigned = user.departments.some(d => d.department.id === dept.id);
      const appNames = dept.defaultApps.map((da: any) => da.app.name).join(", ");
      return (
        <button
          key={dept.id}
          onClick={async () => {
            if (isAssigned) {
              await departmentsApi.removeUser(id!, dept.id);
            } else {
              await departmentsApi.assignUser(id!, dept.id);
            }
            const u = await usersApi.getById(id!);
            setUser(u);
          }}
          title={appNames ? `Default apps: ${appNames}` : "No default apps"}
          className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
            isAssigned
              ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
              : "text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          {dept.name}
        </button>
      );
    })}
  </div>
  {user.departments.length > 0 && (
    <p className="text-xs text-gray-400 mt-3">
      Apps from departments are auto-assigned. Hover department buttons to see which apps they grant.
    </p>
  )}
</div>
```

In the App Access section, mark department-sourced apps differently. Update the apps list to show source:

Update UserDetailData apps type:

```typescript
  apps: { app: { id: string; name: string; slug: string }; source: string }[];
```

Update the apps render:

```tsx
{user.apps.map(({ app, source }) => (
  <div key={app.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-900">{app.name}</span>
      {source === "department" && (
        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded">dept</span>
      )}
    </div>
    {source === "manual" && (
      <button onClick={() => handleRevokeApp(app.id)} className="text-xs text-red-600 hover:text-red-800">Revoke</button>
    )}
  </div>
))}
```

**Step 3: Verify build**

Run: `cd client && npx vite build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add client/src/api/departments.ts client/src/pages/admin/UserDetail.tsx
git commit -m "feat: add department assignment UI in admin user detail"
```

## Phase 4: Edit/Delete for All App Modules

Each task below follows the same pattern: add delete route + service method on backend, add edit form + delete button on frontend. Tasks are grouped by app for efficiency.

### Task 6: Finance — Edit/Delete Transactions + Category Management

**Files:**
- Modify: `server/src/services/financeService.ts` — add `deleteTransaction`, `deleteCategory`
- Modify: `server/src/routes/finance.ts` — add `DELETE /transactions/:id`, `DELETE /categories/:id`
- Modify: `client/src/pages/apps/finance/FinanceDashboard.tsx` — add edit form for transactions, delete buttons, category create UI

**Step 1: Add backend delete methods**

In `financeService.ts`, add:

```typescript
  deleteTransaction: (id: string) =>
    prisma.transaction.delete({ where: { id } }),

  deleteCategory: (id: string) =>
    prisma.financeCategory.delete({ where: { id } }),
```

**Step 2: Add delete routes**

In `finance.ts`, add:

```typescript
router.delete("/transactions/:id", async (req, res) => {
  await financeService.deleteTransaction(req.params.id);
  res.json({ data: { message: "Transaction deleted" } });
});

router.delete("/categories/:id", async (req, res) => {
  await financeService.deleteCategory(req.params.id);
  res.json({ data: { message: "Category deleted" } });
});
```

**Step 3: Update FinanceDashboard.tsx**

- Add edit mode to transaction rows (click to edit, pre-fill form, call existing `financeApi.createTransaction` but replace with an update API if needed — note: backend has no update transaction route, so add `PATCH /transactions/:id` route + service too)
- Add category management: list categories with create form in Overview tab
- Add delete buttons with ConfirmDialog on transactions and categories
- Import `ConfirmDialog` from common components
- Import `useAuth` to check if user is ADMIN for showing delete buttons

**Step 4: Also add update transaction**

In `financeService.ts`:
```typescript
  updateTransaction: (id: string, data: Partial<{ amount: number; type: any; categoryId: string; description: string; date: Date }>) =>
    prisma.transaction.update({ where: { id }, data }),
```

In `finance.ts`:
```typescript
router.patch("/transactions/:id", async (req, res) => {
  const body = createTransactionSchema.partial().parse(req.body);
  const transaction = await financeService.updateTransaction(req.params.id, body);
  res.json({ data: transaction });
});
```

In `client/src/api/finance.ts`, add:
```typescript
  updateTransaction: (id: string, data: any) => apiClient.patch(`/apps/finance/transactions/${id}`, data).then(res => res.data.data),
  deleteTransaction: (id: string) => apiClient.delete(`/apps/finance/transactions/${id}`).then(res => res.data.data),
  deleteCategory: (id: string) => apiClient.delete(`/apps/finance/categories/${id}`).then(res => res.data.data),
```

**Step 5: Commit**

```bash
git add server/src/services/financeService.ts server/src/routes/finance.ts client/src/pages/apps/finance/FinanceDashboard.tsx client/src/api/finance.ts
git commit -m "feat: add edit/delete for finance transactions and categories"
```

### Task 7: CRM — Edit/Delete Contacts, Deals, Activities

**Files:**
- Modify: `server/src/services/crmService.ts` — add `deleteContact`, `deleteDeal`, `deleteActivity`
- Modify: `server/src/routes/crm.ts` — add `DELETE` routes
- Modify: `client/src/api/crm.ts` — add delete methods
- Modify: `client/src/pages/apps/crm/CrmLayout.tsx` — add edit forms, delete buttons

**Step 1: Backend — add delete methods to crmService**

```typescript
  deleteContact: (id: string) => prisma.contact.delete({ where: { id } }),
  deleteDeal: (id: string) => prisma.deal.delete({ where: { id } }),
  deleteActivity: (id: string) => prisma.activity.delete({ where: { id } }),
```

**Step 2: Backend — add delete routes to crm.ts**

```typescript
router.delete("/contacts/:id", async (req, res) => {
  await crmService.deleteContact(req.params.id);
  res.json({ data: { message: "Contact deleted" } });
});

router.delete("/deals/:id", async (req, res) => {
  await crmService.deleteDeal(req.params.id);
  res.json({ data: { message: "Deal deleted" } });
});

router.delete("/activities/:id", async (req, res) => {
  await crmService.deleteActivity(req.params.id);
  res.json({ data: { message: "Activity deleted" } });
});
```

**Step 3: Frontend API — add delete methods to crm.ts**

```typescript
  deleteContact: (id: string) => apiClient.delete(`/apps/crm/contacts/${id}`).then(res => res.data.data),
  deleteDeal: (id: string) => apiClient.delete(`/apps/crm/deals/${id}`).then(res => res.data.data),
  deleteActivity: (id: string) => apiClient.delete(`/apps/crm/activities/${id}`).then(res => res.data.data),
```

**Step 4: Frontend — update CrmLayout.tsx**

- Contact edit: inline edit form on click (reuse create fields, pre-filled, call `crmApi.updateContact`)
- Deal edit: click deal card to edit title/value (call `crmApi.updateDeal`)
- Delete buttons for contacts/deals/activities with ConfirmDialog (admin only)

**Step 5: Commit**

```bash
git add server/src/services/crmService.ts server/src/routes/crm.ts client/src/api/crm.ts client/src/pages/apps/crm/CrmLayout.tsx
git commit -m "feat: add edit/delete for CRM contacts, deals, and activities"
```

### Task 8: Task Board — Edit Task Details + Assignee Picker

**Files:**
- Modify: `client/src/pages/apps/taskBoard/TaskBoardPage.tsx` — add edit task form, assignee picker
- Modify: `client/src/api/taskBoard.ts` — add missing methods if needed

**Step 1: Update TaskBoardPage.tsx**

- Add edit mode for tasks: click task card to open edit form with title, description, priority, due date, assignee
- Add user list fetch for assignee picker (use `usersApi.list()`)
- Board delete button (admin only) with ConfirmDialog

**Step 2: Backend — add board delete**

In `taskBoardService.ts`:
```typescript
  deleteBoard: (id: string) => prisma.board.delete({ where: { id } }),
```

In `taskBoard.ts`:
```typescript
router.delete("/boards/:id", async (req, res) => {
  await taskBoardService.deleteBoard(req.params.id);
  res.json({ data: { message: "Board deleted" } });
});
```

In `client/src/api/taskBoard.ts`:
```typescript
  deleteBoard: (id: string) => apiClient.delete(`/apps/task-board/boards/${id}`).then(res => res.data.data),
```

**Step 3: Commit**

```bash
git add server/src/services/taskBoardService.ts server/src/routes/taskBoard.ts client/src/api/taskBoard.ts client/src/pages/apps/taskBoard/TaskBoardPage.tsx
git commit -m "feat: add task editing, assignee picker, and board deletion"
```

### Task 9: Student Tracker — Edit Students + Attendance Report

**Files:**
- Modify: `server/src/routes/studentTracker.ts` — add `GET /report`, `DELETE /students/:id`
- Modify: `server/src/services/studentTrackerService.ts` — add `deleteStudent`
- Modify: `client/src/api/studentTracker.ts` — add `getReport`, `deleteStudent`
- Modify: `client/src/pages/apps/studentTracker/StudentTrackerPage.tsx` — add edit form, Report tab, delete

**Step 1: Backend — add report route (service method already exists)**

In `studentTracker.ts`:
```typescript
router.get("/report", async (req, res) => {
  const { batch, startDate, endDate } = req.query;
  if (!batch || !startDate || !endDate) return res.status(400).json({ error: "batch, startDate, and endDate are required" });
  const report = await studentTrackerService.getAttendanceReport(
    batch as string, new Date(startDate as string), new Date(endDate as string)
  );
  res.json({ data: report });
});

router.delete("/students/:id", async (req, res) => {
  await studentTrackerService.deleteStudent(req.params.id);
  res.json({ data: { message: "Student deleted" } });
});
```

**Step 2: Backend service**

In `studentTrackerService.ts`, add:
```typescript
  deleteStudent: (id: string) => prisma.student.delete({ where: { id } }),
```

**Step 3: Frontend API**

In `client/src/api/studentTracker.ts`, add:
```typescript
  getReport: (batch: string, startDate: string, endDate: string) =>
    apiClient.get(`/apps/student-tracker/report?batch=${batch}&startDate=${startDate}&endDate=${endDate}`).then(res => res.data.data),
  deleteStudent: (id: string) => apiClient.delete(`/apps/student-tracker/students/${id}`).then(res => res.data.data),
```

**Step 4: Frontend — update StudentTrackerPage.tsx**

- Add 3rd tab: "Report" — select batch + date range, show attendance stats per student
- Add edit student form (click student to edit, pre-fill, call `updateStudent`)
- Add delete button (admin only) with ConfirmDialog

**Step 5: Commit**

```bash
git add server/src/routes/studentTracker.ts server/src/services/studentTrackerService.ts client/src/api/studentTracker.ts client/src/pages/apps/studentTracker/StudentTrackerPage.tsx
git commit -m "feat: add student edit/delete and attendance report tab"
```

### Task 10: Needs Registry — Edit/Delete Requests

**Files:**
- Modify: `server/src/services/needsRegistryService.ts` — add `deleteRequest`
- Modify: `server/src/routes/needsRegistry.ts` — add `DELETE /requests/:id`
- Modify: `client/src/api/needsRegistry.ts` — add `deleteRequest`
- Modify: `client/src/pages/apps/needsRegistry/NeedsRegistryPage.tsx` — add edit form, delete

**Step 1: Backend**

Service:
```typescript
  deleteRequest: (id: string) => prisma.needRequest.delete({ where: { id } }),
```

Route:
```typescript
router.delete("/requests/:id", async (req, res) => {
  await needsRegistryService.deleteRequest(req.params.id);
  res.json({ data: { message: "Request deleted" } });
});
```

**Step 2: Frontend API**

```typescript
  deleteRequest: (id: string) => apiClient.delete(`/apps/needs-registry/requests/${id}`).then(res => res.data.data),
```

**Step 3: Frontend — update page**

- Edit request: click to open edit form (child name, category, description)
- Delete button (admin only) with ConfirmDialog

**Step 4: Commit**

```bash
git add server/src/services/needsRegistryService.ts server/src/routes/needsRegistry.ts client/src/api/needsRegistry.ts client/src/pages/apps/needsRegistry/NeedsRegistryPage.tsx
git commit -m "feat: add edit/delete for needs registry requests"
```

### Task 11: People Directory — Edit Employees + Active Filter

**Files:**
- Modify: `server/src/services/peopleDirectoryService.ts` — add `deleteEmployee`
- Modify: `server/src/routes/peopleDirectory.ts` — add `DELETE /employees/:id`
- Modify: `client/src/api/peopleDirectory.ts` — add `deleteEmployee`
- Modify: `client/src/pages/apps/peopleDirectory/PeopleDirectoryPage.tsx` — add edit form, active/inactive filter, delete

**Step 1: Backend**

Service:
```typescript
  deleteEmployee: (id: string) => prisma.employee.delete({ where: { id } }),
```

Route:
```typescript
router.delete("/employees/:id", async (req, res) => {
  await peopleDirectoryService.deleteEmployee(req.params.id);
  res.json({ data: { message: "Employee deleted" } });
});
```

**Step 2: Frontend API**

```typescript
  deleteEmployee: (id: string) => apiClient.delete(`/apps/people-directory/employees/${id}`).then(res => res.data.data),
```

**Step 3: Frontend — update page**

- Edit employee: click row to open pre-filled edit form, call `updateEmployee`
- Active/inactive toggle filter
- Delete button (admin only) with ConfirmDialog

**Step 4: Commit**

```bash
git add server/src/services/peopleDirectoryService.ts server/src/routes/peopleDirectory.ts client/src/api/peopleDirectory.ts client/src/pages/apps/peopleDirectory/PeopleDirectoryPage.tsx
git commit -m "feat: add edit/delete for employees and active filter"
```

### Task 12: Donor Management — Edit Donors + Delete

**Files:**
- Modify: `server/src/services/donorMgmtService.ts` — add `deleteDonor`, `deleteDonation`
- Modify: `server/src/routes/donorMgmt.ts` — add `DELETE` routes
- Modify: `client/src/api/donorMgmt.ts` — add delete methods
- Modify: `client/src/pages/apps/donorMgmt/DonorMgmtPage.tsx` — add edit form, delete

**Step 1: Backend**

Service:
```typescript
  deleteDonor: (id: string) => prisma.donor.delete({ where: { id } }),
  deleteDonation: (id: string) => prisma.donation.delete({ where: { id } }),
```

Routes:
```typescript
router.delete("/donors/:id", async (req, res) => {
  await donorMgmtService.deleteDonor(req.params.id);
  res.json({ data: { message: "Donor deleted" } });
});

router.delete("/donations/:id", async (req, res) => {
  await donorMgmtService.deleteDonation(req.params.id);
  res.json({ data: { message: "Donation deleted" } });
});
```

**Step 2: Frontend API**

```typescript
  deleteDonor: (id: string) => apiClient.delete(`/apps/donor-mgmt/donors/${id}`).then(res => res.data.data),
  deleteDonation: (id: string) => apiClient.delete(`/apps/donor-mgmt/donations/${id}`).then(res => res.data.data),
```

**Step 3: Frontend — update page**

- Edit donor: click to open edit form (name, email, phone, type, notes), call `updateDonor`
- Delete buttons (admin only) with ConfirmDialog

**Step 4: Commit**

```bash
git add server/src/services/donorMgmtService.ts server/src/routes/donorMgmt.ts client/src/api/donorMgmt.ts client/src/pages/apps/donorMgmt/DonorMgmtPage.tsx
git commit -m "feat: add edit/delete for donors and donations"
```

### Task 13: Ideation — Edit/Delete Ideas

**Files:**
- Modify: `server/src/services/ideationService.ts` — add `deleteIdea`
- Modify: `server/src/routes/ideation.ts` — add `DELETE /ideas/:id`
- Modify: `client/src/api/ideation.ts` — add `deleteIdea`
- Modify: `client/src/pages/apps/ideation/IdeationPage.tsx` — add edit form, delete

**Step 1: Backend**

Service:
```typescript
  deleteIdea: (id: string) => prisma.idea.delete({ where: { id } }),
```

Route:
```typescript
router.delete("/ideas/:id", async (req, res) => {
  await ideationService.deleteIdea(req.params.id);
  res.json({ data: { message: "Idea deleted" } });
});
```

**Step 2: Frontend API**

```typescript
  deleteIdea: (id: string) => apiClient.delete(`/apps/ideation/ideas/${id}`).then(res => res.data.data),
```

**Step 3: Frontend — update page**

- Edit idea: click card to edit title/description, call `updateIdea`
- Delete button (admin only) with ConfirmDialog

**Step 4: Commit**

```bash
git add server/src/services/ideationService.ts server/src/routes/ideation.ts client/src/api/ideation.ts client/src/pages/apps/ideation/IdeationPage.tsx
git commit -m "feat: add edit/delete for ideas"
```

### Task 14: Content Calendar — Delete Posts + Status Filter

**Files:**
- Modify: `server/src/services/contentCalendarService.ts` — add `deletePost`
- Modify: `server/src/routes/contentCalendar.ts` — add `DELETE /posts/:id`
- Modify: `client/src/api/contentCalendar.ts` — add `deletePost`
- Modify: `client/src/pages/apps/contentCalendar/ContentCalendarPage.tsx` — add delete, status filter

**Step 1: Backend**

Service:
```typescript
  deletePost: (id: string) => prisma.contentPost.delete({ where: { id } }),
```

Route:
```typescript
router.delete("/posts/:id", async (req, res) => {
  await contentCalendarService.deletePost(req.params.id);
  res.json({ data: { message: "Post deleted" } });
});
```

**Step 2: Frontend API**

```typescript
  deletePost: (id: string) => apiClient.delete(`/apps/content-calendar/posts/${id}`).then(res => res.data.data),
```

**Step 3: Frontend — update page**

- Add status filter dropdown (All, Draft, Scheduled, Published) in List tab
- Delete button (admin only) with ConfirmDialog

**Step 4: Commit**

```bash
git add server/src/services/contentCalendarService.ts server/src/routes/contentCalendar.ts client/src/api/contentCalendar.ts client/src/pages/apps/contentCalendar/ContentCalendarPage.tsx
git commit -m "feat: add delete posts and status filter for content calendar"
```

### Task 15: Event Manager — Edit Events + Status Changes

**Files:**
- Modify: `server/src/services/eventManagerService.ts` — add `deleteEvent`
- Modify: `server/src/routes/eventManager.ts` — add `DELETE /events/:id`
- Modify: `client/src/api/eventManager.ts` — add `deleteEvent`
- Modify: `client/src/pages/apps/eventManager/EventManagerPage.tsx` — add edit form, status change buttons, delete

**Step 1: Backend**

Service:
```typescript
  deleteEvent: (id: string) => prisma.event.delete({ where: { id } }),
```

Route:
```typescript
router.delete("/events/:id", async (req, res) => {
  await eventManagerService.deleteEvent(req.params.id);
  res.json({ data: { message: "Event deleted" } });
});
```

**Step 2: Frontend API**

```typescript
  deleteEvent: (id: string) => apiClient.delete(`/apps/event-manager/events/${id}`).then(res => res.data.data),
```

**Step 3: Frontend — update page**

- Edit event: click to open edit form (title, date, location, budget, description)
- Status change buttons: PLANNING → CONFIRMED → COMPLETED, or → CANCELLED at any stage
- Delete button (admin only) with ConfirmDialog

**Step 4: Commit**

```bash
git add server/src/services/eventManagerService.ts server/src/routes/eventManager.ts client/src/api/eventManager.ts client/src/pages/apps/eventManager/EventManagerPage.tsx
git commit -m "feat: add event editing, status changes, and deletion"
```

### Task 16: Workshop Tracker — Edit Workshops + Delete

**Files:**
- Modify: `server/src/services/workshopTrackerService.ts` — add `deleteWorkshop`, `removeParticipant`
- Modify: `server/src/routes/workshopTracker.ts` — add `DELETE` routes
- Modify: `client/src/api/workshopTracker.ts` — add delete methods
- Modify: `client/src/pages/apps/workshopTracker/WorkshopTrackerPage.tsx` — add edit form, delete, remove participant

**Step 1: Backend**

Service:
```typescript
  deleteWorkshop: (id: string) => prisma.workshop.delete({ where: { id } }),
  removeParticipant: (id: string) => prisma.workshopParticipant.delete({ where: { id } }),
```

Routes:
```typescript
router.delete("/workshops/:id", async (req, res) => {
  await workshopTrackerService.deleteWorkshop(req.params.id);
  res.json({ data: { message: "Workshop deleted" } });
});

router.delete("/participants/:id", async (req, res) => {
  await workshopTrackerService.removeParticipant(req.params.id);
  res.json({ data: { message: "Participant removed" } });
});
```

**Step 2: Frontend API**

```typescript
  deleteWorkshop: (id: string) => apiClient.delete(`/apps/workshop-tracker/workshops/${id}`).then(res => res.data.data),
  removeParticipant: (id: string) => apiClient.delete(`/apps/workshop-tracker/participants/${id}`).then(res => res.data.data),
```

**Step 3: Frontend — update page**

- Edit workshop: click to open edit form (title, instructor, date, max participants, description, materials)
- Remove participant button per row
- Delete workshop button (admin only) with ConfirmDialog

**Step 4: Commit**

```bash
git add server/src/services/workshopTrackerService.ts server/src/routes/workshopTracker.ts client/src/api/workshopTracker.ts client/src/pages/apps/workshopTracker/WorkshopTrackerPage.tsx
git commit -m "feat: add workshop editing, deletion, and participant removal"
```

## Phase 5: Final Verification

### Task 17: Build + Smoke Test

**Step 1: Build both projects**

```bash
cd server && npx tsc --noEmit
cd ../client && npx vite build
```
Expected: Both succeed with no errors

**Step 2: Restart server and test department endpoints**

```bash
# Login
TOKEN=$(curl -s localhost:4001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@koshishFamily.org","password":"changeme123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# List departments
curl -s localhost:4001/api/departments -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Test delete endpoints (one per app)
curl -s -X DELETE localhost:4001/api/apps/crm/contacts/nonexistent -H "Authorization: Bearer $TOKEN"
# Expected: Prisma error (record not found) — confirms route exists
```

**Step 3: Commit any fixes**

**Step 4: Final commit**

```bash
git commit -m "chore: verify build and smoke test all endpoints"
```
