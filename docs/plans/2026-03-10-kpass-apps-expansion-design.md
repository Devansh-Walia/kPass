# kPass Apps Expansion — Design Document

## Goal
Add 14 MVP app modules across 8 teams for Koshish Family org. Each app follows the existing Finance/CRM pattern: Prisma models, Express routes with `requireAppAccess`, Zod validators, service layer, and tab-based React UI.

## Architecture
- Single monorepo, same Express server serves all APIs under `/api/apps/<slug>`
- Each app gets its own route file, service, validator, and frontend page
- Access controlled via `requireAppAccess(slug)` middleware + UserApp assignments
- New `AppType` enum values for each app
- All models link to User via `createdById` or similar FK

## Build Order
1. Task Board → 2. Student Tracker → 3. Needs Registry → 4. People Directory → 5. Attendance → 6. Ideation → 7. Content Calendar → 8. Event Manager → 9. Workshop Tracker → 10. Donor/Sponsor Mgmt

---

## App Designs

### 1. Task Board (COE) — slug: `task-board`

**Models:**
- `Board` — id, name, description, createdById, createdAt
- `TaskCard` — id, title, description, status (TODO/IN_PROGRESS/REVIEW/DONE), priority (LOW/MEDIUM/HIGH), assigneeId?, boardId, dueDate?, createdById, createdAt, updatedAt

**API:**
- GET/POST `/api/apps/task-board/boards`
- GET/PATCH/DELETE `/api/apps/task-board/boards/:id`
- GET/POST `/api/apps/task-board/boards/:boardId/tasks`
- PATCH `/api/apps/task-board/tasks/:id`

**UI:** Board list → Kanban columns (TODO, IN_PROGRESS, REVIEW, DONE) with task cards. Click status to move. Create/edit task modal.

---

### 2. Student Tracker (Pathshala) — slug: `student-tracker`

**Models:**
- `Student` — id, name, age, guardianName, guardianPhone, batch, enrollmentDate, isActive, createdById, createdAt, updatedAt
- `StudentAttendance` — id, studentId, date, status (PRESENT/ABSENT/LATE), markedById, createdAt

**API:**
- GET/POST `/api/apps/student-tracker/students`
- GET/PATCH `/api/apps/student-tracker/students/:id`
- GET/POST `/api/apps/student-tracker/attendance`
- GET `/api/apps/student-tracker/attendance/report`

**UI:** Student list with batch filter → Student detail with attendance history. Batch-wise daily attendance marking view.

---

### 3. Needs Registry (CDK) — slug: `needs-registry`

**Models:**
- `NeedRequest` — id, childName, category (SANITATION/HEALTH/SUPPLIES/OTHER), description, status (PENDING/APPROVED/FULFILLED/REJECTED), requestedById, approvedById?, fulfilledAt?, createdAt, updatedAt

**API:**
- GET/POST `/api/apps/needs-registry/requests`
- PATCH `/api/apps/needs-registry/requests/:id` (status changes)

**UI:** Tab-filtered list (Pending/Approved/Fulfilled/All). Create request form. Approve/fulfill/reject actions.

---

### 4. People Directory (HR) — slug: `people-directory`

**Models:**
- `Employee` — id, name, email, phone, department, designation, joinDate, isActive, userId?, createdAt, updatedAt

**API:**
- GET/POST `/api/apps/people-directory/employees`
- GET/PATCH `/api/apps/people-directory/employees/:id`

**UI:** Searchable directory with department filter. Employee detail card.

---

### 5. Attendance (HR) — slug: `attendance`

**Models:**
- `StaffAttendance` — id, employeeId, date, checkIn?, checkOut?, status (PRESENT/ABSENT/LEAVE), markedById, createdAt
- `LeaveRequest` — id, employeeId, startDate, endDate, reason, status (PENDING/APPROVED/REJECTED), reviewedById?, createdAt, updatedAt

**API:**
- GET/POST `/api/apps/attendance/daily`
- GET `/api/apps/attendance/report`
- GET/POST `/api/apps/attendance/leaves`
- PATCH `/api/apps/attendance/leaves/:id`

**UI:** Daily attendance marking. Leave requests list + create. Monthly report table.

---

### 6. Ideation (Marketing) — slug: `ideation`

**Models:**
- `Idea` — id, title, description, stage (IDEA/APPROVED/IN_PROGRESS/DONE), votes, createdById, createdAt, updatedAt

**API:**
- GET/POST `/api/apps/ideation/ideas`
- PATCH `/api/apps/ideation/ideas/:id`
- POST `/api/apps/ideation/ideas/:id/vote`

**UI:** Stage-column board view. Create idea form. Vote button. Move between stages.

---

### 7. Content Calendar (Marketing) — slug: `content-calendar`

**Models:**
- `ContentPost` — id, title, platform (INSTAGRAM/FACEBOOK/TWITTER/OTHER), scheduledDate, status (DRAFT/SCHEDULED/PUBLISHED), content, createdById, createdAt, updatedAt

**API:**
- GET/POST `/api/apps/content-calendar/posts`
- PATCH `/api/apps/content-calendar/posts/:id`

**UI:** Calendar month view with colored dots per platform. Create/edit post. Filter by platform/status.

---

### 8. Event Manager (PR) — slug: `event-manager`

**Models:**
- `Event` — id, title, description, date, location, status (PLANNING/CONFIRMED/COMPLETED/CANCELLED), budget?, createdById, createdAt, updatedAt
- `EventVolunteer` — eventId, userId, role, createdAt

**API:**
- GET/POST `/api/apps/event-manager/events`
- GET/PATCH `/api/apps/event-manager/events/:id`
- POST/DELETE `/api/apps/event-manager/events/:id/volunteers`

**UI:** Event list (upcoming/past tabs). Event detail with volunteer list. Create event + assign volunteers.

---

### 9. Workshop Tracker (Art & Craft) — slug: `workshop-tracker`

**Models:**
- `Workshop` — id, title, description, date, instructor, materialsNeeded?, maxParticipants?, createdById, createdAt, updatedAt
- `WorkshopParticipant` — id, workshopId, studentName, attended, createdAt

**API:**
- GET/POST `/api/apps/workshop-tracker/workshops`
- GET/PATCH `/api/apps/workshop-tracker/workshops/:id`
- POST `/api/apps/workshop-tracker/workshops/:id/participants`
- PATCH `/api/apps/workshop-tracker/participants/:id`

**UI:** Workshop list (upcoming/past). Workshop detail with participant list + attendance toggle. Create workshop form.

---

### 10. Donor/Sponsor Management (Sales) — slug: `donor-mgmt`

**Models:**
- `Donor` — id, name, email, phone?, type (INDIVIDUAL/CORPORATE), notes?, createdById, createdAt, updatedAt
- `Donation` — id, donorId, amount, date, purpose?, receiptNo?, createdById, createdAt

**API:**
- GET/POST `/api/apps/donor-mgmt/donors`
- GET/PATCH `/api/apps/donor-mgmt/donors/:id`
- GET/POST `/api/apps/donor-mgmt/donations`

**UI:** Donor list with search + type filter. Donor detail with donation history + total. Record donation form.

---

## New AppType Enum Values
Add to existing enum: `TASK_BOARD`, `STUDENT_TRACKER`, `NEEDS_REGISTRY`, `HR`, `ATTENDANCE`, `IDEATION`, `CONTENT_CALENDAR`, `EVENT_MANAGER`, `WORKSHOP`, `DONOR_MGMT`

## Seed Data
Each app gets a seed entry in the App table with name, slug, type, route, description.
