import { useEffect, useState, useMemo } from "react";
import { studentTrackerApi } from "../../../api/studentTracker";

type Tab = "students" | "attendance";

interface Student {
  id: string;
  name: string;
  age: number;
  guardianName: string;
  guardianPhone: string | null;
  batch: string;
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

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  ABSENT: "bg-red-100 text-red-700",
  LATE: "bg-yellow-100 text-yellow-700",
};

export default function StudentTrackerPage() {
  const [tab, setTab] = useState<Tab>("students");

  const tabs: { key: Tab; label: string }[] = [
    { key: "students", label: "Students" },
    { key: "attendance", label: "Attendance" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Student Tracker</h2>

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

      {tab === "students" && <StudentsTab />}
      {tab === "attendance" && <AttendanceTab />}
    </div>
  );
}

/* ───────────── Students Tab ───────────── */

function StudentsTab() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<Student | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", guardianName: "", guardianPhone: "", batch: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadStudents = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterBatch) params.batch = filterBatch;
      if (filterActive) params.isActive = filterActive;
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
  }, [filterBatch, filterActive]);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.guardianName.trim() || !form.batch.trim() || !form.age) {
      setFormError("Name, age, guardian name, and batch are required.");
      return;
    }
    setSubmitting(true);
    try {
      await studentTrackerApi.createStudent({
        name: form.name.trim(),
        age: parseInt(form.age),
        guardianName: form.guardianName.trim(),
        guardianPhone: form.guardianPhone.trim() || undefined,
        batch: form.batch.trim(),
      });
      setForm({ name: "", age: "", guardianName: "", guardianPhone: "", batch: "" });
      setShowForm(false);
      await loadStudents();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to create student.");
    } finally {
      setSubmitting(false);
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
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "Add Student"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded border border-gray-200 bg-gray-50 p-4 space-y-3">
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
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Student"}
          </button>
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
                {["Name", "Age", "Guardian", "Batch", "Status", "Enrolled"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
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
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StudentRow({
  student,
  expanded,
  expandedData,
  onToggle,
}: {
  student: Student;
  expanded: boolean;
  expandedData: Student | null;
  onToggle: () => void;
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
        <td className="px-4 py-3 text-sm">
          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${student.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
            {student.isActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {new Date(student.enrollmentDate).toLocaleDateString()}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="bg-gray-50 px-6 py-4">
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
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<Record<string, "PRESENT" | "ABSENT" | "LATE">>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [, setExistingAttendance] = useState<AttendanceRecord[]>([]);

  // Load all students to get batch list
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  useEffect(() => {
    studentTrackerApi.getStudents({ isActive: "true" }).then(setAllStudents).catch(() => {});
  }, []);

  const batches = useMemo(() => {
    const set = new Set(allStudents.map((s) => s.batch));
    return Array.from(set).sort();
  }, [allStudents]);

  const loadBatchStudents = async () => {
    if (!batch) return;
    setLoading(true);
    setMessage("");
    try {
      const [studentData, attendanceData] = await Promise.all([
        studentTrackerApi.getStudents({ batch, isActive: "true" }),
        studentTrackerApi.getAttendance({ batch, date }),
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
  }, [batch, date]);

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
