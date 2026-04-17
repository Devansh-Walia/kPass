import { useEffect, useState, useMemo } from "react";
import { studentTrackerApi } from "../../../api/studentTracker";
import { ATTENDANCE_STATUS_COLORS } from "../../../constants";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { useAuth } from "../../../contexts/AuthContext";
import { BulkImportModal } from "../../../components/common/BulkImportModal";

type Tab = "students" | "attendance" | "report";

type StudentLocation = "DIT" | "MALSI";
const STUDENT_LOCATIONS: StudentLocation[] = ["DIT", "MALSI"];

interface Student {
  id: string;
  name: string;
  age: number;
  guardianName: string;
  guardianPhone: string | null;
  batch: string;
  location: StudentLocation | null;
  enrollmentDate: string;
  isActive: boolean;
  createdBy?: { firstName: string; lastName: string };
  attendance?: AttendanceRecord[];
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  student?: { id: string; name: string; batch: string };
  markedBy?: { firstName: string; lastName: string };
}

interface ReportStudent {
  id: string;
  name: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  attendancePercent: number;
}

interface Report {
  total: number;
  present: number;
  absent: number;
  late: number;
  students: ReportStudent[];
}

const STATUS_COLORS: Record<string, string> = {
  PRESENT: ATTENDANCE_STATUS_COLORS.PRESENT,
  ABSENT: ATTENDANCE_STATUS_COLORS.ABSENT,
  LATE: ATTENDANCE_STATUS_COLORS.LATE,
};

export default function StudentTrackerPage() {
  const [tab, setTab] = useState<Tab>("students");
  const [showImport, setShowImport] = useState(false);
  const [importKey, setImportKey] = useState(0);

  const tabs: { key: Tab; label: string }[] = [
    { key: "students", label: "Students" },
    { key: "attendance", label: "Attendance" },
    { key: "report", label: "Report" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Student Tracker</h2>
        <button
          onClick={() => setShowImport(true)}
          className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Import CSV/Excel
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium ${
                tab === t.key
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "students" && <StudentsTab key={importKey} />}
      {tab === "attendance" && <AttendanceTab key={importKey} />}
      {tab === "report" && <ReportTab key={importKey} />}

      <BulkImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        appSlug="student-tracker"
        onComplete={() => setImportKey((k) => k + 1)}
      />
    </div>
  );
}

/* ───────────── Students Tab ───────────── */

function StudentsTab() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<Student | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", age: "", guardianName: "", guardianPhone: "", batch: "", location: "", isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const loadStudents = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterBatch) params.batch = filterBatch;
      if (filterActive) params.isActive = filterActive;
      if (filterLocation) params.location = filterLocation;
      const data = await studentTrackerApi.getStudents(params);
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [filterBatch, filterActive, filterLocation]);

  const batches = useMemo(() => {
    const set = new Set(students.map((s) => s.batch));
    return Array.from(set).sort();
  }, [students]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    setExpandedId(id);
    try {
      const data = await studentTrackerApi.getStudent(id);
      setExpandedData(data);
    } catch {
      setExpandedData(null);
    }
  };

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setForm({
      name: student.name,
      age: String(student.age),
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone || "",
      batch: student.batch,
      location: student.location || "",
      isActive: student.isActive,
    });
    setShowForm(true);
    setFormError("");
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", age: "", guardianName: "", guardianPhone: "", batch: "", location: "", isActive: true });
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.guardianName.trim() || !form.batch.trim() || !form.age) {
      setFormError("Name, age, guardian name, and batch are required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        age: parseInt(form.age),
        guardianName: form.guardianName.trim(),
        guardianPhone: form.guardianPhone.trim() || undefined,
        batch: form.batch.trim(),
        location: form.location || undefined,
      };
      if (editingId) {
        payload.isActive = form.isActive;
        await studentTrackerApi.updateStudent(editingId, payload);
      } else {
        await studentTrackerApi.createStudent(payload);
      }
      cancelForm();
      await loadStudents();
    } catch (err: any) {
      setFormError(err.response?.data?.error || (editingId ? "Failed to update student." : "Failed to create student."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await studentTrackerApi.deleteStudent(deleteTarget.id);
      setDeleteTarget(null);
      if (expandedId === deleteTarget.id) {
        setExpandedId(null);
        setExpandedData(null);
      }
      await loadStudents();
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  };

  const toggleStudentStatus = async (student: Student) => {
    try {
      await studentTrackerApi.updateStudent(student.id, { isActive: !student.isActive });
      await loadStudents();
    } catch {
      // silently fail
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Batch</label>
          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Locations</option>
            {STUDENT_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              cancelForm();
            } else {
              setEditingId(null);
              setForm({ name: "", age: "", guardianName: "", guardianPhone: "", batch: "", location: "", isActive: true });
              setShowForm(true);
            }
          }}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "Add Student"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded border border-gray-200 bg-gray-50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">{editingId ? "Edit Student" : "Add Student"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              required
              type="number"
              min="1"
              placeholder="Age *"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              required
              placeholder="Guardian Name *"
              value={form.guardianName}
              onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              placeholder="Guardian Phone"
              value={form.guardianPhone}
              onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              required
              placeholder="Batch *"
              value={form.batch}
              onChange={(e) => setForm({ ...form, batch: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <select
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select Location</option>
              {STUDENT_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          {editingId && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Active Student
            </label>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingId ? "Update Student" : "Save Student"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelForm}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel Edit
              </button>
            )}
          </div>
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-hidden rounded border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "Age", "Guardian", "Batch", "Location", "Status", "Enrolled", ""].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {students.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                    No students found.
                  </td>
                </tr>
              )}
              {students.map((s) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  expanded={expandedId === s.id}
                  expandedData={expandedId === s.id ? expandedData : null}
                  onToggle={() => toggleExpand(s.id)}
                  onEdit={() => startEdit(s)}
                  onToggleStatus={() => toggleStudentStatus(s)}
                  onDelete={isAdmin ? () => setDeleteTarget(s) : undefined}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Student"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function StudentRow({
  student,
  expanded,
  expandedData,
  onToggle,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  student: Student;
  expanded: boolean;
  expandedData: Student | null;
  onToggle: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete?: () => void;
}) {
  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer hover:bg-gray-50">
        <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{student.age}</td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {student.guardianName}
          {student.guardianPhone && <span className="text-gray-400 ml-1">({student.guardianPhone})</span>}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{student.batch}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{student.location || "—"}</td>
        <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleStatus}
            title={`Click to mark ${student.isActive ? "inactive" : "active"}`}
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors ${student.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {student.isActive ? "Active" : "Inactive"}
          </button>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {new Date(student.enrollmentDate).toLocaleDateString()}
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onEdit}
              className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Edit
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-gray-50 px-6 py-4">
            {!expandedData ? (
              <p className="text-sm text-gray-500">Loading details...</p>
            ) : (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase text-gray-500">Recent Attendance</h4>
                {expandedData.attendance && expandedData.attendance.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {expandedData.attendance.slice(0, 20).map((a) => (
                      <div key={a.id} className="text-xs border border-gray-200 rounded px-2 py-1">
                        <span className="text-gray-500">{new Date(a.date).toLocaleDateString()}</span>{" "}
                        <span className={`inline-block rounded px-1.5 py-0.5 font-medium ${STATUS_COLORS[a.status]}`}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No attendance records.</p>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/* ───────────── Attendance Tab ───────────── */

function AttendanceTab() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [batch, setBatch] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<Record<string, "PRESENT" | "ABSENT" | "LATE">>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [, setExistingAttendance] = useState<AttendanceRecord[]>([]);

  // Load all students to get batch list
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  useEffect(() => {
    const params: any = { isActive: "true" };
    if (location) params.location = location;
    studentTrackerApi.getStudents(params).then(setAllStudents).catch(() => {});
  }, [location]);

  const batches = useMemo(() => {
    const set = new Set(allStudents.map((s) => s.batch));
    return Array.from(set).sort();
  }, [allStudents]);

  const loadBatchStudents = async () => {
    if (!batch) return;
    setLoading(true);
    setMessage("");
    try {
      const studentParams: any = { batch, isActive: "true" };
      if (location) studentParams.location = location;
      const attendanceParams: any = { batch, date };
      if (location) attendanceParams.location = location;
      const [studentData, attendanceData] = await Promise.all([
        studentTrackerApi.getStudents(studentParams),
        studentTrackerApi.getAttendance(attendanceParams),
      ]);
      setStudents(Array.isArray(studentData) ? studentData : []);
      setExistingAttendance(Array.isArray(attendanceData) ? attendanceData : []);

      // Pre-populate records from existing attendance
      const existing: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
      if (Array.isArray(attendanceData)) {
        attendanceData.forEach((a: AttendanceRecord) => {
          existing[a.studentId] = a.status;
        });
      }
      setRecords(existing);
    } catch {
      setStudents([]);
      setExistingAttendance([]);
      setRecords({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (batch && date) {
      loadBatchStudents();
    }
  }, [batch, date, location]);

  const setStatus = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE") => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    const entries = Object.entries(records);
    if (entries.length === 0) {
      setMessage("Mark at least one student's attendance.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      await studentTrackerApi.markAttendance({
        date,
        records: entries.map(([studentId, status]) => ({ studentId, status })),
      });
      setMessage("Attendance saved successfully.");
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Failed to save attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  const markAll = (status: "PRESENT" | "ABSENT" | "LATE") => {
    const updated: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setRecords(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Batch</label>
          <select
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Select Batch</option>
            {batches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Locations</option>
            {STUDENT_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {!batch && <p className="text-sm text-gray-500">Select a batch to mark attendance.</p>}

      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && batch && students.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Mark all:</span>
            {(["PRESENT", "ABSENT", "LATE"] as const).map((status) => (
              <button
                key={status}
                onClick={() => markAll(status)}
                className={`rounded px-3 py-1 text-xs font-medium ${STATUS_COLORS[status]} hover:opacity-80`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {(["PRESENT", "ABSENT", "LATE"] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => setStatus(s.id, status)}
                            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                              records[s.id] === status
                                ? STATUS_COLORS[status] + " ring-2 ring-offset-1 ring-indigo-400"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={submitting}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Attendance"}
            </button>
            {message && (
              <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
                {message}
              </p>
            )}
          </div>
        </>
      )}

      {!loading && batch && students.length === 0 && (
        <p className="text-sm text-gray-500">No active students found in this batch.</p>
      )}
    </div>
  );
}

/* ───────────── Report Tab ───────────── */

function ReportTab() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [batch, setBatch] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    studentTrackerApi.getStudents().then((data) => setAllStudents(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const batches = useMemo(() => {
    const set = new Set(allStudents.map((s) => s.batch));
    return Array.from(set).sort();
  }, [allStudents]);

  const handleGenerate = async () => {
    if (!batch || !startDate || !endDate) {
      setError("Please select a batch and date range.");
      return;
    }
    setError("");
    setLoading(true);
    setReport(null);
    try {
      const params: any = { batch, startDate, endDate };
      if (location) params.location = location;
      const data = await studentTrackerApi.getReport(params.batch, params.startDate, params.endDate, params.location);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Batch</label>
          <select
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Select Batch</option>
            {batches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Locations</option>
            {STUDENT_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {report && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded border border-gray-200 bg-white p-4 text-center">
              <p className="text-xs font-medium uppercase text-gray-500">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{report.total}</p>
            </div>
            <div className="rounded border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-xs font-medium uppercase text-green-600">Present</p>
              <p className="text-2xl font-bold text-green-700">{report.present}</p>
            </div>
            <div className="rounded border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-xs font-medium uppercase text-red-600">Absent</p>
              <p className="text-2xl font-bold text-red-700">{report.absent}</p>
            </div>
            <div className="rounded border border-yellow-200 bg-yellow-50 p-4 text-center">
              <p className="text-xs font-medium uppercase text-yellow-600">Late</p>
              <p className="text-2xl font-bold text-yellow-700">{report.late}</p>
            </div>
          </div>

          {/* Per-student table */}
          {report.students.length > 0 && (
            <div className="overflow-hidden rounded border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Name", "Total", "Present", "Absent", "Late", "Attendance %"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {report.students.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.total}</td>
                      <td className="px-4 py-3 text-sm text-green-600 font-medium">{s.present}</td>
                      <td className="px-4 py-3 text-sm text-red-600 font-medium">{s.absent}</td>
                      <td className="px-4 py-3 text-sm text-yellow-600 font-medium">{s.late}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            s.attendancePercent >= 75
                              ? "bg-green-100 text-green-700"
                              : s.attendancePercent >= 50
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {s.attendancePercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {report.students.length === 0 && (
            <p className="text-sm text-gray-500">No attendance records found for this batch in the selected date range.</p>
          )}
        </div>
      )}
    </div>
  );
}
