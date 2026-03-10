# Departments + Edit/Delete for All Apps

## Overview

Two workstreams:
1. **Department-based app assignment** — users belong to departments, departments have default apps, assignment is automatic
2. **Edit/delete across all 12 app modules** — fill the CRUD gaps

## Part 1: Department-Based App Assignment

### Data Model

New Prisma models:

```prisma
model Department {
  id          String              @id @default(uuid())
  name        String              @unique
  slug        String              @unique
  defaultApps DepartmentApp[]
  users       UserDepartment[]
  createdAt   DateTime            @default(now())
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

Add `source` field to existing `UserApp`:

```prisma
model UserApp {
  // ...existing fields...
  source String @default("manual") // "manual" | "department"
}
```

### Seed Data

| Department | Slug | Default Apps |
|------------|------|-------------|
| COE | coe | task-board |
| HR | hr | people-directory, attendance |
| Pathshala | pathshala | student-tracker |
| CDK | cdk | needs-registry |
| Marketing | marketing | ideation, content-calendar |
| PR | pr | event-manager |
| Art & Craft | art-craft | workshop-tracker |
| Sales | sales | donor-mgmt |
| Finance | finance | finance |

### Backend

**New routes:** `server/src/routes/departments.ts`
- `GET /api/departments` — list all departments with their default apps
- `POST /api/users/:id/departments` — assign user to department(s), auto-create UserApp rows with `source: "department"`
- `DELETE /api/users/:id/departments/:deptId` — remove user from department, remove UserApp rows where `source: "department"` for that department's apps

**Updated logic:**
- `DELETE /api/users/:id/apps/:appId` — only allow revoking `source: "manual"` apps. Department apps can only be removed by removing the department.
- `GET /api/users/:id` — include departments in response

### Frontend

**Admin User Detail page:**
- New "Departments" section above the existing "Apps" section
- Toggle buttons for each department (9 buttons)
- Clicking a department toggles assignment, shows which apps it grants
- Individual app assignment section only shows apps NOT covered by departments (or marks department-granted apps as such)

**Dashboard:**
- Show department badge(s) next to user name

## Part 2: Edit/Delete Across All Apps

### Pattern

Every app module gets:
1. **Edit** — click entity row/card to open edit form (reuse create form, pre-filled). All update API methods already exist in frontend API clients.
2. **Delete** — admin-only delete button with confirmation modal. Backend needs new DELETE routes for most entities.

### Per-App Changes

**Finance:**
- Add: edit transaction, delete transaction (admin), category management UI (create)

**CRM:**
- Add: edit contact, edit deal (title/value), delete contact (admin), delete deal (admin), delete activity (admin)

**Task Board:**
- Add: edit task details (title, desc, priority, due date), assignee picker (load users), edit/delete board (admin)

**Attendance:**
- Already mostly complete. No changes needed.

**Needs Registry:**
- Add: edit request, delete request (admin), search/filter by text

**Donor Management:**
- Add: edit donor, delete donor (admin), delete donation (admin)

**People Directory:**
- Add: edit employee, delete employee (admin), active/inactive filter toggle

**Student Tracker:**
- Add: edit student, delete student (admin), attendance report tab (backend has `getAttendanceReport` — add route + UI)

**Ideation:**
- Add: edit idea (title/desc), delete idea (admin)

**Content Calendar:**
- Add: delete post (admin), status filter in list view

**Event Manager:**
- Add: edit event, event status change buttons (PLANNING→CONFIRMED→COMPLETED/CANCELLED), delete event (admin)

**Workshop Tracker:**
- Add: edit workshop, delete workshop (admin), remove participant

### Delete Pattern

All delete endpoints:
- Admin-only (requireAdmin middleware)
- Soft delete where possible (set isActive=false), hard delete for join-table entries
- Frontend: confirmation modal before delete
- Response: `{ data: { message: "..." } }`

### Shared Confirmation Modal

New `client/src/components/common/ConfirmDialog.tsx`:
- Title, message, confirm/cancel buttons
- Destructive styling (red confirm button)
- Reused across all delete actions
